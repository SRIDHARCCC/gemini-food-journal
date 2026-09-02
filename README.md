# Personal Gemini Food Journal

An enterprise-grade, secure, multimodal dietary journaling and longitudinal health reasoning application powered by **Gemini 3.7 Flash** on **Google Cloud Vertex AI**, built with **Google Agent Development Kit (ADK)**, **Firebase Authentication**, and **Google Cloud Firestore**.

[![Live Cloud Run Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-brightgreen?logo=google-cloud)](https://gemini-food-journal-885572607365.us-central1.run.app)
[![AI Engine](https://img.shields.io/badge/Model-Gemini%203.7%20Flash-blue?logo=google)](https://cloud.google.com/vertex-ai)
[![Security](https://img.shields.io/badge/Security-Zero%20API%20Keys%20%7C%20IAM%20ADC-emerald)](https://cloud.google.com/docs/authentication)

🚀 **Live Production Deployment:** [https://gemini-food-journal-885572607365.us-central1.run.app](https://gemini-food-journal-885572607365.us-central1.run.app)

---

## 🌟 Key Capabilities

1. **Multimodal Meal Ingestion:**
   - Log meals through conversational natural language or plate photos.
   - Deconstructs complex dishes into ingredients, portion weights (grams), calories, protein, carbs, and fat.
   - Leverages **Gemini 3.7 Flash** on Vertex AI with `thinking_level="medium"` and strict JSON schema enforcement.

2. **Draft & Verify Human-in-the-Loop Guardrail (Mandate 5):**
   - AI outputs are provisional drafts. Nothing is committed to persistent storage until the user reviews, adjusts portion weights/macros in the interactive review modal, and confirms.

3. **High-Thinking Longitudinal Insights Engine (Mandate 2):**
   - Multi-day trend synthesis (7-day and 30-day views).
   - Computes daily macro distributions, timing regularity, weekday vs. weekend caloric deltas.
   - Uses **Gemini 3.7 Flash** with `thinking_level="high"` to generate an evidence-based Nutritional Health Score (0–100), Macro Balance classification, detected behavioral rhythms, and actionable recommendations.

4. **Zero-Trust Security & Zero API Keys (Mandates 1 & 3):**
   - Strictly authenticates to Vertex AI via Google Cloud IAM (Application Default Credentials / Workload Identity) on your configured Google Cloud project.
   - Zero client-side LLM calls. All AI interactions proxy through authenticated backend routes.
   - Validates Firebase ID tokens and isolates data under `users/{uid}/food_logs/{logId}` and `users/{uid}/insights/{insightId}`.

5. **Centralized Telemetry & PII Redaction (Mandate 4):**
   - Structured JSON logs emitted to stdout, linked to Google Cloud Logging and Cloud Trace.
   - User IDs are hashed with SHA-256.
   - Automated redaction scrubs conversational food prompts, notes, food names, and base64 image data.

---

## 🏛️ System Architecture

```
[ Frontend: React 18 + Vite + Tailwind CSS ]
  ├── Firebase Authentication (Google OAuth Sign-In & Demo Mode)
  └── UI: Multi-turn Chat, Camera Ingestion, Draft & Verify Modal, Timeline & Trends
         │
         │ (Bearer Authorization: Firebase ID Token)
         ▼
[ Secure Backend Gateway: FastAPI on Cloud Run ]
  ├── Middleware: Firebase Admin ID Token Verification -> derives req.user.uid
  ├── Security: Google Cloud IAM (ADC / Workload Identity to Vertex AI)
  └── Observability: Structured Telemetry (Cloud Logging & Cloud Trace with PII Redaction)
         │
         ▼
[ Google ADK Agents running on Vertex AI ]
  ├── Foundation Model: gemini-3.7-flash (via Google GenAI SDK Vertex AI Client)
  ├── 1. FoodJournalOrchestrator (Session & Workflow Coordinator)
  ├── 2. MealParserAgent (Multimodal Vision & Structured JSON, thinking="medium")
  ├── 3. NutritionGroundingAgent (Caloric & Macronutrient Mathematical Integrity)
  └── 4. LongitudinalInsightsAgent (7d / 30d Trend Reasoning, thinking="high")
         │
         ▼
[ Persistence Layer: Cloud Firestore (Strict Path Scoping) ]
  ├── users/{uid}/food_logs/{logId}
  └── users/{uid}/insights/{insightId}
```

---

## 📁 Repository Structure

```
gemini-food-journal/
├── .env.example                       # Environment variables template
├── .gitignore                         # Git exclusion rules
├── .dockerignore                      # Docker build exclusions
├── Dockerfile                         # Production multi-stage Dockerfile
├── requirements.txt                   # Production Python dependencies
├── firestore.rules                    # Declarative Multi-tenant Firestore Security Rules
├── pytest.ini                         # Pytest configuration
├── PRD_Personal_Gemini_Food_Journal.md # Product Requirements Document
├── security-constitution.md           # Six Non-Negotiable Security Mandates
├── server/
│   ├── config.py                      # Application & GCP project config
│   ├── main.py                        # FastAPI application entry point (serves API & SPA)
│   ├── auth/
│   │   └── firebase_auth.py           # Firebase Bearer token verification
│   ├── db/
│   │   └── firestore_client.py        # Isolated multi-tenant Firestore client
│   ├── agents/
│   │   ├── base_agent.py              # Vertex AI IAM ADC client initializer
│   │   ├── meal_parser.py             # Multimodal Meal Parser (Gemini 3.7 Flash thinking medium)
│   │   ├── nutrition_grounding.py     # Macronutrient consistency grounding
│   │   ├── longitudinal_insights.py   # Trend & pattern engine (Gemini 3.7 Flash thinking high)
│   │   └── orchestrator.py            # Food Journal ADK Orchestrator
│   ├── models/
│   │   └── schemas.py                 # Pydantic v2 schemas and models
│   ├── routes/
│   │   ├── parse.py                   # POST /api/parse
│   │   ├── logs.py                    # POST /api/logs/confirm, GET/DELETE /api/logs
│   │   ├── insights.py                # GET /api/insights
│   │   └── health.py                  # GET /api/health
│   └── telemetry/
│       └── structured_logger.py       # Cloud Logging structured JSON & PII scrubber
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                    # Main interactive UI container
│       ├── firebase.ts                # Firebase client initialization
│       ├── context/
│       │   └── AuthContext.tsx        # Authentication context & token management
│       ├── services/
│       │   └── api.ts                 # Backend API client
│       └── components/
│           ├── Navbar.tsx             # Navigation & User Profile
│           ├── ChatInterface.tsx      # Conversational meal chat & camera trigger
│           ├── ImageUploader.tsx      # Camera snapshot & image compressor
│           ├── DraftVerificationModal.tsx # Draft & Verify review modal
│           ├── FoodLogTimeline.tsx    # Daily food logs timeline & macro sums
│           ├── MacroProgressBar.tsx   # Visual target macro progress bars
│           └── InsightsDashboard.tsx  # 7d/30d Longitudinal insights dashboard
└── tests/
    ├── test_adk_tools.py              # ADK tool validation tests
    ├── test_auth.py                   # 401 Unauthorized enforcement tests
    ├── test_firestore_isolation.py    # Multi-tenant path isolation tests
    ├── test_parser_agent.py           # Schema & nutrition grounding tests
    ├── test_insights_agent.py         # Multi-day aggregate statistical tests
    └── test_telemetry_redaction.py    # PII scrubbing & SHA-256 user ID hashing tests
```

---

## 🚀 Quick Start & Deployment Guide

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm
- Google Cloud Project with Vertex AI & Firestore enabled
- Google Cloud CLI (`gcloud auth application-default login`)

### 1. Backend Setup & Automated Tests
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run automated test suite (16 tests)
pytest -v
```

### 2. Local Frontend Build & Run
```bash
# Build React frontend
cd client
npm install
npm run build
cd ..

# Start application server locally
python -m server.main
```
Navigate to `http://localhost:8080` in your web browser.

---

## ☁️ Google Cloud Run Deployment

Deploy the entire full-stack application with a single command using Google Cloud Build and Cloud Run:

```bash
gcloud run deploy gemini-food-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=your-gcp-project-id,GCP_REGION=us-central1,PRIMARY_MODEL=gemini-3.7-flash,MODEL_NAME=gemini-3.7-flash,FIREBASE_PROJECT_ID=your-gcp-project-id,ENV=production"
```

---

## 🔒 Security Constitution & Compliance

| Mandate | Description | Implementation Status |
|---|---|---|
| **Mandate 1: Zero API Keys** | Vertex AI initialized solely through Google Cloud IAM Application Default Credentials. | ✅ Enforced |
| **Mandate 2: Model & Thinking Governance** | Targeted strictly to `gemini-3.7-flash` (`thinking_level="medium"` for parsing, `"high"` for longitudinal insights). | ✅ Enforced |
| **Mandate 3: Tenant Isolation** | Zero client-side LLM calls; `userId` derived exclusively from verified Firebase `decodedToken.uid`; Firestore paths scoped to `users/{uid}/*`. | ✅ Enforced |
| **Mandate 4: Centralized Telemetry** | Structured Cloud Logging JSON with Cloud Trace IDs, SHA-256 hashed UIDs, and strict PII redaction. | ✅ Enforced |
| **Mandate 5: Draft & Verify Loop** | Ingestion generates provisional draft; committed to Firestore only upon user review & confirmation. | ✅ Enforced |
| **Mandate 6: Code Standards** | Declarative `firestore.rules`, modular ADK architecture, and automated test coverage. | ✅ Enforced |

---

## 🧪 Running Automated Tests

```bash
pytest -v
```
**Test Coverage Includes:**
- `test_unauthenticated_request_rejected`: Confirms unauthenticated requests receive `401 Unauthorized`.
- `test_invalid_bearer_token_rejected`: Confirms invalid tokens receive `401 Unauthorized`.
- `test_authenticated_request_succeeds_with_valid_token`: Confirms valid tokens authenticate properly.
- `test_multi_tenant_isolation`: Confirms User A and User B food logs never leak across tenants.
- `test_delete_food_log_isolation`: Confirms User B cannot delete User A's logs.
- `test_telemetry_metadata_pii_redaction`: Confirms prompts, notes, food names, and images are scrubbed from telemetry.
- `test_user_id_hashing`: Confirms user IDs are transformed into 64-character SHA-256 hashes.
- `test_nutrition_grounding_refinement`: Confirms caloric integrity (`4 kcal/g` protein/carbs, `9 kcal/g` fat).
- `test_compute_aggregates_multi_day`: Confirms multi-day statistical aggregation calculations.
