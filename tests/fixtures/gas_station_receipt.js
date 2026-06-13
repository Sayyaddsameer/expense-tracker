/**
 * Gas station receipt (Shell style)
 * Format: very minimal — just fuel grade, gallons, price per gallon, total.
 * Date format: Mon DD, YYYY
 */
const GAS_STATION_RECEIPT = `SHELL
5100 HIGHWAY BLVD
DALLAS TX 75201

Station: 4142
Pump: 08

Date: January 8, 2024
Time: 9:17 AM

UNLEADED 87
GALLONS         12.456
PRICE/GAL        3.499
FUEL TOTAL       43.59

CAR WASH BASIC    6.00

SUBTOTAL         49.59
TAX               0.00
TOTAL            49.59

CREDIT CARD      49.59
`;

module.exports = GAS_STATION_RECEIPT;
