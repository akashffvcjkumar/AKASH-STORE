import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { PaymentRecord } from '../../types.js';
import { useStore } from '../../context/StoreContext.js';

export const PaymentsQueue: React.FC = () => {
  const { token, showToast, currentStaff, permissions } = useStore();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Reject modal
  const [rejectPaymentItem, setRejectPaymentItem] = useState<PaymentRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPayments = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      let url = `/api/admin/payments?status=${statusFilter}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to load payments', 'error');
      }
    } catch {
      showToast('Network error loading payments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token, statusFilter]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Verify payment
  const handleVerify = async (payment: PaymentRecord) => {
    try {
      const res = await fetch(`/api/admin/payments/${payment.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: 'Transaction confirmed via bKash statement.' }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to verify payment', 'error');
        return;
      }

      showToast(`Payment ${payment.id} verified! Order marked as CONFIRMED.`);
      fetchPayments();
    } catch {
      showToast('Network error verifying payment', 'error');
    }
  };

  // Reject payment with mandatory reason
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectPaymentItem || !rejectReason.trim()) {
      showToast('Please provide a reason for rejecting this payment.', 'error');
      return;
    }

    setIsRejecting(true);
    try {
      const res = await fetch(`/api/admin/payments/${rejectPaymentItem.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to reject payment', 'error');
        return;
      }

      showToast(`Payment rejected. Reason logged in audit records.`);
      setRejectPaymentItem(null);
      setRejectReason('');
      fetchPayments();
    } catch {
      showToast('Network error rejecting payment', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Explanation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">bKash & Nagad Payment Verification Queue</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Per strict security guidelines, online payments remain in <strong>VERIFICATION_PENDING</strong> until authorized staff matches the Transaction ID (TrxID) and sender number against store statements. Rejections strictly mandate a logged audit reason.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'VERIFICATION_PENDING', 'PAID', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search TrxID, order, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Method & Numbers</th>
                <th className="py-3 px-4">Transaction ID (TrxID)</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No payment records found matching this filter.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isPending = p.status === 'VERIFICATION_PENDING' || p.status === 'PENDING';
                  const isPaid = p.status === 'PAID';
                  const isRejected = p.status === 'REJECTED';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {p.id}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                        {p.orderId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            p.method === 'BKASH' ? 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 dark:border dark:border-pink-800' :
                            p.method === 'NAGAD' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 dark:border dark:border-orange-800' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {p.method}
                          </span>
                          {p.senderPhone && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                              From: {p.senderPhone}
                            </div>
                          )}
                          {p.receiverPhone && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              To: {p.receiverPhone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.transactionId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded select-all text-xs border border-transparent dark:border-slate-700">
                              {p.transactionId}
                            </span>
                            <button
                              onClick={() => handleCopy(p.transactionId!, p.id)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                              title="Copy TrxID"
                            >
                              {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">N/A (COD)</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 text-sm">
                        ৳{p.amount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800' :
                          isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-800 animate-pulse' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 dark:border dark:border-rose-800'
                        }`}>
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> :
                           isPending ? <Clock className="w-3 h-3" /> :
                           <XCircle className="w-3 h-3" />}
                          <span>{p.status}</span>
                        </span>
                        {p.failureReason && (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-xs">
                            Reason: {p.failureReason}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerify(p)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              title="Verify TrxID and confirm payment"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectPaymentItem(p);
                                setRejectReason('');
                              }}
                              className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              title="Reject with mandatory reason"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECT PAYMENT MODAL */}
      {rejectPaymentItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-slate-900 dark:text-slate-100 transition-colors">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Reject Payment</h3>
              </div>
              <button 
                onClick={() => setRejectPaymentItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Per audit compliance rules, rejecting a payment requires an explicit reason. This reason will be recorded in the official audit trail and attached to order <strong>#{rejectPaymentItem.orderId}</strong>.
            </p>

            <form onSubmit={handleReject} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g., TrxID BK90287162 not found in bKash merchant statement / amount mismatch"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectPaymentItem(null)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRejecting || !rejectReason.trim()}
                  className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
