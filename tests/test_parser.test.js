/**
 * tests/test_parser.test.js
 *
 * Jest test suite for the on-device receipt parsing engine.
 *
 * Covers 6 distinct receipt formats across 3 categories:
 *   - Fast food (McDonald's)
 *   - Supermarket (Walmart)
 *   - Restaurant with tip (The Golden Fork)
 *   - Pharmacy / drugstore (CVS)
 *   - Gas station (Shell)
 *   - Coffee shop (Starbucks)
 *
 * Run: npm test  (from the tests/ directory or repository root)
 */

const { parseReceipt } = require("../mobile/lib/receiptParser.cjs");

const FAST_FOOD    = require("./fixtures/fastfood_receipt.js");
const SUPERMARKET  = require("./fixtures/supermarket_receipt.js");
const RESTAURANT   = require("./fixtures/restaurant_receipt.js");
const PHARMACY     = require("./fixtures/pharmacy_receipt.js");
const GAS_STATION  = require("./fixtures/gas_station_receipt.js");
const COFFEE       = require("./fixtures/coffee_receipt.js");

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Approximate equality for float comparisons. */
function approx(a, b, eps = 0.02) {
  return Math.abs(a - b) <= eps;
}

// ---------------------------------------------------------------------------
// 1. Fast Food — McDonald's
// ---------------------------------------------------------------------------
describe("Fast Food Receipt (McDonald's)", () => {
  let result;

  beforeAll(() => {
    result = parseReceipt(FAST_FOOD);
  });

  test("returns a result object", () => {
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  test("merchant contains 'MCDONALD'", () => {
    expect(result.merchant.toUpperCase()).toContain("MCDONALD");
  });

  test("date is parsed correctly (2024-03-15)", () => {
    expect(result.date).toBe("2024-03-15");
  });

  test("total is 12.12", () => {
    expect(result.total).not.toBeNull();
    expect(approx(result.total, 12.12)).toBe(true);
  });

  test("tax is ~0.95", () => {
    expect(result.tax).not.toBeNull();
    expect(approx(result.tax, 0.95)).toBe(true);
  });

  test("subtotal is ~11.17", () => {
    expect(result.subtotal).not.toBeNull();
    expect(approx(result.subtotal, 11.17)).toBe(true);
  });

  test("extracts at least 3 line items", () => {
    expect(result.lineItems.length).toBeGreaterThanOrEqual(3);
  });

  test("CHEESEBURGER line item has price 1.99", () => {
    const item = result.lineItems.find(
      (i) => i.description.toUpperCase().includes("CHEESEBURGER")
    );
    expect(item).toBeDefined();
    expect(approx(item.price, 1.99)).toBe(true);
  });

  test("confidence.total is high (math checks out)", () => {
    expect(result.confidence.total).toBe("high");
  });

  test("confidence.date is high", () => {
    expect(result.confidence.date).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// 2. Supermarket — Walmart
// ---------------------------------------------------------------------------
describe("Supermarket Receipt (Walmart)", () => {
  let result;

  beforeAll(() => {
    result = parseReceipt(SUPERMARKET);
  });

  test("merchant contains 'WALMART'", () => {
    expect(result.merchant.toUpperCase()).toContain("WALMART");
  });

  test("date is parsed correctly (2024-07-22)", () => {
    expect(result.date).toBe("2024-07-22");
  });

  test("total is ~33.87", () => {
    expect(result.total).not.toBeNull();
    expect(approx(result.total, 33.87)).toBe(true);
  });

  test("tax is ~2.51", () => {
    expect(result.tax).not.toBeNull();
    expect(approx(result.tax, 2.51)).toBe(true);
  });

  test("subtotal is ~31.36", () => {
    expect(result.subtotal).not.toBeNull();
    expect(approx(result.subtotal, 31.36)).toBe(true);
  });

  test("extracts at least 5 line items", () => {
    expect(result.lineItems.length).toBeGreaterThanOrEqual(5);
  });

  test("BANANAS line item price is 0.68", () => {
    const item = result.lineItems.find(
      (i) => i.description.toUpperCase().includes("BANANA")
    );
    expect(item).toBeDefined();
    expect(approx(item.price, 0.68)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Restaurant (with gratuity) — The Golden Fork
// ---------------------------------------------------------------------------
describe("Restaurant Receipt with Tip (The Golden Fork)", () => {
  let result;

  beforeAll(() => {
    result = parseReceipt(RESTAURANT);
  });

  test("merchant contains 'GOLDEN FORK'", () => {
    expect(result.merchant.toUpperCase()).toContain("GOLDEN FORK");
  });

  test("date is parsed correctly (2024-03-15)", () => {
    expect(result.date).toBe("2024-03-15");
  });

  test("grand total is ~233.10", () => {
    expect(result.total).not.toBeNull();
    expect(approx(result.total, 233.10, 0.05)).toBe(true);
  });

  test("tax is ~14.80", () => {
    expect(result.tax).not.toBeNull();
    expect(approx(result.tax, 14.80)).toBe(true);
  });

  test("subtotal is ~185.00", () => {
    expect(result.subtotal).not.toBeNull();
    expect(approx(result.subtotal, 185.0)).toBe(true);
  });

  test("extracts at least 5 line items (food items)", () => {
    expect(result.lineItems.length).toBeGreaterThanOrEqual(5);
  });

  test("SALMON entree found as a line item", () => {
    const item = result.lineItems.find(
      (i) => i.description.toUpperCase().includes("SALMON")
    );
    expect(item).toBeDefined();
    expect(approx(item.price, 28.0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Pharmacy — CVS
// ---------------------------------------------------------------------------
describe("Pharmacy Receipt (CVS)", () => {
  let result;

  beforeAll(() => {
    result = parseReceipt(PHARMACY);
  });

  test("merchant contains 'CVS'", () => {
    expect(result.merchant.toUpperCase()).toContain("CVS");
  });

  test("date is parsed correctly (2024-06-10)", () => {
    expect(result.date).toBe("2024-06-10");
  });

  test("total is ~42.74", () => {
    expect(result.total).not.toBeNull();
    expect(approx(result.total, 42.74)).toBe(true);
  });

  test("tax is ~2.80", () => {
    expect(result.tax).not.toBeNull();
    expect(approx(result.tax, 2.80)).toBe(true);
  });

  test("TYLENOL line item found with price 6.99", () => {
    const item = result.lineItems.find(
      (i) => i.description.toUpperCase().includes("TYLENOL")
    );
    expect(item).toBeDefined();
    expect(approx(item.price, 6.99)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Gas Station — Shell
// ---------------------------------------------------------------------------
describe("Gas Station Receipt (Shell)", () => {
  let result;

  beforeAll(() => {
    result = parseReceipt(GAS_STATION);
  });

  test("merchant contains 'SHELL'", () => {
    expect(result.merchant.toUpperCase()).toContain("SHELL");
  });

  test("date is parsed correctly (2024-01-08)", () => {
    expect(result.date).toBe("2024-01-08");
  });

  test("total is ~49.59", () => {
    expect(result.total).not.toBeNull();
    expect(approx(result.total, 49.59)).toBe(true);
  });

  test("tax is 0.00", () => {
    expect(result.tax).not.toBeNull();
    expect(approx(result.tax, 0.0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Coffee Shop — Starbucks
// ---------------------------------------------------------------------------
describe("Coffee Shop Receipt (Starbucks)", () => {
  let result;

  beforeAll(() => {
    result = parseReceipt(COFFEE);
  });

  test("merchant contains 'STARBUCKS'", () => {
    expect(result.merchant.toUpperCase()).toContain("STARBUCKS");
  });

  test("date is parsed correctly (2024-04-18)", () => {
    expect(result.date).toBe("2024-04-18");
  });

  test("total is ~14.66", () => {
    expect(result.total).not.toBeNull();
    expect(approx(result.total, 14.66)).toBe(true);
  });

  test("tax is ~1.21", () => {
    expect(result.tax).not.toBeNull();
    expect(approx(result.tax, 1.21)).toBe(true);
  });

  test("CARAMEL MACCHIATO found as a line item", () => {
    const item = result.lineItems.find(
      (i) => i.description.toUpperCase().includes("CARAMEL")
    );
    expect(item).toBeDefined();
    expect(approx(item.price, 5.95)).toBe(true);
  });

  test("confidence.total is high (math checks out)", () => {
    expect(result.confidence.total).toBe("high");
  });
});

// ---------------------------------------------------------------------------
// 7. Edge cases
// ---------------------------------------------------------------------------
describe("Edge Cases", () => {
  test("parseReceipt handles empty string gracefully", () => {
    const result = parseReceipt("");
    expect(result.merchant).toBe("");
    expect(result.date).toBeNull();
    expect(result.total).toBeNull();
    expect(result.confidence.total).toBe("low");
  });

  test("parseReceipt handles null gracefully", () => {
    const result = parseReceipt(null);
    expect(result.merchant).toBe("");
    expect(result.total).toBeNull();
  });

  test("parseReceipt handles receipt with no date", () => {
    const noDate = `SOME STORE\nITEM ONE 5.00\nTOTAL 5.00`;
    const result = parseReceipt(noDate);
    expect(result.date).toBeNull();
    expect(result.confidence.date).toBe("low");
  });

  test("low-confidence total when math does not add up", () => {
    // Subtotal + tax does NOT equal total — should produce low/medium confidence
    const badMath = `STORE XYZ\n04/01/2024\nITEM A 5.00\nSUBTOTAL 5.00\nTAX 1.00\nTOTAL 9.99`;
    const result = parseReceipt(badMath);
    expect(["low", "medium"]).toContain(result.confidence.total);
  });
});
