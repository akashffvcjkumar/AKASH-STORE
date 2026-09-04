import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Tag, 
  BellRing, 
  Loader2 
} from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

export const NewsletterSection: React.FC = () => {
  const { subscribeNewsletter, newsletterSubscribers } = useStore();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [hasSubscribedSuccessfully, setHasSubscribedSuccessfully] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const result = await subscribeNewsletter(email);
      if (result.success) {
        setHasSubscribedSuccessfully(true);
        setStatusMessage({
          type: result.alreadySubscribed ? 'info' : 'success',
          text: result.message
        });
        if (!result.alreadySubscribed) {
          setEmail('');
        }
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSubscribersCount = Math.max(1450, 1450 + (newsletterSubscribers?.length || 0));

  return (
    <div className="mb-12 relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 p-6 sm:p-8 md:p-10 shadow-xl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Col: Header and Highlights */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-400 text-[11px] font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>EXCLUSIVE VIP OFFERS & UPDATES</span>
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
            Stay in the Loop with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">AKASH STORE</span>
          </h3>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            Subscribe to our newsletter to receive secret discount vouchers, flash sale countdowns, and instant notifications when new genuine tech & lifestyle products arrive in Bangladesh.
          </p>

          {/* Value Props Pills */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200 font-medium">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant ৳100–৳200 Vouchers</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200 font-medium">
              <BellRing className="w-3.5 h-3.5 text-emerald-400" />
              <span>Early Access to Stock</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>No Spam • 1-Click Opt Out</span>
            </div>
          </div>
        </div>

        {/* Right Col: Subscription Form */}
        <div className="lg:col-span-5">
          <div className="p-5 sm:p-6 rounded-xl bg-slate-950/70 border border-slate-800 backdrop-blur-sm">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Join {totalSubscribersCount.toLocaleString()}+ Happy Shoppers</span>
            </h4>

            {hasSubscribedSuccessfully ? (
              <div className="space-y-3 py-2 animate-in fade-in duration-300">
                <div className="flex items-start gap-3 p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-300">You're Subscribed!</p>
                    <p className="text-[11px] text-emerald-400/90 mt-0.5 leading-relaxed">
                      {statusMessage?.text || "Thank you for joining. You'll be the first to receive marketing offers and coupons."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setHasSubscribedSuccessfully(false);
                    setStatusMessage(null);
                    setEmail('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors underline cursor-pointer"
                >
                  Subscribe another email address
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (statusMessage) setStatusMessage(null);
                      }}
                      placeholder="Enter your email (e.g. name@gmail.com)"
                      required
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {statusMessage && (
                  <div
                    className={`text-[11px] font-medium p-2.5 rounded-lg flex items-center gap-2 animate-in fade-in ${
                      statusMessage.type === 'error'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <>
                      <span>Subscribe to Updates</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  🔒 We respect your privacy. No spam ever. Stored securely in database.
                </p>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
