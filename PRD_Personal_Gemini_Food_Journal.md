# Product Requirements Document (PRD): Secure Personal Gemini Food Journal

**Version:** 2.0.0  
**Status:** Approved for Implementation  
**Target Environment:** Google Antigravity (Agent-Driven Workspace)  
**Core Frameworks:** Google Agent Development Kit (ADK), Google Cloud Vertex AI SDK, Firebase Authentication, Cloud Firestore, Google Cloud IAM (Workload Identity), Cloud Logging & Cloud Trace  

---

## 1. Executive Summary & Problem Statement

### 1.1 Objective
Build an enterprise-grade, secure, multi-turn AI application—the **Personal Gemini Food Journal**—powered by **Gemini 3.7 Flash on Google Cloud Vertex AI**. The app enables authenticated users to log dietary intake via natural conversation or plate photos, validates parsed nutrition through a structured Draft & Verify loop, and delivers longitudinal trend analysis.

### 1.2 Core Security & Architectural Shifts
- **Zero API Keys via Vertex AI IAM:** Discard API keys entirely. The backend authenticates to Vertex AI via Google Cloud IAM (Application Default Credentials / Workload Identity).
- **Gemini 3.7 Flash Engine:** Leverages Gemini 3.7 Flash with tunable thinking levels (`thinking_level`: `medium` for parsing, `high` for longitudinal reasoning).
- **Zero Client-Side LLM Access:** Strict mediation where frontend clients only communicate with authenticated backend endpoints.
- **Isolated Multi-Tenant Storage:** Strict Firestore pathing keyed solely to verified Firebase tokens.
- **Telemetry Observability with Redaction:** Google Cloud Logging and Cloud Trace integration stripped of sensitive personal health logs.

---

## 2. System Architecture & Data Flow

```
[ Frontend: React / Vite Web Application ]
  ├── Firebase Authentication (Google OAuth Sign-In)
  └── UI: Multi-turn Chat, Camera Ingestion, Verification Modal, Trends Dashboard
         │
         │ (Passes Bearer Authorization: Firebase ID Token)
         ▼
[ Secure Backend Gateway: Google Cloud Run (Node.js / Express or Python / FastAPI) ]
  ├── Middleware: Firebase Admin Token Verification -> derives req.user.uid
  ├── Security Layer: Google Cloud IAM (ADC / Workload Identity to Vertex AI)
  └── Observability: Structured Telemetry (Cloud Logging & Cloud Trace)
         │
         ▼
[ Google ADK (Agent Development Kit) running on Vertex AI ]
  ├── Foundation Model: gemini-3.7-flash (via Vertex AI SDK)
  ├── 1. Orchestrator Agent (Session & Intent Routing)
  ├── 2. Meal Parser Agent (Multimodal Vision & Structured JSON Extraction)
  ├── 3. Nutrition Grounding Agent (Macronutrient & Calorie Validation)
  └── 4. Longitudinal Insights Agent (Firestore Context Aggregator & Reasoning)
         │
         ▼
[ Data Layer: Cloud Firestore (Strict Path Scoping) ]
  ├── users/{uid}/food_logs/{logId}
  └── users/{uid}/insights/{insightId}
```

---

## 3. The Security Constitution (Antigravity Workspace Directives)

The Antigravity coding agent MUST enforce the following directives across every generated file and diff:

1. **IAM-Based Vertex AI Authentication (No API Keys):**
   - The codebase must NOT contain or reference `GEMINI_API_KEY`, `.env` key strings, or Secret Manager key retrieval for AI calls.
   - All Vertex AI calls must initialize using Google Cloud Application Default Credentials (ADC) or service account identity:
     ```python
     # Python Vertex AI initialization
     import vertexai
     vertexai.init(project=GCP_PROJECT_ID, location=GCP_REGION)
     ```
     ```typescript
     // Node.js Vertex AI initialization
     import { VertexAI } from '@google-cloud/vertexai';
     const vertexAI = new VertexAI({ project: GCP_PROJECT_ID, location: GCP_REGION });
     ```
2. **Model Specification:**
   - The primary LLM must be explicitly targeted as `gemini-3.7-flash`.
   - Ingestion tasks use `thinking_level: "medium"` (or low thinking effort) for low latency.
   - Analytical/longitudinal tasks use `thinking_level: "high"` for multi-step nutritional reasoning.
