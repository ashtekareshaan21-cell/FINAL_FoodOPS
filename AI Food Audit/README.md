# Food AI Audit — FoodOPS

An AI-powered food donation visual verification platform built for **SIH (Smart India Hackathon)**.

FoodOPS uses **Google Gemini** to analyze uploaded food images and perform a structured 4-step visual audit before a donation is accepted.

---

## Features

- **AI Visual Audit** powered by Google Gemini Vision
- **4-Step Structured Audit**
  1. Food Type Verification (donor input vs AI observation)
  2. Visual Quality / Investigation Check
  3. Quantity Check
  4. Final AI Audit Conclusion
- **No hallucinated data** — AI only describes what is visually observable
- **FSSAI-aligned safety language** — no false food safety claims
- **Drag & drop image upload** with live preview
- **Real-time loading state** during AI analysis
- **Responsive design** — works on desktop and mobile

---

## Project Structure

```
Food-AI-Audit/
├── server.js               # Express backend — Gemini API integration
├── package.json            # Backend dependencies
├── .env.example            # Environment variable template
├── public/                 # Static frontend (served by Express)
│   ├── index.html          # Main UI page
│   ├── css/
│   │   └── style.css       # All styles
│   └── js/
│       └── app.js          # Frontend logic — form, upload, audit rendering
└── add-donation-app/       # React/Vite component (AddDonationModal)
    ├── src/
    │   ├── AddDonationModal.tsx
    │   └── index.css
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express |
| AI | Google Gemini (`gemini-2.5-flash-lite`) |
| File Upload | Multer (in-memory) |
| Frontend | Vanilla HTML / CSS / JavaScript |
| React Component | React + TypeScript + Vite |

---

## Setup & Running

### 1. Clone the repo

```bash
git clone https://github.com/ommalghe/Food-AI-Audit.git
cd Food-AI-Audit
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure your Gemini API key

```bash
cp .env.example .env
```

Edit `.env` and add your key:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 4. Start the server

```bash
node server.js
```

### 5. Open the app

```
http://localhost:5000
```

---

## How the AI Audit Works

The system sends the uploaded food image + donor-provided context to Gemini and receives a structured JSON response covering 4 steps:

### Step 1 — Food Type Verification
- AI visually identifies what food is in the image (independent of donor input)
- Compares observation against the donor-entered food name
- Returns: `MATCHED` / `PARTIAL_MATCH` / `MISMATCH` / `NOT_VERIFIABLE`

### Step 2 — Visual Quality Check
- Screens for obvious visible abnormalities: discoloration, mold-like growth, foreign material, visible spoilage
- Returns: `NO_OBVIOUS_VISUAL_CONCERN` / `VISIBLE_CONCERN` / `UNCLEAR`
- **Important:** An open container is NOT flagged as a quality concern

### Step 3 — Quantity Check
- Compares donor-entered quantity against what is visually observable
- Returns: `CONSISTENT_WITH_INPUT` / `POSSIBLY_LESS_THAN_INPUT` / `POSSIBLY_MORE_THAN_INPUT` / `CANNOT_DETERMINE`
- **Important:** Exact weight cannot be determined from a photo — the AI never claims otherwise

### Step 4 — Final AI Audit Conclusion
Combines all three results using priority logic:

| Priority | Condition | Final Status |
|---|---|---|
| 1 | Food type mismatch | `FOOD_TYPE_MISMATCH` |
| 2 | Visible quality concern | `INVESTIGATION_NEEDED` |
| 3 | Image too unclear | `MANUAL_VERIFICATION` |
| 4 | Quantity discrepancy | `QUANTITY_REVIEW` |
| 5 | All checks pass | `VERIFIED` |

---

## Safety Disclaimer

FoodOPS is a **visual screening tool only**.

- It does NOT certify food safety
- It does NOT detect bacteria, pathogens, or invisible contamination
- It does NOT claim food is "safe to eat" or "unsafe"
- All conclusions are based solely on visible information in the uploaded image

---

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) |
| `PORT` | Server port (default: `5000`) |

---

## License

MIT
