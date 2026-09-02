import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AuthModal } from "./AuthModal";
import { Sparkles, Calendar, PieChart, LogOut, LogIn, ShieldCheck, User as UserIcon } from "lucide-react";

interface NavbarProps {
  activeTab: "journal" | "logs" | "insights";
  setActiveTab: (tab: "journal" | "logs" | "insights") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Model Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">Gemini Food Journal</span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                    Gemini 3.7 Flash
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vertex AI (ADC IAM)</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setActiveTab("journal")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "journal"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Journal</span>
                </button>
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "logs"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Today's Log</span>
                </button>
                <button
                  onClick={() => setActiveTab("insights")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "insights"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <PieChart className="w-4 h-4" />
                  <span>Longitudinal Insights</span>
                </button>
              </nav>
            )}

            {/* User Auth Section */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || "User")}`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                    />
                    <div className="hidden sm:block text-left">
                      <div className="flex items-center space-x-1.5">
                        <p className="text-xs font-semibold text-slate-800 leading-none">{user.displayName || "User"}</p>
                        {user.isDemo && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};
