import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  CheckCircle2,
  Phone,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useStore } from '../context/StoreContext.js';
import { PaymentMethod } from '../types.js';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BANGLADESH_DIVISIONS = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { 
    cart, 
    clearCart, 
    cartSubtotal, 
    settings, 
    appliedCoupon, 
    couponCode,
    showToast,
    setTrackingModalOpen 
  } = useStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('');
  const [areaAddress, setAreaAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BKASH');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Submitting / Placed order state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  if (!isOpen) return null;

  // Delivery calculation
  const isInsideDhaka = division.toLowerCase().includes('dhaka') && district.toLowerCase().includes('dhaka');
  const threshold = settings?.freeDeliveryThreshold || 2000;
  const isFreeDelivery = cartSubtotal >= threshold;
  const deliveryFee = isFreeDelivery 
    ? 0 
    : (isInsideDhaka ? (settings?.insideDhakaFee || 60) : (settings?.outsideDhakaFee || 120));

  const discount = appliedCoupon?.discount || 0;
  const finalPayable = Math.max(0, cartSubtotal + deliveryFee - discount);

  const bkashNumber = settings?.bkashNumber || '01874839665';

  const handleCopyBkash = () => {
    navigator.clipboard.writeText(bkashNumber);
    setCopiedNumber(true);
    showToast(`Copied ${bkashNumber} to clipboard!`);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim() || !areaAddress.trim() || !upazila.trim()) {
      showToast('Please fill in all required address fields.', 'error');
      return;
    }

    if (paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') {
      if (!senderPhone.trim() || !transactionId.trim()) {
        showToast(`Please enter your sender mobile number and ${paymentMethod} Transaction ID.`, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          division,
          district: district.trim(),
          upazila: upazila.trim(),
          areaAddress: areaAddress.trim(),
          postalCode: postalCode.trim() || undefined,
        },
        items: cart.map(item => ({
          productId: item.product.id,
          variantId: item.variant?.id,
          productName: item.product.name,
          quantity: item.quantity,
        })),
        paymentMethod,
        paymentDetails: (paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') ? {
          senderPhone: senderPhone.trim(),
          transactionId: transactionId.trim().toUpperCase(),
        } : undefined,
        couponCode: appliedCoupon?.code || couponCode,
      };

      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to place order', 'error');
        setIsSubmitting(false);
        return;
      }

      setPlacedOrder(data.order);
      clearCart();
      showToast(`Order #${data.order.id} placed successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Connection error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {placedOrder ? 'Order Placed Successfully!' : 'Secure Bangladesh Checkout'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Confirmed Success Screen */}
        {placedOrder ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Order Confirmed
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                Thank You, {placedOrder.customer.fullName}!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your order has been recorded in the AKASH STORE system.
              </p>
            </div>

            {/* Order Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 text-left space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <span className="text-xs text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-sm text-emerald-700 select-all">
                  {placedOrder.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{placedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Payment Status:</span>
                <span className={`font-semibold px-2 py-0.5 rounded ${
                  placedOrder.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {placedOrder.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-medium text-slate-800 text-right max-w-xs">
                  {placedOrder.customer.areaAddress}, {placedOrder.customer.upazila}, {placedOrder.customer.district}, {placedOrder.customer.division}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200 font-bold">
                <span className="text-slate-900">Total Amount:</span>
                <span className="text-emerald-700 text-base">৳{placedOrder.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Note regarding verification */}
            {placedOrder.paymentMethod === 'BKASH' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left">
                <strong>bKash Verification Note:</strong> Our admin team will verify your submitted Transaction ID against our official bKash account statement (<strong>{bkashNumber}</strong>) and confirm order dispatch shortly.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  setTrackingModalOpen(true);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Track This Order</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="p-5 sm:p-7 space-y-6">
            
            {/* Step 1: Customer Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>1. Bangladesh Delivery Address</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Mahmudul Hasan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number (01XXXXXXXXX) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Division *
                  </label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    {BANGLADESH_DIVISIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    District / City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Bogura or Dhaka"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Thana / Upazila *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Sherpur or Dhanmondi"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="customer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Street Address (House, Road, Area) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g., Holding 42, Station Road, Ward 4, Sherpur"
                  value={areaAddress}
                  onChange={(e) => setAreaAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>2. Select Payment Method</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                
                {/* bKash Radio */}
                <div 
                  onClick={() => setPaymentMethod('BKASH')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'BKASH'
                      ? 'border-pink-600 bg-pink-50/70 ring-1 ring-pink-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-pink-700">bKash</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'BKASH' ? 'border-pink-600 bg-pink-600' : 'border-slate-300'
                    }`}>
                      {paymentMethod === 'BKASH' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Instant mobile transfer
                  </p>
                </div>

                {/* Cash on Delivery Radio */}
                <div 
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800">Cash on Delivery</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'COD' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}>
                      {paymentMethod === 'COD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Pay upon doorstep delivery
                  </p>
                </div>

                {/* Nagad Radio */}
                <div 
                  onClick={() => {
                    if (settings?.nagadEnabled) setPaymentMethod('NAGAD');
                    else showToast('Nagad is currently disabled in store settings.', 'info');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    !settings?.nagadEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    paymentMethod === 'NAGAD'
                      ? 'border-orange-600 bg-orange-50/70 ring-1 ring-orange-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-orange-700">Nagad</span>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      paymentMethod === 'NAGAD' ? 'border-orange-600 bg-orange-600' : 'border-slate-300'
                    }`}>
                      {paymentMethod === 'NAGAD' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {settings?.nagadEnabled ? 'Mobile payment' : 'Coming soon'}
                  </p>
                </div>

              </div>

              {/* BKASH SPECIAL FLOW (Strict prompt requirements) */}
              {paymentMethod === 'BKASH' && (
                <div className="p-4 bg-pink-50/60 border border-pink-200 rounded-xl space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-white border border-pink-200 rounded-lg">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-pink-700 tracking-wider block">
                        bKash Payment Number
                      </span>
                      <span className="text-lg font-black text-slate-900 tracking-wider font-mono">
                        {bkashNumber}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyBkash}
                      className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNumber ? 'Copied!' : 'Copy Number'}</span>
                    </button>
                  </div>

                  {/* Required instruction prompt */}
                  <div className="text-xs text-slate-700 bg-pink-100/60 p-2.5 rounded-lg font-medium">
                    Please send exact payable amount: <strong className="font-bold text-pink-800">Send ৳{finalPayable.toLocaleString()} to {bkashNumber}</strong> via bKash "Send Money" or "Payment".
                  </div>

                  {/* Customer inputs TrxID & Sender Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Your bKash Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="01XXXXXXXXX"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-pink-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        bKash Transaction ID (TrxID) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., BK90287162"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs bg-white border border-pink-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-600 uppercase font-mono font-bold"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    Note: Payments are held in "Verification Pending" until server-side transaction matching is confirmed by store administration.
                  </p>
                </div>
              )}

              {/* COD Notice */}
              {paymentMethod === 'COD' && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Cash on Delivery Terms</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pay ৳{finalPayable.toLocaleString()} in cash to the delivery courier once your package arrives. Our team may phone you to confirm delivery details.
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Order Summary */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-semibold text-slate-900">৳{cartSubtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span className="font-semibold">-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee ({isInsideDhaka ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                <span className="font-semibold text-slate-900">
                  {deliveryFee === 0 ? 'FREE' : `৳${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Payable Amount</span>
                <span className="text-emerald-700 text-lg">৳{finalPayable.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <span>Place Order • ৳{finalPayable.toLocaleString()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
