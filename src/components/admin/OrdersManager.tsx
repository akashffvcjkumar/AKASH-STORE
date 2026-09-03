import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  RefreshCw, 
  Eye, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  AlertCircle,
  RotateCcw,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { OrderRecord, OrderStatus } from '../../types.js';
import { useStore } from '../../context/StoreContext.js';

export const OrdersManager: React.FC = () => {
  const { token, showToast, currentStaff, refreshProducts } = useStore();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for viewing / updating
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PROCESSING');
  const [timelineNote, setTimelineNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Cancellation Modal State
  const [orderToCancel, setOrderToCancel] = useState<OrderRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');
  const [isCancelling, setIsCancelling] = useState(false);

  // Refund Modal State
  const [orderToRefund, setOrderToRefund] = useState<OrderRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Defective item / return approved');
  const [restockOnRefund, setRestockOnRefund] = useState(true);
  const [isRefunding, setIsRefunding] = useState(false);

  const fetchOrders = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      let url = `/api/orders?status=${statusFilter}`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to load orders', 'error');
      }
    } catch {
      showToast('Network error loading orders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token, statusFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          note: timelineNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to update order status', 'error');
        return;
      }

      showToast(`Order #${selectedOrder.id} status transitioned to ${newStatus}. Action logged.`);
      setSelectedOrder(data.order);
      setTimelineNote('');
      fetchOrders();
    } catch {
      showToast('Network error updating status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExecuteCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderToCancel.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to cancel order', 'error');
        return;
      }

      showToast(`Order #${orderToCancel.id} cancelled. Inventory stock restored to catalog.`);
      setOrderToCancel(null);
      if (selectedOrder?.id === orderToCancel.id) {
        setSelectedOrder(data.order);
      }
      fetchOrders();
      refreshProducts();
    } catch {
      showToast('Network error cancelling order', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExecuteRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToRefund) return;
    if (refundAmount <= 0) {
      showToast('Please enter a valid refund amount', 'error');
      return;
    }
    setIsRefunding(true);
    try {
      const res = await fetch(`/api/orders/${orderToRefund.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          amount: Number(refundAmount),
          reason: refundReason.trim(),
          restockItems: restockOnRefund
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to issue refund', 'error');
        return;
      }

      showToast(`Refund of ৳${refundAmount.toLocaleString()} processed for order #${orderToRefund.id}. Audit log recorded.`);
      setOrderToRefund(null);
      if (selectedOrder?.id === orderToRefund.id) {
        setSelectedOrder(data.order);
      }
      fetchOrders();
      if (restockOnRefund) {
        refreshProducts();
      }
    } catch {
      showToast('Network error issuing refund', 'error');
    } finally {
      setIsRefunding(false);
    }
  };

  const statusOptions: OrderStatus[] = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Orders & Nationwide Fulfillment Management</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Transition orders along the Bangladesh fulfillment timeline (Dhaka: ৳60 / Outside: ৳120). All status updates record the employee's name and email in the system audit logs.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order ID, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No orders found matching this query.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                      {o.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{o.customer.fullName}</div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{o.customer.phone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>{o.customer.district}, {o.customer.division}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{o.customer.upazila}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          o.paymentMethod === 'BKASH' ? 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 dark:border dark:border-pink-800' :
                          o.paymentMethod === 'NAGAD' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 dark:border dark:border-orange-800' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {o.paymentMethod}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          o.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-800'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-800' :
                        o.status === 'SHIPPED' || o.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 dark:border dark:border-blue-800' :
                        o.status === 'PROCESSING' || o.status === 'PACKED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-800' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        <span>{o.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 text-sm">
                      ৳{o.total.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setNewStatus(o.status);
                          setTimelineNote('');
                        }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 ml-auto shadow-2xs transition-colors cursor-pointer border border-transparent dark:border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS & STATUS TRANSITION MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Order Fulfillment: #{selectedOrder.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedOrder.status === 'DELIVERED' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:border dark:border-emerald-800' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:border dark:border-blue-800'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()} by {selectedOrder.customer.fullName}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* Customer & Shipping Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-300 block text-[10px] uppercase">Customer Information</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedOrder.customer.fullName}</p>
                  <p className="font-mono text-slate-600 dark:text-slate-400">{selectedOrder.customer.phone}</p>
                  {selectedOrder.customer.email && <p className="text-slate-500 dark:text-slate-400">{selectedOrder.customer.email}</p>}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-300 block text-[10px] uppercase">Shipping Address</span>
                  <p className="text-slate-800 dark:text-slate-200">{selectedOrder.customer.areaAddress}</p>
                  <p className="text-slate-600 dark:text-slate-400">{selectedOrder.customer.upazila}, {selectedOrder.customer.district}</p>
                  <p className="font-medium text-emerald-800 dark:text-emerald-400">{selectedOrder.customer.division} Division</p>
                </div>
              </div>

              {/* Items in order */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Ordered Products
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center bg-white dark:bg-slate-800/40">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{it.productName}</span>
                        {it.variantName && (
                          <span className="text-slate-500 dark:text-slate-400 ml-1">({it.variantName})</span>
                        )}
                        <span className="text-slate-400 dark:text-slate-500 ml-2">Qty: {it.quantity}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">৳{it.total.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 flex justify-between items-center font-bold text-sm">
                    <span className="text-slate-700 dark:text-slate-300">Total (Includes delivery ৳{selectedOrder.deliveryFee})</span>
                    <span className="text-emerald-700 dark:text-emerald-400">৳{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status transition form */}
              <form onSubmit={handleUpdateStatus} className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                  Update Fulfillment Stage (Logged by {currentStaff?.name})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Next Status Stage:
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    >
                      {statusOptions.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Internal / Tracking Note:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Handed to Steadfast / Paperfly courier with tracking #..."
                      value={timelineNote}
                      onChange={(e) => setTimelineNote(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Apply Status Update & Record Audit Log'}
                </button>
              </form>

              {/* Critical Order Actions: Cancel & Refund */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Critical Order Actions & Stock Management
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cancelling or refunding an order automatically restores item stock levels to the product inventory and logs the action under your staff account.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedOrder.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      onClick={() => setOrderToCancel(selectedOrder)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/70 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Order & Restock</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setOrderToRefund(selectedOrder);
                      setRefundAmount(selectedOrder.total);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Issue Refund (bKash / Nagad / Bank)</span>
                  </button>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Timeline History
                </h4>
                <div className="space-y-2 text-xs">
                  {selectedOrder.timeline.map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-lg flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded mr-2">
                          {t.status}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{t.note || 'Status updated'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                        {new Date(t.timestamp).toLocaleDateString()} {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL ORDER MODAL */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Cancel Order #{orderToCancel.id}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Restores items to inventory and logs cancellation.</p>
              </div>
            </div>

            <form onSubmit={handleExecuteCancel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cancellation Reason:
                </label>
                <textarea
                  rows={2}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                  placeholder="e.g. Customer unreachable / requested cancellation via phone"
                />
              </div>

              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                Notice: All items in this order will automatically be returned to available warehouse stock.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setOrderToCancel(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
                >
                  {isCancelling ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {orderToRefund && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 dark:border-amber-900/60 space-y-4 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/80 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Process Refund: #{orderToRefund.id}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Order total was ৳{orderToRefund.total.toLocaleString()}</p>
              </div>
            </div>

            <form onSubmit={handleExecuteRefund} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Refund Amount (৳) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={orderToRefund.total}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Refund Reason / Memo:
                </label>
                <textarea
                  rows={2}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
                  placeholder="e.g. Return received in warehouse, refunded via bKash to customer number"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="restockCheckbox"
                  checked={restockOnRefund}
                  onChange={(e) => setRestockOnRefund(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="restockCheckbox" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Restock refunded items back into catalog inventory
                </label>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isRefunding}
                  onClick={() => setOrderToRefund(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
                >
                  {isRefunding ? 'Recording...' : 'Authorize Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
