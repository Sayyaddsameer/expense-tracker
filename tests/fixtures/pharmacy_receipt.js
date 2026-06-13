/**
 * Pharmacy / drugstore receipt (CVS style)
 * Format: mix of Rx and OTC items, multiple discounts/coupons, date format YYYY-MM-DD.
 */
const PHARMACY_RECEIPT = `CVS PHARMACY #7821
555 HEALTH BLVD
MIAMI FL 33101
1-800-SHOP-CVS

Date: 2024-06-10  11:22 AM
Cashier: Sarah  Register: 04

TYLENOL EXTRA STR 24CT          6.99
ADVIL LIQUI-GELS 40CT           8.49
VITAMIN C 1000MG 90CT           9.99
BANDAGES FLEX 30CT              4.49
HAND SANITIZER 8OZ              3.99
COUGH SYRUP 8OZ                 7.99

SUBTOTAL                       41.94
CVS COUPON SAVINGS             -2.00
ADJUSTED SUBTOTAL              39.94
STATE TAX                       2.80
TOTAL                          42.74

ExtraBucks Earned:              2.00

VISA XXXX5678                  42.74

Thank you for shopping CVS
`;

module.exports = PHARMACY_RECEIPT;
