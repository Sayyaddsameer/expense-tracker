/**
 * receiptParser.js
 *
 * On-device receipt parsing engine.
 *
 * Converts raw OCR text (from ML Kit Text Recognition) into a structured
 * expense object. Uses a layered regex + heuristic approach:
 *
 *   1. Split text into lines
 *   2. Extract candidate values via regex patterns
 *   3. Apply heuristics to resolve ambiguity (e.g., pick the largest "total")
 *   4. Calculate per-field confidence scores based on cross-validation rules
 *
 * No network calls are made — everything runs on-device.
 */

// ---------------------------------------------------------------------------
// Constants & regex patterns
// ---------------------------------------------------------------------------

/** Matches a USD price: optional $, digits, dot, 2 decimal places. */
const PRICE_RE = /\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{2}))/;

/** Matches a price at the END of a line (most reliable position). */
const TRAILING_PRICE_RE = /\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{2}))\s*$/;

/** Keywords that indicate a total line. */
const TOTAL_KEYWORDS_RE =
  /\b(total|grand\s*total|amount\s*due|balance\s*due|amount\s*paid|due)\b/i;

/** Keywords that indicate a subtotal line. */
const SUBTOTAL_KEYWORDS_RE = /\b(sub\s*total|subtotal|sub-total)\b/i;

/** Keywords that indicate a tax line. */
const TAX_KEYWORDS_RE = /\b(tax|gst|hst|vat|sales\s*tax|state\s*tax)\b/i;

/** Keywords to EXCLUDE from line items (totals, payments, change, etc.). */
const EXCLUDE_LINE_ITEM_RE =
  /\b(total|subtotal|sub-total|tax|gst|hst|vat|tip|gratuity|change|cash|credit|debit|card|visa|mastercard|amex|discover|discount|coupon|savings|reward|balance|payment|paid|amount|due)\b/i;

/**
 * Date patterns, tried in order.
 * Each entry: [regex, normalizerFn]
 */
const DATE_PATTERNS = [
  // MM/DD/YYYY or MM-DD-YYYY
  [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
    (m) => `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`,
  ],
  // YYYY/MM/DD or YYYY-MM-DD
  [
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
    (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`,
  ],
  // DD-Mon-YY or DD-Mon-YYYY (e.g. 15-MAR-24 / 15-Mar-2024)
  [
    /\b(\d{1,2})[\/\-\s]([A-Za-z]{3,9})[\/\-\s](\d{2,4})\b/,
    (m) => {
      const months = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
      };
      const month = months[m[2].substring(0, 3).toLowerCase()] || "01";
      let year = m[3];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${m[1].padStart(2, "0")}`;
    },
  ],
  // Mon DD, YYYY (e.g. March 15, 2024)
  [
    /\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})\b/,
    (m) => {
      const months = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
      };
      const month = months[m[1].substring(0, 3).toLowerCase()] || "01";
      return `${m[3]}-${month}-${m[2].padStart(2, "0")}`;
    },
  ],
  // MM/DD/YY
  [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/,
    (m) => `20${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`,
  ],
];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Parse a price string, removing commas and dollar signs, into a number.
 * Returns null if parsing fails.
 */
function parsePrice(str) {
  if (!str) return null;
  const cleaned = str.replace(/[$,\s]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : Math.round(val * 100) / 100;
}

/**
 * Extract the trailing price from a line.
 * Returns null if no price is found.
 */
function extractTrailingPrice(line) {
  const match = line.match(TRAILING_PRICE_RE);
  return match ? parsePrice(match[1]) : null;
}

/**
 * Check if two float values are approximately equal (within a small epsilon).
 */
function approxEqual(a, b, epsilon = 0.02) {
  return Math.abs(a - b) <= epsilon;
}

// ---------------------------------------------------------------------------
// Core parsing functions
// ---------------------------------------------------------------------------

/**
 * Extract the merchant name from the top lines of the receipt.
 * Strategy: The first non-empty, non-numeric, non-address-looking line.
 */
function extractMerchant(lines) {
  const addressIndicators = /\b(st|ave|blvd|rd|dr|ln|way|pkwy|hwy|suite|ste|#)\b/i;
  const phoneRe = /\d{3}[\s.\-]\d{3}[\s.\-]\d{4}/;
  const urlRe = /www\.|\.com|\.net|\.org/i;

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Skip lines that look like addresses, phones, URLs, or are purely numeric
    if (addressIndicators.test(line)) continue;
    if (phoneRe.test(line)) continue;
    if (urlRe.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    // Must have at least 3 characters and contain at least one letter
    if (line.length < 3 || !/[A-Za-z]/.test(line)) continue;
    return line;
  }
  return "";
}

/**
 * Extract a purchase date from the raw text.
 * Returns ISO 8601 date string (YYYY-MM-DD) or null.
 */
function extractDate(text) {
  for (const [pattern, normalizer] of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = normalizer(match);
        // Validate the result is a real date
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return dateStr;
      } catch (_) {
        continue;
      }
    }
  }
  return null;
}

/**
 * Extract total, subtotal, and tax values from receipt lines.
 * Returns { total, subtotal, tax } — each may be null.
 */
