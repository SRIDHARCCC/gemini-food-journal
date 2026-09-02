import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ChatInterface } from "./components/ChatInterface";
import { FoodLogTimeline } from "./components/FoodLogTimeline";
import { InsightsDashboard } from "./components/InsightsDashboard";
import { DraftVerificationModal } from "./components/DraftVerificationModal";
import { AuthModal } from "./components/AuthModal";
import { MealParseResponse, api } from "./services/api";
import { 
  Sparkles, 
  ShieldCheck, 
  LogIn, 
  Brain, 
  Camera, 
  Lock, 
  Zap,
  CheckCircle2,
  UserPlus
} from "lucide-react";

const MainApp: React.FC = () => {
  const { user, loading, loginAsDemo, loginWithGoogle, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"journal" | "logs" | "insights">("journal");
  const [activeDraft, setActiveDraft] = useState<MealParseResponse | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGoogleClick = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      setAuthModalMode("signin");
      setShowAuthModal(true);
    }
  };

  const handleConfirmDraft = async (confirmedData: any) => {
    setIsSavingDraft(true);
    try {
      const token = await getToken();
      await api.confirmLog(token, {
        meal_type: confirmedData.meal_type,
        items: confirmedData.items,
        total_calories: confirmedData.total_calories,
        total_protein_g: confirmedData.total_protein_g,
        total_carbs_g: confirmedData.total_carbs_g,
        total_fat_g: confirmedData.total_fat_g,
        summary_note: confirmedData.summary_note,
        notes: confirmedData.notes,
      });

      setActiveDraft(null);
      setRefreshTrigger((prev) => prev + 1);
      showNotification(`Successfully logged ${confirmedData.meal_type} (${confirmedData.total_calories} kcal) to Firestore!`);
    } catch (err: any) {
      console.error("Failed to confirm food log:", err);
      alert(`Failed to save food log: ${err.message}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Initializing Gemini Food Journal...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated Welcome & Sign-In Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col">
        <header className="px-6 py-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-base text-slate-900 tracking-tight">Personal Gemini Food Journal</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firebase Auth & IAM ADC</span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-14 flex flex-col items-center justify-center text-center space-y-8">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Powered by Gemini 3.7 Flash on Google Cloud Vertex AI</span>
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Intelligent, Private & Multimodal <br className="hidden sm:inline"/>
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Dietary Journaling
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
              Securely sign in with your Firebase credentials or Google Account. Log meals via conversational text or plate photos with zero API keys and isolated Cloud Firestore persistence.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              onClick={() => {
                setAuthModalMode("signin");
                setShowAuthModal(true);
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Email / Password</span>
            </button>
            <button
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-center space-x-2 py-3 px-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-sm shadow-sm transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google Account</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <button
              onClick={() => {
                setAuthModalMode("signup");
                setShowAuthModal(true);
              }}
              className="font-bold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New Account</span>
            </button>
            <span>&bull;</span>
            <button
              onClick={() => loginAsDemo("Dr. Nutritionist")}
              className="font-semibold text-slate-600 hover:text-slate-900 hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Explore Demo Profile</span>
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left w-full mt-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Multimodal Vision Parsing</h3>
              <p className="text-xs text-slate-500">
                Gemini 3.7 Flash analyzes plate photos and calculates caloric breakdown with medium thinking effort.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">High Thinking Insights</h3>
              <p className="text-xs text-slate-500">
                Multi-step longitudinal reasoning synthesizes 7-day and 30-day metabolic rhythms and dietary patterns.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Zero-Trust Security</h3>
              <p className="text-xs text-slate-500">
                No API keys in codebase. IAM Application Default Credentials on Vertex AI with PII-redacted telemetry.
              </p>
            </div>
          </div>
        </main>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authModalMode}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Floating Notification Banner */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center space-x-2 text-xs font-semibold animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Mobile Tab Selector */}
        <div className="flex md:hidden items-center justify-around bg-white p-1 rounded-xl border border-slate-200 mb-4 shadow-sm">
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg ${
              activeTab === "journal" ? "bg-blue-600 text-white" : "text-slate-600"
            }`}
          >
            AI Journal
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg ${
              activeTab === "logs" ? "bg-blue-600 text-white" : "text-slate-600"
            }`}
          >
            Today's Log
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg ${
              activeTab === "insights" ? "bg-blue-600 text-white" : "text-slate-600"
            }`}
          >
            Insights
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === "journal" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChatInterface
                onDraftReady={(draft) => setActiveDraft(draft)}
                onLogSavedSuccessfully={() => setRefreshTrigger((prev) => prev + 1)}
              />
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-tr from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold">Draft & Verify Guardrail</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every food intake is parsed provisionally by Gemini 3.7 Flash. Nothing is committed to your isolated Firestore account until you review and adjust portions.
                </p>
              </div>
              <FoodLogTimeline onRefreshTrigger={refreshTrigger} />
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="max-w-4xl mx-auto">
            <FoodLogTimeline onRefreshTrigger={refreshTrigger} />
          </div>
        )}

        {activeTab === "insights" && (
          <div className="max-w-5xl mx-auto">
            <InsightsDashboard />
          </div>
        )}

      </main>

      {/* Mandate 5: Draft Verification Modal */}
      {activeDraft && (
        <DraftVerificationModal
          draft={activeDraft}
          onConfirm={handleConfirmDraft}
          onCancel={() => setActiveDraft(null)}
          isSaving={isSavingDraft}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