3. **Zero Client-Side LLM Access:**
   - The client application must NEVER communicate directly with Vertex AI or Firebase Admin SDKs.
   - Every AI workflow must pass through authenticated backend proxy routes.
4. **Strict Document Isolation:**
   - Every Firestore document must reside under `users/{userId}/*`.
   - The backend MUST derive `userId` solely from verified `decodedToken.uid`. Never accept a `userId` supplied in the request body or query parameters.
   - Firestore security rules must strictly enforce `request.auth.uid == userId`.
5. **Structured Telemetry & PII Redaction:**
   - Traces, latency metrics, and token usage must route to Google Cloud Logging as structured JSON linked to `Cloud Trace`.
   - **MANDATORY PRIVACY RULE:** Telemetry logs MUST NEVER contain raw user food entries, personal notes, or image base64 payloads.
6. **Draft & Verify Pattern:**
   - AI outputs are provisional drafts. Nothing is committed to `users/{uid}/food_logs` until the user reviews and confirms the item breakdown.

---

## 4. Functional Specifications & Modules

### Module 1: User Authentication & Identity Management
- **Frontend Authentication:** Firebase Authentication (Google OAuth provider).
- **Session Tokens:** Generates short-lived Firebase `idToken` attached as `Authorization: Bearer <token>` on all backend requests.
- **Backend Middleware:** Validates the token using Firebase Admin SDK, assigns `req.user = { uid: decoded.uid }`, and rejects unauthenticated requests with `401 Unauthorized`.

---

### Module 2: Multimodal Ingestion & Verification (Draft & Verify Loop)
- **Input Types:** Conversational text input or food plate images (camera or file upload).
- **Google ADK Meal Parser Agent (Gemini 3.7 Flash on Vertex AI):**
  - Uses `gemini-3.7-flash` with structured output schema (`responseSchema`).
  - Configuration:
    ```json
    {
      "model": "gemini-3.7-flash",
      "generationConfig": {
        "responseMimeType": "application/json",
        "thinkingConfig": { "thinkingLevel": "medium" }
      }
    }
    ```
- **Output Schema:**
  ```json
  {
    "meal_type": "Breakfast | Lunch | Dinner | Snack",
    "confidence_score": 0.94,
    "items": [
      {
        "name": "Roti",
        "quantity": "2 pieces",
        "estimated_weight_g": 80,
        "calories": 240,
        "protein_g": 6.0,
        "carbs_g": 40.0,
        "fat_g": 1.5
      },
      {
        "name": "Moong Dal",
        "quantity": "1 medium bowl",
        "estimated_weight_g": 150,
        "calories": 180,
        "protein_g": 9.0,
        "carbs_g": 24.0,
        "fat_g": 4.0
      }
    ],
    "total_calories": 420,
    "total_protein_g": 15.0,
    "total_carbs_g": 64.0,
    "total_fat_g": 5.5,
    "summary_note": "Balanced vegetarian meal."
  }
  ```
- **User Review & Confirmation:**
  - Frontend displays an editable verification modal with calorie and portion adjustments.
  - On user confirmation, the validated JSON is sent to `POST /api/logs/confirm`.

---

### Module 3: Isolated Data Persistence (Cloud Firestore)
- **Document Path:** `users/{uid}/food_logs/{logId}`
- **Document Schema:**
  ```typescript
  interface FoodLogEntry {
    id: string;
    timestamp: FirebaseFirestore.Timestamp;
    meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    items: Array<{
      name: string;
      quantity: string;
      estimated_weight_g: number;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    }>;
    totals: {
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    };
    user_confirmed: boolean;
    created_at: FirebaseFirestore.FieldValue;
  }
  ```
