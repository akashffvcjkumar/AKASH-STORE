import React, { useState } from 'react';
import { X, Search, Truck, CheckCircle2, Clock, PackageCheck, AlertCircle, MapPin } from 'lucide-react';
import { OrderRecord, OrderStatus } from '../types.js';
import { useStore } from '../context/StoreContext.js';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Payment Confirmed' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'PACKED', label: 'Packed' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useStore();
  const [query, setQuery] = useState('');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setOrder(null);
        showToast('Order not found. Please verify the ID or phone number.', 'error');
      }
    } catch {
      setOrder(null);
      showToast('Network error while searching order.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatus = (stepStatus: OrderStatus) => {
    if (!order) return 'upcoming';

    const orderStatuses: OrderStatus[] = [
      'PENDING', 
      'PAYMENT_VERIFICATION', 
      'CONFIRMED', 
      'PROCESSING', 
      'PACKED', 
      'SHIPPED', 
      'OUT_FOR_DELIVERY', 
      'DELIVERED'
    ];

    const currentIndex = orderStatuses.indexOf(order.status);
    const stepIndex = orderStatuses.indexOf(stepStatus);

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return 'cancelled';
    }

    if (stepIndex <= currentIndex && currentIndex !== -1) {
      return 'completed';
    }
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Track Your Order</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Enter Order ID or Customer Mobile Number:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., AKS-20260902-000101 or 01712345678"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Searching...' : 'Track'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Demo sample Order IDs: <code>AKS-20260902-000101</code>, <code>AKS-20260902-000102</code>
            </p>
          </form>

          {/* Results */}
          {order ? (
            <div className="space-y-5 pt-2 border-t border-slate-100">
              {/* Summary Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{order.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-medium text-slate-800">{order.customer.fullName} ({order.customer.phone})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-medium text-slate-800 text-right">
                    {order.customer.upazila}, {order.customer.district}, {order.customer.division}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Total:</span>
                  <span className="font-bold text-slate-900">৳{order.total.toLocaleString()} ({order.paymentMethod})</span>
                </div>
              </div>

              {/* Visual Step Progress Tracker */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Fulfillment Status
                </h4>

                <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-3 py-1">
                  {ORDER_STEPS.map((step, idx) => {
                    const status = getStepStatus(step.status);
                    const isCompleted = status === 'completed';
                    const timelineMatch = order.timeline.find(t => t.status === step.status);

                    return (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-300 text-transparent'
                        }`}>
                          {isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div>
                          <div className="flex items-baseline justify-between">
                            <h5 className={`text-xs font-semibold ${isCompleted ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                              {step.label}
                            </h5>
                            {timelineMatch && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(timelineMatch.timestamp).toLocaleDateString()} {new Date(timelineMatch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          {timelineMatch?.note && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {timelineMatch.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items in order */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Items in Package
                </h4>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span>{i.productName} {i.variantName ? `(${i.variantName})` : ''} x {i.quantity}</span>
                      <span className="font-semibold text-slate-900">৳{i.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : hasSearched && !isLoading ? (
            <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-xs sm:text-sm">No order found matching "{query}"</p>
              <p className="text-[11px] text-slate-400 mt-1">Please double-check your Order ID or phone number.</p>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
};
