import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, MealParseResponse } from "../services/api";
import { ImageUploader } from "./ImageUploader";
import { 
  Send, 
  Sparkles, 
  User, 
  Loader2, 
  Camera, 
  Zap, 
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "gemini";
  text: string;
  image?: string;
  timestamp: string;
  draft?: MealParseResponse;
}

interface ChatInterfaceProps {
  onDraftReady: (draft: MealParseResponse) => void;
  onLogSavedSuccessfully: () => void;
}

const QUICK_PROMPTS = [
  "2 Rotis with Moong Dal and Cucumber Salad for lunch",
  "Oatmeal with Almond Milk, Chia Seeds, and Blueberries",
  "Grilled Chicken Breast with Steamed Broccoli and Brown Rice",
  "Greek Yogurt with Honey, Walnuts, and Strawberries"
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onDraftReady }) => {
  const { getToken, user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "gemini",
      text: "Hello! I am your Personal Gemini Food Journal assistant powered by Gemini 3.7 Flash. Tell me what you ate or snap a picture of your plate to get started.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt !== undefined ? customPrompt : inputText;
    if ((!textToSend.trim() && !imageBase64) || isAnalyzing) return;

    const userMessage: Message = {
      id: "msg_" + Date.now(),
      sender: "user",
      text: textToSend,
      image: imageBase64 || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    const sentImageBase64 = imageBase64;
    const sentImageMimeType = imageMimeType;
    setImageBase64(null);
    setShowImageUploader(false);
    setIsAnalyzing(true);

    try {
      const token = await getToken();
      const draft = await api.parseMeal(token, {
        text: textToSend || undefined,
        image_base64: sentImageBase64 || undefined,
        image_mime_type: sentImageMimeType,
      });

      const geminiMessage: Message = {
        id: "msg_gemini_" + Date.now(),
        sender: "gemini",
        text: `I've analyzed your meal (${draft.meal_type}) with ${Math.round(draft.confidence_score * 100)}% confidence: ${draft.total_calories} kcal (${draft.total_protein_g}g Protein, ${draft.total_carbs_g}g Carbs, ${draft.total_fat_g}g Fat). Please review and confirm the draft.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        draft: draft,
      };

      setMessages((prev) => [...prev, geminiMessage]);
      onDraftReady(draft);
    } catch (err: any) {
      const errorMessage: Message = {
        id: "msg_err_" + Date.now(),
        sender: "gemini",
        text: `Failed to analyze meal: ${err.message || "Please check connection or backend logs."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Multimodal Food Assistant</h3>
            <p className="text-[11px] text-slate-500">Gemini 3.7 Flash &bull; Medium Thinking Level Ingestion</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowImageUploader(!showImageUploader)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            showImageUploader || imageBase64
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-blue-600" />
          <span>{imageBase64 ? "Image Attached" : "Add Plate Photo"}</span>
        </button>
      </div>

      {/* Optional Image Uploader Drawer */}
      {showImageUploader && (
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 animate-in slide-in-from-top-2 duration-200">
          <ImageUploader
            selectedImageBase64={imageBase64}
            onImageSelected={(b64, mime) => {
              setImageBase64(b64);
              setImageMimeType(mime);
              if (!b64) setShowImageUploader(false);
            }}
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === "user" ? "flex-row-reverse space-x-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
              }`}
            >
              {msg.sender === "user" ? (
                user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-4 text-xs space-y-2 leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                  : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/70 shadow-sm"
              }`}
            >
              {msg.image && (
                <div className="rounded-xl overflow-hidden border border-white/20 mb-2">
                  <img src={msg.image} alt="Uploaded meal" className="w-full max-h-48 object-cover" />
                </div>
              )}
              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

              {/* Action pill to reopen draft review */}
              {msg.draft && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-medium">Draft generated</span>
                  <button
                    onClick={() => onDraftReady(msg.draft!)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Open Review Modal
                  </button>
                </div>
              )}

              <div
                className={`text-[9px] text-right font-medium ${
                  msg.sender === "user" ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Gemini Thinking / Analyzing State */}
        {isAnalyzing && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-100 border border-slate-200/80 rounded-2xl rounded-tl-none p-4 text-xs text-slate-700 max-w-sm space-y-2 animate-shimmer">
              <div className="flex items-center space-x-2 font-bold text-indigo-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gemini 3.7 Flash Thinking...</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Deconstructing ingredients, estimating portion weights, and calculating macronutrient density on Vertex AI.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompt Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center space-x-2 min-w-max">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Examples:</span>
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isAnalyzing}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-full text-[11px] transition-all"
              >
                {prompt}
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
        className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
      >
        <button
          type="button"
          onClick={() => setShowImageUploader(!showImageUploader)}
          className={`p-2 rounded-xl border transition-colors ${
            imageBase64
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200"
          }`}
          title="Upload or Snap Meal Image"
        >
          <Camera className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            imageBase64
              ? "Add optional text context (e.g., 'half a cup of sambar')..."
              : "Type your meal (e.g., '2 scrambled eggs with toast and black coffee')..."
          }
          disabled={isAnalyzing}
          className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
        />

        <button
          type="submit"
          disabled={isAnalyzing || (!inputText.trim() && !imageBase64)}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 disabled:opacity-40 transition-all flex items-center justify-center"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

    </div>
  );
};
