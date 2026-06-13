/**
 * Restaurant receipt with tip/gratuity line
 * Format: multi-course meal, mandatory gratuity, tip line before grand total.
 * Date format: DD-Mon-YYYY
 */
const RESTAURANT_RECEIPT = `THE GOLDEN FORK
FINE DINING ESTABLISHMENT
789 RIVERSIDE AVE
CHICAGO IL 60601
(312) 555-8800

Table: 14    Server: Maria
Guests: 4

Date: 15-Mar-2024  Time: 7:45 PM
Check #: 00847

APPETIZERS
BRUSCHETTA                      9.00
CALAMARI                       12.00

ENTREES
GRILLED SALMON                 28.00
FILET MIGNON 8OZ               42.00
PASTA PRIMAVERA                18.00
CHICKEN PICCATA                22.00

DESSERTS
TIRAMISU                        8.00
CHOCOLATE LAVA CAKE             8.00

BEVERAGES
HOUSE WINE BTL                 38.00

SUBTOTAL                      185.00
GRATUITY 18%                   33.30
TAX                            14.80
GRAND TOTAL                   233.10

AMEX XXXX-1234               233.10

Thank you for dining with us!
`;

module.exports = RESTAURANT_RECEIPT;
