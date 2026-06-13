"""
Merchant-to-category inference service.

Uses a tiered keyword-matching strategy:
  1. Exact brand name match (highest priority)
  2. Keyword substring match (case-insensitive)
  3. Default fallback category

Adding new mappings: simply extend MERCHANT_KEYWORDS with a list of
lowercase keywords that identify the category.
"""

from typing import Dict, List, Tuple


# ---------------------------------------------------------------------------
# Category mapping: category_name → list of lowercase keyword fragments
# ---------------------------------------------------------------------------
MERCHANT_KEYWORDS: Dict[str, List[str]] = {
    "Groceries": [
        "walmart", "kroger", "safeway", "publix", "whole foods", "trader joe",
        "aldi", "costco", "sam's club", "target grocery", "heb", "wegmans",
        "sprouts", "food lion", "stop & shop", "giant", "meijer",
    ],
    "Food": [
        "mcdonald", "burger king", "wendy", "subway", "chipotle", "taco bell",
        "domino", "pizza hut", "papa john", "kfc", "popeye", "chick-fil-a",
        "five guys", "shake shack", "panera", "dunkin", "ihop", "denny",
        "applebee", "olive garden", "outback", "cheesecake factory",
        "restaurant", "diner", "grill", "bistro", "cafe", "eatery", "bbq",
        "sushi", "ramen", "taqueria", "pizzeria",
    ],
    "Coffee": [
        "starbucks", "dunkin donuts", "peet's", "dutch bros", "caribou",
        "tim hortons", "coffee", "espresso", "roasters", "brew",
    ],
    "Gas": [
        "shell", "exxon", "mobil", "chevron", "bp", "sunoco", "valero",
        "marathon", "citgo", "speedway", "wawa", "sheetz", "pilot", "flying j",
        "loves travel", "gas station", "fuel", "petro",
    ],
    "Healthcare": [
        "cvs", "walgreens", "rite aid", "duane reade", "pharmacy", "hospital",
        "clinic", "medical", "dental", "vision", "optician", "urgent care",
        "health", "drug store",
    ],
    "Transport": [
        "uber", "lyft", "taxi", "cab", "transit", "metro", "subway fare",
        "amtrak", "greyhound", "airline", "delta", "united airlines",
        "american airlines", "southwest", "jetblue", "spirit airlines",
        "parking", "toll", "rental car", "enterprise", "hertz", "avis",
    ],
    "Shopping": [
        "amazon", "ebay", "etsy", "best buy", "apple store", "microsoft",
        "home depot", "lowe's", "bed bath", "ikea", "macy's", "nordstrom",
        "gap", "h&m", "zara", "old navy", "tj maxx", "marshalls", "ross",
        "dollar tree", "dollar general", "five below",
    ],
    "Entertainment": [
        "netflix", "spotify", "hulu", "disney", "hbo", "paramount",
        "cinema", "theater", "theatre", "amc", "regal", "imax",
        "concert", "ticketmaster", "eventbrite", "bowling", "arcade",
        "museum", "zoo", "theme park", "six flags", "universal",
    ],
    "Utilities": [
        "electric", "water bill", "gas bill", "internet", "comcast",
        "at&t", "verizon", "t-mobile", "sprint", "phone bill",
        "cable", "xfinity", "spectrum", "frontier",
    ],
    "Travel": [
        "marriott", "hilton", "hyatt", "holiday inn", "airbnb", "vrbo",
        "hotel", "resort", "motel", "inn", "suites", "expedia", "booking",
    ],
}

# Fallback when no keyword matches
DEFAULT_CATEGORY = "Other"


def infer_category(merchant: str) -> str:
    """
    Infer a spending category from a merchant name using case-insensitive
    keyword matching.

    Args:
        merchant: The merchant / vendor name from the expense record.

    Returns:
        A category string such as "Groceries", "Food", "Gas", etc.
        Falls back to "Other" if no keyword matches.
    """
    if not merchant:
        return DEFAULT_CATEGORY

    merchant_lower = merchant.lower()

    for category, keywords in MERCHANT_KEYWORDS.items():
        for keyword in keywords:
            if keyword in merchant_lower:
                return category

    return DEFAULT_CATEGORY
