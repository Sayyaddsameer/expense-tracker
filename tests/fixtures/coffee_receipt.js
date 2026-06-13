/**
 * Coffee shop receipt (Starbucks style) — noisy OCR simulation
 * Simulates common OCR errors: '0' vs 'O', 'l' vs '1', merged words, etc.
 */
const COFFEE_RECEIPT = `STARBUCKS COFFEE
Grand Central Station
89 E 42ND ST NEW YORK NY 10017
1-800-Starbucks

REC# 1234567   REG# 05
Date: 04/18/2024  08:05 AM

CARAMEL MACCHIATO GRD          5.95
ADD SHOT                        0.80
BLUEBERRY MUFFIN               3.45
BANANA BREAD SLICE             3.25

SUBTOTAL                       13.45
TAX                             1.21
TOTAL                          14.66

STARBUCKS CARD XXXX2468       14.66
Stars Earned: 29

Visit us at starbucks.com
`;

module.exports = COFFEE_RECEIPT;
