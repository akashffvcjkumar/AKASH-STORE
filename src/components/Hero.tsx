import React from 'react';
import { ShieldCheck, Truck, CreditCard, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

interface HeroProps {
  onShopNow: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onShopNow }) => {
  const { setAiModalOpen, setTrackingModalOpen, settings } = useStore();

  return (
    <div className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden py-12 sm:py-16 md:py-20">
      {/* Subtle geometric background pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official AKASH STORE Bangladesh</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Shop Smarter. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Live Better.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Discover quality products with secure payment and convenient delivery across Bangladesh. From everyday essentials to authentic premium electronics, verified by our team in Sherpur, Bogura.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onShopNow}
                className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setTrackingModalOpen(true)}
                className="px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm sm:text-base border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Track Order</span>
              </button>

              <button
                onClick={() => setAiModalOpen(true)}
                className="px-5 py-3 rounded-full bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 font-medium text-sm sm:text-base border border-emerald-700/50 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Ask AI Assistant</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>bKash ({settings?.bkashNumber || '01874839665'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Cash on Delivery across BD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>7-Day Return Policy</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-2xl backdrop-blur-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700 text-xs">
                <span className="text-slate-400 font-mono">AKASH STORE PROMISE</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                  VERIFIED MERCHANT
                </span>
              </div>

              <div className="py-4 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">100% Authentic Products</h4>
                    <p className="text-xs text-slate-400">Sourced directly with genuine brand warranties.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">Safe Payment Verification</h4>
                    <p className="text-xs text-slate-400">
                      bKash & Nagad verified via unique transaction IDs before dispatch.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">Bangladesh-Wide Shipping</h4>
                    <p className="text-xs text-slate-400">
                      Dhaka (৳60) & Outside Dhaka (৳120). Free shipping on orders over ৳2,000.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
                <span>Founder: Akash Chondror Roy</span>
                <span className="font-medium text-emerald-400">Sherpur, Bogura</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