- **Firestore Security Rules:**
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```

---

### Module 4: Longitudinal Insights Engine (Google ADK Analysis Agent)
- **Endpoint:** `GET /api/insights?range=7d|30d`
- **Execution Strategy:**
  1. Backend runs a bounded indexed query on `users/{uid}/food_logs` between `[startDate, endDate]`.
  2. Programmatically summarizes aggregates (daily totals, averages, macro percentages, meal timing).
  3. Dispatches aggregated context to the ADK Longitudinal Agent backed by `gemini-3.7-flash` using `thinkingConfig: { thinkingLevel: "high" }`.
- **Insights Schema:**
  ```json
  {
    "timeframe": "Last 7 Days",
    "overall_score": 84,
    "macro_balance": {
      "status": "Balanced | Deficit | Surplus",
      "summary": "Protein reached 88% of target; fiber and healthy fats are within target range."
    },
    "patterns_detected": [
      "Consistent breakfast timing between 8:00 AM - 8:30 AM.",
      "Caloric intake on weekends is 30% higher than weekday averages."
    ],
    "actionable_recommendations": [
      "Add a protein-dense component to afternoon snacks.",
      "Maintain consistent hydration habits across active days."
    ],
    "generated_at": "ISO-8601 Timestamp"
  }
  ```
- **Caching:** The analysis is stored in `users/{uid}/insights/{insightId}` to avoid redundant Vertex AI calls.

---

### Module 5: Telemetry & Observability Pipeline
- **Target:** Google Cloud Logging and Cloud Trace.
- **Emission Standard:** Structured JSON to `stdout`.
- **Schema:**
  ```json
  {
    "severity": "INFO | WARNING | ERROR",
    "eventType": "MEAL_PARSED | LOG_COMMITTED | INSIGHTS_GENERATED | AUTH_ERROR",
    "userId_hash": "sha256(uid)",
    "durationMs": 850,
    "traceId": "projects/{GCP_PROJECT}/traces/{TRACE_ID}",
    "modelMetrics": {
      "provider": "vertex-ai",
      "model": "gemini-3.7-flash",
      "promptTokens": 480,
      "candidateTokens": 160,
      "totalTokens": 640
    },
    "metadata": {
      "itemCount": 2,
      "inputMode": "image"
    }
  }
  ```
- **Privacy Filter:** Automated middleware sanitizes all events by deleting keys matching `prompt`, `rawImage`, `base64`, `notes`, or user journal text.

---

## 5. Technical Stack

| Layer | Technology |
|---|---|
| **IDE & Autonomous Coding** | Google Antigravity |
| **Frontend** | React 18 + Vite + Tailwind CSS / Lucide Icons |
| **Authentication** | Firebase Authentication (Google Provider) |
| **Backend Runtime** | Node.js (Express) or Python (FastAPI) on Cloud Run |
| **AI Foundation Model** | **Gemini 3.7 Flash** |
| **AI Cloud Platform** | **Google Cloud Vertex AI** (IAM ADC Auth / No API Keys) |
| **AI Agent Framework** | Google Agent Development Kit (ADK) |
| **Database** | Google Cloud Firestore (Native Mode) |
| **Telemetry & Traces** | Google Cloud Logging + OpenTelemetry / Cloud Trace |

---

## 6. Antigravity Agent Execution Instructions

When initialized in Google Antigravity, the coding agent must execute across five phases:

1. **Phase 1: Project Setup & Workspace Directives**
   - Create the directory layout (`/client`, `/server`, `/agents`, `/telemetry`).
   - Create `.agents/rules/security-constitution.md` with Section 3 rules.
   - Configure Vertex AI SDK initialization using IAM credentials (ADC).
2. **Phase 2: ADK Agents with Gemini 3.7 Flash**
   - Initialize Google ADK agents using the Vertex AI client and `gemini-3.7-flash`.
   - Implement the Multimodal Meal Parser with structured output schemas.
   - Implement the Longitudinal Insights Agent with high thinking configuration.
3. **Phase 3: Backend API & Observability**
   - Implement Firebase Admin token verification middleware.
   - Implement `/api/parse`, `/api/logs/confirm`, and `/api/insights`.
   - Implement the telemetry logger with the PII redaction filter.
4. **Phase 4: Frontend Development**
   - Implement Firebase Google Sign-In.
   - Implement the conversational chat input, camera/image upload, and editable review modal.
   - Implement the longitudinal trends visual dashboard.
5. **Phase 5: Automated Verification**
   - Run tests confirming 401 Unauthorized for unauthenticated requests.
   - Verify that Firestore security rules block cross-tenant read/writes.
   - Audit telemetry logs to ensure zero API keys or user journal contents are leaked.
