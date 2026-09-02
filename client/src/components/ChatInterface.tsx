import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ChatMessage } from "../services/api";
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Bot,
  Target,
  HelpCircle,
  TrendingUp,
  HeartPulse,
  RefreshCw
} from "lucide-react";

interface ChatInterfaceProps {
  refreshTrigger?: number;
}

const STARTER_SUGGESTIONS = [
  "How are my macros and calories today?",
  "What should I eat for dinner based on my logged meals?",
  "Suggest a high-protein vegetarian snack",
  "Rate my meal balance today and give suggestions"
];

const PRESET_GOALS = [
  "Weight Loss & Calorie Deficit",
  "Lean Muscle Building (High Protein)",
  "Blood Sugar & Diabetic Friendly",
  "Clean Eating & Balanced Energy"
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ refreshTrigger }) => {
  const { getToken, user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [userGoal, setUserGoal] = useState<string>("Weight Loss & Calorie Deficit");
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(STARTER_SUGGESTIONS);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "👋 Hello! I am your AI Clinical Nutrition Coach powered by Gemini on Vertex AI. I have live access to your logged meals. Ask me for personalized meal reviews, recipe tweaks, dietary suggestions, or help with your goals!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend !== undefined ? textToSend : inputText;
    if (!message.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const token = await getToken();
      const chatRes = await api.sendChatMessage(token, {
        message: message.trim(),
        history: messages,
        user_goals: userGoal
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: chatRes.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (chatRes.suggestions && chatRes.suggestions.length > 0) {
        setSuggestions(chatRes.suggestions);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `I'm having a little trouble connecting right now: ${err.message || "Please check your network."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "👋 Chat reset! How can I help you with your nutrition or meal choices right now?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    setSuggestions(STARTER_SUGGESTIONS);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px] sm:h-[720px] max-h-[85vh]">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-100 shadow-inner">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-tight">2. Two-Way AI Nutrition Coach</h3>
            <p className="text-xs text-blue-100">Live discussion & advice tailored to your logged meals</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowGoalSelector(!showGoalSelector)}
            className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-semibold flex items-center space-x-1 backdrop-blur-sm transition-all"
            title="Set Health Goal"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Goal: {userGoal.split(" ")[0]}</span>
          </button>
          <button
            type="button"
            onClick={handleResetChat}
            className="p-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-blue-100 hover:text-white transition-all"
            title="Clear Chat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Goal Selector Drawer */}
      {showGoalSelector && (
        <div className="p-3 bg-blue-50/90 border-b border-blue-200 text-xs animate-in slide-in-from-top-2 duration-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-blue-900">Select Your Primary Health & Dietary Focus:</span>
            <button
              onClick={() => setShowGoalSelector(false)}
              className="text-[11px] text-blue-600 hover:underline font-semibold"
            >
              Done
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESET_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => {
                  setUserGoal(goal);
                  setShowGoalSelector(false);
                }}
                className={`p-2 rounded-lg text-left text-[11px] font-semibold border transition-all ${
                  userGoal === goal
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-700 border-blue-200 hover:bg-blue-100/50"
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context Badge */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium">Context Active: Gemini has access to your Firestore meal history</span>
        </div>
        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
          Goal: {userGoal}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${
              msg.role === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
              }`}
            >
              {msg.role === "user" ? (
                user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                  : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/80 shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.timestamp && (
                <div
                  className={`text-[9px] text-right mt-1.5 font-medium ${
                    msg.role === "user" ? "text-blue-200" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing / Thinking Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-700 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="font-medium text-slate-600">Gemini is evaluating your nutrition data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Follow-up Chips */}
      {suggestions.length > 0 && !isLoading && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center space-x-2 min-w-max">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <HelpCircle className="w-3 h-3 text-indigo-500" />
              <span>Suggestions:</span>
            </span>
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-full text-[11px] font-medium transition-all shadow-2xs"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Gemini anything (e.g. 'Is my lunch too high in carbs?', 'What should I eat next?')"
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1.5 transition-all"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
