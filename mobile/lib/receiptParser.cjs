/**
 * receiptParser.cjs
 *
 * CommonJS wrapper around the ES-module receipt parser.
 * Used by the Jest test suite (Node environment, no transpiler).
 *
 * The parsing logic is duplicated here so the test runner can import it
 * without needing Babel/transpilation. This mirrors the mobile lib exactly.
 */

// ---------------------------------------------------------------------------
// Constants & regex patterns
// ---------------------------------------------------------------------------

const PRICE_RE = /\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{2}))/;
const TRAILING_PRICE_RE = /\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{2}))\s*$/;

const TOTAL_KEYWORDS_RE =
  /\b(total|grand\s*total|amount\s*due|balance\s*due|amount\s*paid|due)\b/i;
const SUBTOTAL_KEYWORDS_RE = /\b(sub\s*total|subtotal|sub-total)\b/i;
const TAX_KEYWORDS_RE = /\b(tax|gst|hst|vat|sales\s*tax|state\s*tax)\b/i;
const EXCLUDE_LINE_ITEM_RE =
  /\b(total|subtotal|sub-total|tax|gst|hst|vat|tip|gratuity|change|cash|credit|debit|card|visa|mastercard|amex|discover|discount|coupon|savings|reward|balance|payment|paid|amount|due)\b/i;

const DATE_PATTERNS = [
  [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
    (m) => `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`,
  ],
  [
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/,
    (m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`,
  ],
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
  [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/,
    (m) => `20${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`,
  ],
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function parsePrice(str) {
  if (!str) return null;
  const cleaned = str.replace(/[$,\s]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : Math.round(val * 100) / 100;
}

function extractTrailingPrice(line) {
  const match = line.match(TRAILING_PRICE_RE);
  return match ? parsePrice(match[1]) : null;
}

function approxEqual(a, b, epsilon = 0.02) {
  return Math.abs(a - b) <= epsilon;
}

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------

function extractMerchant(lines) {
  const addressIndicators = /\b(st|ave|blvd|rd|dr|ln|way|pkwy|hwy|suite|ste|#)\b/i;
  const phoneRe = /\d{3}[\s.\-]\d{3}[\s.\-]\d{4}/;
  const urlRe = /www\.|\.com|\.net|\.org/i;

  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (addressIndicators.test(line)) continue;
    if (phoneRe.test(line)) continue;
    if (urlRe.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    if (line.length < 3 || !/[A-Za-z]/.test(line)) continue;
    return line;
  }
  return "";
}

function extractDate(text) {
  for (const [pattern, normalizer] of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = normalizer(match);
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return dateStr;
      } catch (_) {
        continue;
      }
    }
  }
  return null;
}

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
      subtotal = price;
    } else if (TAX_KEYWORDS_RE.test(lineLower)) {
      tax = tax !== null ? Math.round((tax + price) * 100) / 100 : price;
    }
  }

  let total = null;
  if (totalCandidates.length > 0) {
    total = Math.max(...totalCandidates);
  }

  return { total, subtotal, tax };
}

function extractLineItems(lines) {
  const items = [];

  for (const line of lines) {
    if (EXCLUDE_LINE_ITEM_RE.test(line)) continue;

    const price = extractTrailingPrice(line);
    if (price === null || price < 0) continue;

    const priceMatch = line.match(TRAILING_PRICE_RE);
    let description = line.substring(0, priceMatch.index).trim();
    description = description.replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, "").trim();

    if (description.length < 2) continue;
    if (/^\d[\d\s]*$/.test(description)) continue;

    items.push({ description, price });
  }

  return items;
}

function calculateConfidence({ merchant, date, total, subtotal, tax, lineItems }) {
  const confidence = {
    merchant: "high",
    date: "high",
    total: "high",
    tax: "high",
  };

  if (!merchant || merchant.length < 2) {
    confidence.merchant = "low";
  } else if (merchant.length < 4) {
    confidence.merchant = "medium";
  }

  if (!date) {
    confidence.date = "low";
  }

  if (total === null || total === undefined) {
    confidence.total = "low";
  } else {
    let totalSignals = 0;
    let totalWarnings = 0;

    if (subtotal !== null && tax !== null) {
      const expected = Math.round((subtotal + tax) * 100) / 100;
      if (approxEqual(expected, total)) {
        totalSignals++;
      } else {
        totalWarnings++;
      }
    }

    if (lineItems.length > 0 && subtotal !== null) {
      const itemsSum = Math.round(lineItems.reduce((s, i) => s + i.price, 0) * 100) / 100;
      if (approxEqual(itemsSum, subtotal, 0.05)) {
        totalSignals++;
      } else {
        totalWarnings++;
      }
    }

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

  if (tax === null || tax === undefined) {
    confidence.tax = "medium";
  }

  return confidence;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function parseReceipt(rawText) {
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

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s{2,}/g, " ").trim())
    .filter((l) => l.length > 0);

  const merchant = extractMerchant(lines);
  const date = extractDate(rawText);
  const { total, subtotal, tax } = extractAmounts(lines);
  const lineItems = extractLineItems(lines);
  const confidence = calculateConfidence({ merchant, date, total, subtotal, tax, lineItems });

  return { merchant, date, lineItems, subtotal, tax, total, confidence };
}

module.exports = { parseReceipt };
