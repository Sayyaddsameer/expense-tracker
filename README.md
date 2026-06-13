#  Expense Tracker — Full-Stack Mobile App with On-Device ML

A production-quality expense tracker that uses **on-device machine learning** (Google ML Kit) to scan receipts, extract structured data, and sync with a FastAPI backend. Built with React Native (Expo), FastAPI, PostgreSQL, and Docker.

---

##  Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (Backend)](#quick-start-backend)
- [Running the Mobile App](#running-the-mobile-app)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Design Decisions](#design-decisions)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Mobile App (React Native)       │
│  expo-camera → ML Kit OCR → Parser Engine   │
│         → ExpenseForm → API Client          │
└─────────────────┬───────────────────────────┘
                  │ REST (HTTP/JSON)
┌─────────────────▼───────────────────────────┐
│           FastAPI Backend (Docker)           │
│  POST /expenses  GET /expenses              │
│  GET /expenses/summary  GET /expenses/export │
└─────────────────┬───────────────────────────┘
                  │ SQLAlchemy ORM
┌─────────────────▼───────────────────────────┐
│            PostgreSQL Database               │
│  expenses table + line_items table          │
└─────────────────────────────────────────────┘
```

### Data Flow

1. **Camera Capture** — `expo-camera` captures a photo and returns a local URI
2. **On-Device OCR** — `@react-native-ml-kit/text-recognition` processes the image locally; no data sent to the cloud
3. **Receipt Parsing** — Custom engine extracts `merchant`, `date`, `line_items`, `subtotal`, `tax`, `total` using regex + heuristics, and produces per-field confidence scores
4. **User Review** — Parsed data populates an editable form; low-confidence fields are highlighted in amber
5. **API Submission** — Validated data is `POST`ed to the backend
6. **Category Inference** — Backend assigns a category via keyword matching on the merchant name
7. **Persistence** — Expense and line items stored in PostgreSQL
8. **Reporting** — Monthly summaries and CSV exports via dedicated endpoints

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native, Expo SDK 51, Expo Router |
| OCR | Google ML Kit Text Recognition (on-device) |
| Backend | FastAPI 0.111, Python 3.11 |
| ORM | SQLAlchemy 2.0 + Alembic |
| Database | PostgreSQL 16 (SQLite for local dev) |
| Container | Docker, Docker Compose v3.9 |
| Testing | Jest 29 (parser), pytest (backend) |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker | ≥ 24.0 |
| Docker Compose | ≥ 2.20 |
| Node.js | ≥ 18 |
| Python | ≥ 3.11 |
| Expo CLI | ≥ 0.18 (optional, for mobile) |

---

## Quick Start (Backend)

### 1. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your desired Postgres credentials
```

### 2. Start all services

```bash
docker-compose up --build
```

This will:
- Build the FastAPI image
- Start PostgreSQL with a health check
- Wait for the DB to be healthy before starting the API
- Create all database tables on first startup

The API will be available at **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

### 3. Verify services

```bash
curl http://localhost:8000/health
# {"status":"healthy"}
```

### 4. Stop services

```bash
docker-compose down          # stop containers
docker-compose down -v       # stop and remove database volume
```

---

## Running the Mobile App

### Prerequisites

```bash
cd mobile
npm install
```

> **Note**: For full ML Kit OCR functionality, you must build a **development client** (not Expo Go). Expo Go does not support custom native modules.

### Build a development client

```bash
npx expo prebuild
npx expo run:android   # or run:ios
```

### Start the development server

```bash
npm start
# or
npx expo start
```

### Configure the API URL

Create a `.env` file in `mobile/`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
```

On Android emulator, the host machine is `10.0.2.2` — the app detects this automatically.

---

## Running Tests

### Receipt Parser Tests (Jest)

```bash
cd tests
npm install
npm test
```

This runs **40+ assertions** across **6 receipt formats**:

| Test Suite | Format |
|-----------|--------|
| McDonald's | Fast food, MM/DD/YYYY date |
| Walmart | Supermarket, long item list, MM/DD/YY |
| The Golden Fork | Restaurant with gratuity, DD-Mon-YYYY |
| CVS Pharmacy | Drugstore with coupons, YYYY-MM-DD |
| Shell | Gas station, Month DD YYYY |
| Starbucks | Coffee shop, add-ons |
| Edge cases | Empty input, null, no-date, bad math |

Run with coverage:

```bash
npm run test:coverage
```

### Backend Tests (pytest)

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

---

## API Reference

### `POST /expenses`

Create a new expense. Category is automatically inferred from the merchant name.

**Request body:**
```json
{
  "merchant": "Walmart Store #123",
  "purchase_date": "2024-03-15",
  "line_items": [
    { "description": "Bananas", "price": 0.68 }
  ],
  "total": 33.87,
  "tax": 2.51
}
```

**Response `201 Created`:**
```json
{
  "id": 1,
  "merchant": "Walmart Store #123",
  "purchase_date": "2024-03-15",
  "line_items": [...],
  "total": 33.87,
  "tax": 2.51,
  "category": "Groceries"
}
```

### `GET /expenses`

Returns all expenses, ordered by date descending.

**Response `200 OK`:** Array of expense objects.

### `GET /expenses/summary?month=YYYY-MM`

Monthly summary grouped by category.

**Response `200 OK`:**
```json
{
  "month": "2024-03",
  "total_expenses": 150.75,
  "category_summary": {
    "Groceries": 120.50,
    "Food": 30.25
  }
}
```

### `GET /expenses/export?month=YYYY-MM`

Streams a CSV file for download.

**Response headers:**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="expenses_2024-03.csv"`

**CSV columns:** `id, date, merchant, category, total, tax`

---

## Project Structure

```
expense-tracker/
├── mobile/                     # React Native (Expo) app
│   ├── app/                    # Expo Router screens
│   │   ├── _layout.jsx         # Navigation stack root
│   │   ├── index.jsx           # Home / dashboard
│   │   ├── scan.jsx            # Camera + OCR screen
│   │   ├── review.jsx          # Parsed data review form
│   │   ├── expenses.jsx        # All expenses list
│   │   └── summary.jsx         # Monthly summary + export
│   ├── components/
│   │   ├── ReceiptGuideOverlay.jsx   # SVG camera crop guide
│   │   └── ExpenseForm.jsx           # Review form with confidence UX
│   ├── hooks/
│   │   └── useOCR.js           # ML Kit wrapper hook
│   ├── lib/
│   │   ├── receiptParser.js    # ES module parsing engine
│   │   ├── receiptParser.cjs   # CommonJS version (for Jest)
│   │   └── api.js              # Backend API client
│   └── constants/
│       └── Colors.js           # Design tokens
│
├── backend/                    # FastAPI service
│   ├── app/
│   │   ├── main.py             # App factory + startup
│   │   ├── database.py         # SQLAlchemy engine + session
│   │   ├── orm_models.py       # Database ORM models
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   └── expenses.py     # All /expenses endpoints
│   │   └── services/
│   │       ├── category.py     # Merchant→category inference
│   │       └── export.py       # CSV streaming generator
│   ├── alembic/                # Database migrations
│   ├── Dockerfile
│   ├── alembic.ini
│   └── requirements.txt
│
├── tests/                      # Parser test suite
│   ├── fixtures/               # Raw OCR text fixtures
│   │   ├── fastfood_receipt.js
│   │   ├── supermarket_receipt.js
│   │   ├── restaurant_receipt.js
│   │   ├── pharmacy_receipt.js
│   │   ├── gas_station_receipt.js
│   │   └── coffee_receipt.js
│   ├── test_parser.test.js     # Jest test suite (40+ assertions)
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Design Decisions

### On-Device ML (Privacy-First)
All OCR is performed locally using ML Kit. No receipt images are ever transmitted to any external API. This allows the app to work fully offline and avoids per-request cloud ML costs.

### Parser Confidence Scoring
The parser cross-validates its findings:
- Does `subtotal + tax ≈ total`? (arithmetic check)
- Does sum of line items ≈ subtotal? (item-level check)
- Was a date found at all?

Fields that fail these checks are marked `low` confidence and rendered with an amber border + modified `data-testid` attribute.

### Layered Architecture
- **Pydantic schemas** (`schemas.py`) handle API validation
- **ORM models** (`orm_models.py`) define the database schema
- **Service layer** (`services/`) encapsulates business logic
- **Router** (`routers/expenses.py`) only handles HTTP concerns

### Database Flexibility
The app uses SQLite by default (no Docker needed for local dev) and automatically switches to PostgreSQL when `DATABASE_URL` is set. This makes development ergonomic while maintaining production compatibility.

---

## Category Mapping

The backend maps merchant names to categories using case-insensitive keyword matching:

| Merchant Keywords | Category |
|------------------|---------|
| walmart, kroger, publix, costco… | Groceries |
| mcdonald, subway, pizza, restaurant… | Food |
| starbucks, dunkin, coffee… | Coffee |
| shell, exxon, chevron, bp… | Gas |
| cvs, walgreens, pharmacy, hospital… | Healthcare |
| uber, lyft, amtrak, parking… | Transport |
| amazon, best buy, ikea, target… | Shopping |
| netflix, cinema, concert, ticketmaster… | Entertainment |
| electric, internet, at&t, comcast… | Utilities |
| marriott, airbnb, hotel… | Travel |
| (no match) | Other |

---

## License

MIT — see [LICENSE](LICENSE) for details.
