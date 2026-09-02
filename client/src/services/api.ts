export interface MealItem {
  name: string;
  quantity: string;
  estimated_weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealParseResponse {
  meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  confidence_score: number;
  items: MealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  summary_note: string;
}

export interface LogConfirmRequest {
  meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  items: MealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  summary_note?: string;
  notes?: string;
  logged_at?: string;
}

export interface FoodLogEntry {
  id: string;
  user_id: string;
  meal_type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  items: MealItem[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  summary_note?: string;
  notes?: string;
  user_confirmed: boolean;
  created_at: string;
  logged_at: string;
}

export interface DailyMacroSummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  log_count: number;
  logs: FoodLogEntry[];
}

export interface MacroBalance {
  status: "Balanced" | "Deficit" | "Surplus" | "Needs Adjustment";
  summary: string;
}

export interface LongitudinalInsightsResponse {
  timeframe: string;
  overall_score: number;
  macro_balance: MacroBalance;
  patterns_detected: string[];
  actionable_recommendations: string[];
  generated_at: string;
  total_logs_analyzed: number;
  avg_daily_calories: number;
  avg_daily_protein_g: number;
  avg_daily_carbs_g: number;
  avg_daily_fat_g: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  user_goals?: string;
}

export interface ChatResponse {
  response: string;
  suggestions: string[];
}

const API_BASE = "/api";

async function authFetch(url: string, token: string | null, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  async parseMeal(
    token: string | null,
    params: {
      text?: string;
      image_base64?: string;
      image_mime_type?: string;
      meal_type_hint?: string;
    }
  ): Promise<MealParseResponse> {
    return authFetch(`${API_BASE}/parse`, token, {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  async confirmLog(token: string | null, payload: LogConfirmRequest): Promise<FoodLogEntry> {
    return authFetch(`${API_BASE}/logs/confirm`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getLogs(
    token: string | null,
    params?: { startDate?: string; endDate?: string; limit?: number }
  ): Promise<FoodLogEntry[]> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("start_date", params.startDate);
    if (params?.endDate) query.set("end_date", params.endDate);
    if (params?.limit) query.set("limit", params.limit.toString());
    const qs = query.toString();
    return authFetch(`${API_BASE}/logs${qs ? `?${qs}` : ""}`, token, {
      method: "GET",
    });
  },

  async getDailySummary(token: string | null, date?: string): Promise<DailyMacroSummary> {
    const qs = date ? `?date=${encodeURIComponent(date)}` : "";
    return authFetch(`${API_BASE}/logs/summary${qs}`, token, {
      method: "GET",
    });
  },

  async deleteLog(token: string | null, logId: string): Promise<{ message: string; id: string }> {
    return authFetch(`${API_BASE}/logs/${logId}`, token, {
      method: "DELETE",
    });
  },

  async getInsights(
    token: string | null,
    range: "7d" | "30d" = "7d",
    forceRefresh: boolean = false
  ): Promise<LongitudinalInsightsResponse> {
    return authFetch(
      `${API_BASE}/insights?range=${range}${forceRefresh ? "&force_refresh=true" : ""}`,
      token,
      {
        method: "GET",
      }
    );
  },

  async sendChatMessage(token: string | null, payload: ChatRequest): Promise<ChatResponse> {
    return authFetch(`${API_BASE}/chat`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
};