function extractAmounts(lines) {
  let totalCandidates = [];
  let subtotal = null;
  let tax = null;

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    const price = extractTrailingPrice(line);
    if (price === null || price < 0) continue;

    if (TOTAL_KEYWORDS_RE.test(lineLower) && !SUBTOTAL_KEYWORDS_RE.test(lineLower)) {
      totalCandidates.push(price);
    } else if (SUBTOTAL_KEYWORDS_RE.test(lineLower)) {
      // Use the last subtotal found
      subtotal = price;
    } else if (TAX_KEYWORDS_RE.test(lineLower)) {
      // Some receipts have multiple tax lines — sum them
      tax = tax !== null ? Math.round((tax + price) * 100) / 100 : price;
    }
  }

  // The "total" is usually the largest value among total-keyword lines,
  // as stores sometimes print "total" before the grand total.
  let total = null;
  if (totalCandidates.length > 0) {
    total = Math.max(...totalCandidates);
  }

  return { total, subtotal, tax };
}

/**
 * Extract individual line items from receipt lines.
 * A line item is identified as: text description + trailing price,
 * and NOT matching any excluded keyword (total, tax, subtotal, etc.).
 */
function extractLineItems(lines) {
  const items = [];

  for (const line of lines) {
    if (EXCLUDE_LINE_ITEM_RE.test(line)) continue;

    const price = extractTrailingPrice(line);
    if (price === null || price < 0) continue;

    // Description: everything before the price
    const priceMatch = line.match(TRAILING_PRICE_RE);
    let description = line.substring(0, priceMatch.index).trim();
    // Remove leading/trailing punctuation and whitespace artifacts
    description = description.replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, "").trim();

    if (description.length < 2) continue;
    // Skip lines that are mostly numbers (e.g., barcode lines)
    if (/^\d[\d\s]*$/.test(description)) continue;

    items.push({ description, price });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Confidence scoring
// ---------------------------------------------------------------------------

/**
 * Calculate confidence for each field.
 * Returns an object with keys matching fields, each valued 'high' | 'medium' | 'low'.
 */
function calculateConfidence({ merchant, date, total, subtotal, tax, lineItems }) {
  const confidence = {
    merchant: "high",
    date: "high",
    total: "high",
    tax: "high",
  };

  // ── Merchant ──────────────────────────────────────────────────────────────
  if (!merchant || merchant.length < 2) {
    confidence.merchant = "low";
  } else if (merchant.length < 4) {
    confidence.merchant = "medium";
  }

  // ── Date ──────────────────────────────────────────────────────────────────
  if (!date) {
    confidence.date = "low";
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  if (total === null || total === undefined) {
    confidence.total = "low";
  } else {
    let totalSignals = 0;
    let totalWarnings = 0;

    // Cross-check: subtotal + tax ≈ total
    if (subtotal !== null && tax !== null) {
      const expected = Math.round((subtotal + tax) * 100) / 100;
      if (approxEqual(expected, total)) {
        totalSignals++;
      } else {
        totalWarnings++;
      }
    }

    // Cross-check: sum of line items ≈ subtotal
    if (lineItems.length > 0 && subtotal !== null) {
      const itemsSum = Math.round(lineItems.reduce((s, i) => s + i.price, 0) * 100) / 100;
      if (approxEqual(itemsSum, subtotal, 0.05)) {
        totalSignals++;
      } else {
        totalWarnings++;
      }
    }

    // Cross-check: sum of line items + tax ≈ total
    if (lineItems.length > 0 && tax !== null && subtotal === null) {
      const itemsSum = lineItems.reduce((s, i) => s + i.price, 0);
      const expected = Math.round((itemsSum + tax) * 100) / 100;
      if (approxEqual(expected, total, 0.05)) {
        totalSignals++;
      } else {
        totalWarnings++;
      }
    }

    if (totalWarnings > 0 && totalSignals === 0) {
      confidence.total = "low";
    } else if (totalWarnings > 0) {
      confidence.total = "medium";
    }
  }

  // ── Tax ───────────────────────────────────────────────────────────────────
  if (tax === null || tax === undefined) {
    confidence.tax = "medium"; // tax may legitimately be absent (tax-exempt items)
  }

  return confidence;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse raw OCR text into a structured expense object.
 *
 * @param {string} rawText - The raw text output from ML Kit Text Recognition,
 *                           with blocks sorted top-to-bottom and joined by '\n'.
 * @returns {{
 *   merchant: string,
 *   date: string | null,
 *   lineItems: Array<{description: string, price: number}>,
 *   subtotal: number | null,
 *   tax: number | null,
 *   total: number | null,
 *   confidence: {merchant: string, date: string, total: string, tax: string}
 * }}
 */
export function parseReceipt(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return {
      merchant: "",
      date: null,
      lineItems: [],
      subtotal: null,
      tax: null,
      total: null,
      confidence: {
        merchant: "low",
        date: "low",
        total: "low",
        tax: "low",
      },
    };
  }

  // Normalize: collapse multiple spaces, trim each line, remove empty lines
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s{2,}/g, " ").trim())
    .filter((l) => l.length > 0);

  const merchant = extractMerchant(lines);
  const date = extractDate(rawText);
  const { total, subtotal, tax } = extractAmounts(lines);
  const lineItems = extractLineItems(lines);
  const confidence = calculateConfidence({ merchant, date, total, subtotal, tax, lineItems });

  return {
    merchant,
    date,
    lineItems,
    subtotal,
    tax,
    total,
    confidence,
  };
}

export default parseReceipt;
