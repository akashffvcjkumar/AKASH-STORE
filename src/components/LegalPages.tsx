import React, { useState } from 'react';
import { MapPin, Mail, Phone, ShieldCheck, Truck, RotateCcw, Copy, Check, ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

interface LegalPagesProps {
  page: 'about' | 'contact' | 'payments' | 'shipping' | 'privacy' | 'terms';
  onBack: () => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ page, onBack }) => {
  const { settings, showToast } = useStore();
  const [copied, setCopied] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const bkashNumber = settings?.bkashNumber || '01874839665';

  const handleCopy = () => {
    navigator.clipboard.writeText(bkashNumber);
    setCopied(true);
    showToast(`Copied ${bkashNumber} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back to Shop */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 mb-6 group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Storefront</span>
      </button>

      {/* About Us */}
      {page === 'about' && (
        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">About Our Company</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">About AKASH STORE</h2>
            <p className="text-sm text-slate-500 mt-1">Headquartered in Sherpur, Bogura, Bangladesh</p>
          </div>

          <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 space-y-4">
            <p>
              Founded by <strong>Akash Chondror Roy</strong>, <strong>AKASH STORE</strong> is committed to bringing authentic, top-tier consumer products directly to customers across Bangladesh.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">100% Authentic</h4>
                <p className="text-xs text-slate-500 mt-1">Every product is sourced directly with original manufacturer warranty.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <Truck className="w-6 h-6 text-emerald-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">Nationwide Reach</h4>
                <p className="text-xs text-slate-500 mt-1">Reliable fulfillment covering all 64 districts and 8 divisions.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <RotateCcw className="w-6 h-6 text-emerald-600 mb-2" />
                <h4 className="font-bold text-slate-900 text-sm">Customer First</h4>
                <p className="text-xs text-slate-500 mt-1">Direct support and 7-day hassle-free return policy.</p>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 pt-2">Our Operating Headquarters</h3>
            <p>
              Our central operations, order verification center, and dispatch facility are situated in <strong>Sherpur, Bogura, Bangladesh</strong>. All transactions and customer requests are handled with absolute diligence and transparency.
            </p>
          </div>
        </div>
      )}

      {/* Contact Us */}
      {page === 'contact' && (
        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">Get in Touch</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Contact AKASH STORE</h2>
            <p className="text-sm text-slate-500 mt-1">We are ready to assist you with orders, payments, and product inquiries.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Headquarters</h4>
                    <p className="text-sm text-slate-700 font-medium">Sherpur, Bogura, Bangladesh</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Official Email</h4>
                    <a href="mailto:akashchondroroy@protonmail.com" className="text-sm text-emerald-700 font-medium hover:underline">
                      akashchondroroy@protonmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Official bKash / Hotline</h4>
                    <p className="text-sm font-mono font-bold text-slate-800">{bkashNumber}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <strong>Customer Support Hours:</strong> Everyday, 9:00 AM – 10:00 PM (BST). Orders placed online are logged 24/7.
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
              {contactSubmitted ? (
                <div className="py-8 text-center space-y-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900">Message Received</h4>
                  <p className="text-xs text-slate-500">
                    Thank you! Our support team at Sherpur, Bogura will contact you shortly.
                  </p>
                  <button
                    onClick={() => setContactSubmitted(false)}
                    className="mt-3 text-xs text-emerald-700 font-bold hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setContactSubmitted(true);
                  }}
                  className="space-y-3"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Send Direct Message</h4>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Your Name</label>
                    <input required type="text" className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Mobile or Email</label>
                    <input required type="text" className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Subject / Order ID</label>
                    <input type="text" placeholder="e.g. Inquiry on Order #AKS-..." className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Message</label>
                    <textarea required rows={3} className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600" />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Submit Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payments Policy */}
      {page === 'payments' && (
        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">Payment Guide</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">bKash, Nagad & Cash on Delivery Policy</h2>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {/* bKash Highlight */}
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-pink-800 text-sm">Official bKash Payment Number</span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xl font-black font-mono text-slate-900">{bkashNumber}</p>
              <p className="text-xs text-slate-600">
                To pay via bKash: choose Send Money or Payment to <strong>{bkashNumber}</strong> with your exact order payable amount. Note the 8-10 character Transaction ID (TrxID) and enter it during checkout.
              </p>
            </div>

            <h4 className="font-bold text-slate-900 text-sm pt-2">Server-Side Payment Verification Security</h4>
            <p>
              At AKASH STORE, we prioritize trust and security. Submitted bKash or Nagad payments are placed into our <strong>Admin Verification Queue</strong>. Our authorized payment officers compare the Transaction ID and sender number against the verified merchant account statement before releasing the order to packing.
            </p>

            <h4 className="font-bold text-slate-900 text-sm pt-2">Cash on Delivery (COD)</h4>
            <p>
              Customers choosing Cash on Delivery can inspect the external package integrity upon courier delivery before providing cash to the courier representative.
            </p>
          </div>
        </div>
      )}

      {/* Shipping & Returns */}
      {(page === 'shipping' || page === 'terms' || page === 'privacy') && (
        <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">Store Policies</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Shipping & Return Guidelines</h2>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <h4 className="font-bold text-slate-900 text-sm">Delivery Timelines & Rates</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Inside Dhaka City:</strong> ৳60 (Estimated 24–48 hours)</li>
              <li><strong>Outside Dhaka (All Bangladesh Divisions):</strong> ৳120 (Estimated 48–72 hours)</li>
              <li><strong>Free Shipping:</strong> Automatically applied to all orders with item subtotals of ৳2,000 or higher.</li>
            </ul>

            <h4 className="font-bold text-slate-900 text-sm pt-2">7-Day Replacement Policy</h4>
            <p>
              If an item is physically damaged upon arrival, missing components, or has manufacturing defects, please contact us within 7 calendar days of delivery with photos and your Order ID.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
