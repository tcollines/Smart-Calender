import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronRight,
  Inbox,
  ArrowLeft
} from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pending email verification state
  const [isPendingConfirmation, setIsPendingConfirmation] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (isSignUp && !name) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            name: name.trim()
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create account.");
        }

        if (data.confirmationRequired) {
          setPendingEmail(email.trim().toLowerCase());
          setIsPendingConfirmation(true);
        } else {
          setSuccess("Account successfully created! Signing you in...");
          setTimeout(() => {
            if (data.user) {
              onLoginSuccess(data.user);
            }
          }, 1000);
        }
      } else {
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          // If the error indicates email confirmation is pending
          if (data.error && (
            data.error.toLowerCase().includes("confirm") || 
            data.error.toLowerCase().includes("verify") || 
            data.error.toLowerCase().includes("email_not_confirmed")
          )) {
            setPendingEmail(email.trim().toLowerCase());
            setIsPendingConfirmation(true);
            return;
          }
          throw new Error(data.error || "Invalid email or password.");
        }

        if (data.user) {
          onLoginSuccess(data.user);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setIsSignUp(false);
    setEmail("demo@example.com");
    setPassword("demo123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]/50 flex items-center justify-center p-4 sm:p-6 select-none font-sans relative overflow-hidden">
      {/* Decorative ambient background spots */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/20 rounded-full filter blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-200/20 rounded-full filter blur-3xl -z-10" />

      <div className="w-full max-w-[460px] flex flex-col gap-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="h-12 w-12 bg-[#FF6A3D] text-white rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(255,106,61,0.25)]">
            <Calendar className="w-6 h-6 stroke-[2px]" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-gray-950 flex items-center justify-center gap-1.5 mt-2">
              Chronos Workspace
              <Sparkles className="w-4 h-4 text-[#FF6A3D] fill-[#FF6A3D]/20 animate-pulse" />
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Your beautifully crafted agenda scheduler</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isPendingConfirmation ? (
            /* CONFIRM EMAIL SCREEN */
            <motion.div
              key="confirm-email-card"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-6 sm:p-8 relative overflow-hidden text-center"
            >
              {/* Top subtle highlight line */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-[#FF6A3D]" />

              <div className="mx-auto w-16 h-16 bg-orange-50 text-[#FF6A3D] rounded-2xl flex items-center justify-center mb-6 animate-bounce">
                <Inbox className="w-8 h-8 stroke-[1.8px]" />
              </div>

              <h2 className="text-xl font-bold text-gray-950 mb-2">Confirm your email</h2>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto mb-6">
                We've sent a verification link to <strong className="text-gray-900 font-semibold">{pendingEmail}</strong>. 
                Please click the link in the email to activate your account and access your calendar.
              </p>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left flex flex-col gap-2.5 mb-6">
                <span className="text-[10px] font-mono font-bold uppercase text-gray-400 tracking-wider">Next steps</span>
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <div className="h-5 w-5 rounded-full bg-orange-100 text-[#FF6A3D] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <p className="leading-snug">Check your email client (look in spam or promotions folder if you don't see it).</p>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <div className="h-5 w-5 rounded-full bg-orange-100 text-[#FF6A3D] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <p className="leading-snug">Click the link inside to verify your email address.</p>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <div className="h-5 w-5 rounded-full bg-orange-100 text-[#FF6A3D] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <p className="leading-snug">Return here and click the button below to sign in!</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsPendingConfirmation(false);
                    setIsSignUp(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="w-full py-2.5 px-4 bg-[#FF6A3D] text-white font-sans font-bold text-xs rounded-xl hover:bg-[#e0562b] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(255,106,61,0.2)]"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsPendingConfirmation(false);
                    setError(null);
                  }}
                  className="text-[11px] font-sans font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to registration page</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* MAIN SIGN IN / SIGN UP SCREEN */
            <motion.div 
              key="auth-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.03)] p-6 sm:p-8 relative overflow-hidden"
            >
              {/* Top subtle highlight line */}
              <div className="absolute top-0 inset-x-0 h-[3px] bg-[#FF6A3D]" />

              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                {isSignUp ? "Sign up to begin scheduling tasks and synchronising events." : "Enter your credentials to access your agenda planner."}
              </p>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-5 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-700 leading-normal font-medium">{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700 leading-normal font-medium">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {isSignUp && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-1.5"
                    >
                      <label htmlFor="auth-name" className="text-[11px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="auth-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jane Doe"
                          disabled={loading}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF6A3D] focus:border-[#FF6A3D] transition-all disabled:opacity-60"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-email" className="text-[11px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@example.com"
                      disabled={loading}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF6A3D] focus:border-[#FF6A3D] transition-all disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="auth-password" className="text-[11px] font-mono font-bold uppercase text-gray-400 tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-11 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#FF6A3D] focus:border-[#FF6A3D] transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full py-2.5 px-4 bg-[#FF6A3D] text-white font-sans font-bold text-xs rounded-xl hover:bg-[#e0562b] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(255,106,61,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Screen Mode */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex justify-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-[11px] font-sans font-bold text-gray-500 hover:text-[#FF6A3D] transition-colors"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account yet? Create One"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo Quick fill credentials card */}
        {!isSignUp && !isPendingConfirmation && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleDemoFill}
            className="p-3 bg-white/75 hover:bg-white border border-gray-200/60 rounded-xl shadow-sm text-left flex items-center justify-between gap-3 group transition-all"
          >
            <div>
              <span className="text-[9px] font-mono font-bold uppercase text-gray-400">Demo Account</span>
              <p className="text-[11px] text-gray-600 font-sans font-medium mt-0.5">
                Click to instantly fill demo credentials (<code className="font-mono bg-gray-100/50 px-1 py-0.5 rounded text-[10px] font-bold">demo@example.com</code>)
              </p>
            </div>
            <div className="p-2 bg-orange-50 text-[#FF6A3D] group-hover:bg-[#FF6A3D] group-hover:text-white rounded-lg transition-all shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}
