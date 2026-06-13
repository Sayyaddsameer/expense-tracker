/**
 * Supermarket receipt (Walmart style)
 * Format: long list of items, some with quantity, discounts, then totals.
 * Date format: MM/DD/YY
 */
const SUPERMARKET_RECEIPT = `WALMART SUPERCENTER
4000 COMMERCE BLVD
ANYTOWN TX 75001
(214) 555-9999

MANAGER: JOHN SMITH

BANANAS                        0.68
WHOLE MILK GAL                 3.47
BREAD WONDER                   2.98
CHEDDAR CHEESE 8OZ             3.29
CHICKEN BREAST 2LB             7.42
ORANGE JUICE                   3.79
PASTA PENNE 16OZ               1.00
TOMATO SAUCE                   1.25
EGGS LARGE DZ                  2.49
BUTTER SALTED                  4.99

SUBTOTAL                      31.36
SALES TAX  8%                  2.51
TOTAL                         33.87

CREDIT CARD                   33.87

DATE: 07/22/24    STORE #4291
ITEM COUNT: 10
`;

module.exports = SUPERMARKET_RECEIPT;
