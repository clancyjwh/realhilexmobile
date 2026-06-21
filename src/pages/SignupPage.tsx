import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { CheckCircle2, XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { generateRandomAnimalName, getDefaultNotificationPreferences } from "../utils/animalNames";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState(""); // Kept for API compatibility, set to empty
  const [lastName, setLastName] = useState("");   // Kept for API compatibility, set to empty
  const [businessName, setBusinessName] = useState(""); // Kept for API compatibility, set to empty
  const [website, setWebsite] = useState(""); // Honeypot field
  const [message, setMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planParam = searchParams.get("plan");
  
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>("premium");
  const [step, setStep] = useState(2);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setMessage("Please agree to the Terms and Conditions to create an account.");
      return;
    }

    if (!isPasswordValid) {
      setMessage("Please ensure your password meets all requirements.");
      return;
    }

    if (!doPasswordsMatch) {
      setMessage("Passwords do not match. Please try again.");
      return;
    }

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    setProcessing(true);

    try {
      setMessage("Creating account...");

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: "",
            last_name: "",
            business_name: "",
            plan: selectedPlan,
          },
        },
      });

      if (signUpError) {
        console.error("Signup error details:", signUpError);
        setMessage("Error: " + signUpError.message);
        setProcessing(false);
        return;
      }

      if (signUpData.user && signUpData.session) {
        const randomAnimalName = generateRandomAnimalName();
        const defaultNotificationPreferences = getDefaultNotificationPreferences();

        setTimeout(async () => {
          try {
            await supabase
              .from('profiles')
              .update({
                display_name: randomAnimalName,
                notification_preferences: defaultNotificationPreferences,
              })
              .eq('id', signUpData.user!.id);
          } catch (error) {
            console.error("Background profile update failed:", error);
          }
        }, 1500);

        setTimeout(async () => {
          try {
            const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup-webhook`;
            await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                full_name: "New HiLEX Member",
                email: email,
                website: website,
              }),
            });
          } catch (error) {
            console.error('Webhook notification failed:', error);
          }
        }, 100);

        setMessage("Account created successfully! Redirecting...");
        // @ts-ignore
        if (window.plausible) window.plausible('Signup Completed', { props: { plan: selectedPlan } });
        
        setTimeout(() => {
          const redirect = searchParams.get('redirect');
          if (redirect === 'bespoke-projects') {
            navigate('/bespoke-projects');
          } else if (redirect === 'get-premium') {
            navigate('/get-premium');
          } else {
            navigate('/');
          }
        }, 1000);
      } else if (signUpData.user && !signUpData.session) {
        setMessage("Email confirmation is enabled. Please disable it in Supabase Auth settings.");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMessage(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.");
      setProcessing(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!agreedToTerms) {
      setMessage("You must agree to the Terms and Conditions and acknowledge the high risks of trading before continuing.");
      return;
    }
    setProcessing(true);
    // Redirect to the serverless auth route with the selected plan
    window.location.href = `/api/auth/google?plan=${selectedPlan || 'free'}`;
  };


  // UI Step Renderers
  const renderPlanSelectionStep = () => (
    <div className="flex flex-col gap-4">
      <div 
        onClick={() => setSelectedPlan("free")}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          selectedPlan === "free" ? "border-orange-500 bg-orange-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-white text-lg">Free</span>
          <span className="text-orange-500 font-bold">$0/mo</span>
        </div>
        <p className="text-xs text-slate-400 italic">Standard features access</p>
      </div>

      <div 
        onClick={() => setSelectedPlan("sports")}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          selectedPlan === "sports" ? "border-orange-500 bg-orange-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-white text-lg">Sports Trial</span>
          <span className="text-orange-500 font-bold">7 Days Free</span>
        </div>
        <p className="text-xs text-slate-300">NHL, NBA, Soccer, and UFC Intelligence. Then $29/mo.</p>
      </div>

      <div 
        onClick={() => setSelectedPlan("finance")}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          selectedPlan === "finance" ? "border-orange-500 bg-orange-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-white text-lg">Finance Trial</span>
          <span className="text-orange-500 font-bold">7 Days Free</span>
        </div>
        <p className="text-xs text-slate-300">Advanced financial tools and analytics. Then $49/mo.</p>
      </div>

      <div 
        onClick={() => setSelectedPlan("premium")}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          selectedPlan === "premium" ? "border-orange-500 bg-orange-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-white text-lg">Premium Trial</span>
          <span className="text-orange-500 font-bold">7 Days Free</span>
        </div>
        <p className="text-xs text-slate-300">Full access to HiLEX tools and indicators. Then $1,000/mo.</p>
      </div>

      <button
        type="button"
        disabled={!selectedPlan}
        onClick={() => {
          setStep(2);
          // @ts-ignore
          if (window.plausible) window.plausible('Signup Started', { props: { plan: selectedPlan } });
        }}
        className="p-3 mt-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-slate-700 disabled:text-slate-500 font-black uppercase tracking-tight shadow-xl active:scale-95 transition-all"
      >
        Continue
      </button>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="flex flex-col gap-3">
      {/* Account Info */}
      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          className="w-full px-5 py-4 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00D8FF]/30 focus:border-[#00D8FF]/30 transition-all text-sm w-full"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          required
        />
        <div className="grid grid-cols-1 gap-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00D8FF]/30 focus:border-[#00D8FF]/30 transition-all text-sm"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00D8FF]/30 focus:border-[#00D8FF]/30 transition-all text-sm"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
            required
          />
        </div>
      </div>
 
      {/* Password Requirements */}
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Security Check</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className={`flex items-center gap-1.5 text-[10px] ${passwordRequirements.minLength ? "text-green-400" : "text-slate-500"}`}>
            {passwordRequirements.minLength ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            8+ chars
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] ${passwordRequirements.hasUpperCase ? "text-green-400" : "text-slate-500"}`}>
            {passwordRequirements.hasUpperCase ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            Uppercase
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] ${passwordRequirements.hasLowerCase ? "text-green-400" : "text-slate-500"}`}>
            {passwordRequirements.hasLowerCase ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            Lowercase
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] ${passwordRequirements.hasNumber ? "text-green-400" : "text-slate-500"}`}>
            {passwordRequirements.hasNumber ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            Number
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] ${passwordRequirements.hasSymbol ? "text-green-400" : "text-slate-500"}`}>
            {passwordRequirements.hasSymbol ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            Symbol
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] ${doPasswordsMatch ? "text-green-400" : "text-slate-500"}`}>
            {doPasswordsMatch ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            Match
          </div>
        </div>
      </div>

      {/* Trial Info Info Alert */}
      {selectedPlan !== "free" && (
        <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20 space-y-2 my-2">
          <div className="flex items-center gap-2 text-orange-500 font-bold">
            <CreditCard className="w-4 h-4 text-orange-500" />
            <span className="text-xs uppercase tracking-wider">7-DAY FREE TRIAL</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
            No credit card required today. Your 7-day free trial will start immediately. You can cancel or subscribe at any time.
          </p>
        </div>
      )}

      {/* Honeypot */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2 p-1 mt-1">
        <input
          type="checkbox"
          id="terms"
          checked={agreedToTerms}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreedToTerms(e.target.checked)}
          className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#00D8FF] focus:ring-[#00D8FF]/30 accent-[#00D8FF] mt-0.5 flex-shrink-0"
          required
        />
        <label htmlFor="terms" className="text-[10px] text-slate-400 leading-normal select-none cursor-pointer">
          I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#00D8FF] underline font-bold">Terms</button> and acknowledge the high risks of trading.
        </label>
      </div>
      
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={processing || !email.trim() || !password || !isPasswordValid || !doPasswordsMatch || !agreedToTerms}
          className="w-full font-black uppercase tracking-widest py-4 px-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-[#0a0a0f] text-sm shadow-[0_0_30px_rgba(0,216,255,0.2)]"
          style={{
            background: processing ? 'rgba(0,216,255,0.5)' : '#00D8FF',
          }}
        >
          {processing ? "Processing..." : "Complete Setup"}
        </button>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase font-mono">
          <span className="bg-[#020617] px-3 text-slate-500 rounded-md py-0.5 border border-white/5">Or continue with</span>
        </div>
      </div>
 
      <button
        type="button"
        disabled={processing}
        onClick={handleGoogleSignup}
        className="w-full font-semibold py-4 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 text-white border border-white/5 hover:border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.67 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Sign up with Google</span>
      </button>
    </div>
  );


  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden font-sans"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Cyan glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,216,255,0.1) 0%, transparent 65%)', filter: 'blur(60px)' }}
      />

      <div className="flex items-center justify-center p-6 min-h-screen relative z-10">
        <form
          onSubmit={handleSignup}
          className="w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-white/10 relative overflow-hidden flex flex-col gap-4"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
        {/* Logo */}
        <div className="flex items-center justify-center mb-4">
          <div className="p-0.5 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 20px rgba(0,0,0,0.2)' }}>
            <img src="/logo.png" alt="HiLEX Logo" className="w-20 h-20 object-contain rounded-lg" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">
            Account Setup
          </h1>
        </div>

        {step === 1 && renderPlanSelectionStep()}
        {step === 2 && renderDetailsStep()}

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="text-xs text-slate-500 hover:text-white transition-colors mt-6 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> Already have an account? Login
        </button>

        {message && (
          <p className={`text-xs text-center mt-4 p-3 rounded border font-bold uppercase tracking-tight ${
            message.includes('successfully') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {message}
          </p>
        )}
      </form>
    </div>

      {showTermsModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden border-2 border-slate-700 shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-700 text-center">
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">HiLEX Terms of Service</h2>
            </div>
            <div className="p-8 overflow-y-auto text-sm text-slate-300 space-y-6 leading-relaxed">
              <section>
                <h3 className="font-bold text-white uppercase text-xs mb-2">1. Nature of Service</h3>
                <p>HiLEX provides educational tools and analysis. We are not a broker, advisor, or investment manager.</p>
              </section>
              <section>
                <h3 className="font-bold text-red-500 uppercase text-xs mb-2">2. Massive Risk Warning</h3>
                <p className="font-bold italic">Trading financial markets involves extreme risk. You may lose all your capital. Past performance is zero guarantee of future success.</p>
              </section>
              <section>
                <h3 className="font-bold text-white uppercase text-xs mb-2">3. No Guarantees</h3>
                <p>We provide indicators and data as-is. We do not guarantee accuracy, reliability, or profitability.</p>
              </section>
              <section>
                <h3 className="font-bold text-white uppercase text-xs mb-2">4. Subscriptions</h3>
                <p>Premium tiers are billed monthly. Cancellations take effect at the end of the current cycle. No refunds.</p>
              </section>
            </div>
            <div className="p-6 border-t border-slate-700 flex gap-4">
              <button 
                onClick={() => { setAgreedToTerms(false); setShowTermsModal(false); }}
                className="flex-1 p-3 bg-slate-700 text-white font-bold rounded-lg uppercase text-xs tracking-widest"
              >
                Decline
              </button>
              <button 
                onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}
                className="flex-1 p-3 bg-orange-500 text-white font-bold rounded-lg uppercase text-xs tracking-widest"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
