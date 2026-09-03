import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  RefreshCw, 
  Eye, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  CreditCard, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useStore } from '../../context/StoreContext.js';
import { OrderRecord } from '../../types.js';

interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  authProvider: 'GOOGLE' | 'LOCAL';
  avatar?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string;
  createdAt: string;
}

export const CustomersManager: React.FC = () => {
  const { token, showToast, currentStaff, setAdminTab } = useStore();

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authFilter, setAuthFilter] = useState<'ALL' | 'GOOGLE' | 'LOCAL'>('ALL');

  // Selected customer details & full purchase history
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [customerOrders, setCustomerOrders] = useState<OrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [supportNote, setSupportNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchCustomers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      let url = '/api/admin/customers';
      if (searchQuery.trim()) {
        url += `?search=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to load customers list', 'error');
      }
    } catch {
      showToast('Network error loading customer accounts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token, searchQuery]);

  const handleOpenCustomer = async (cust: CustomerSummary) => {
    setSelectedCustomer(cust);
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(cust.email || cust.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerOrders(data.orders || []);
      } else {
        setCustomerOrders([]);
      }
    } catch {
      showToast('Failed to load purchase history', 'error');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleAddSupportNote = async (orderId: string) => {
    if (!supportNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: supportNote.trim() }),
      });
      if (res.ok) {
        showToast(`Support note appended to order #${orderId}.`);
        setSupportNote('');
        if (selectedCustomer) {
          handleOpenCustomer(selectedCustomer);
        }
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add note', 'error');
      }
    } catch {
      showToast('Error saving support note', 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (authFilter !== 'ALL' && c.authProvider !== authFilter) return false;
    return true;
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrdersAll = customers.reduce((sum, c) => sum + c.ordersCount, 0);
  const googleAccountsCount = customers.filter(c => c.authProvider === 'GOOGLE').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold">Customer Management & Support Intelligence</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Review registered buyers, Google OAuth authentication profiles, and complete purchase histories to deliver immediate customer service.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Customers
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {customers.length}
          </div>
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            <span>Shared Database verified</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Google OAuth Buyers
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {googleAccountsCount}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Customer Portal /login</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Orders Generated
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {totalOrdersAll}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Across active buyer accounts
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Lifetime Revenue
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{totalSpentAll.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Avg: ৳{customers.length > 0 ? Math.round(totalSpentAll / customers.length).toLocaleString() : 0} / customer
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'GOOGLE', 'LOCAL'] as const).map(provider => (
            <button
              key={provider}
              onClick={() => setAuthFilter(provider)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                authFilter === provider
                  ? 'bg-slate-900 dark:bg-cyan-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {provider === 'ALL' ? 'All Customers' : provider === 'GOOGLE' ? 'Google OAuth' : 'Standard / Guest'}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Authentication</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Orders Placed</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Last Order</th>
                <th className="py-3 px-4 text-right">Support Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-600" />
                    <span>Loading customer profiles from shared database...</span>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customer accounts matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr 
                    key={cust.id} 
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center font-bold text-cyan-800 dark:text-cyan-300 shrink-0 overflow-hidden">
                          {cust.avatar ? (
                            <img src={cust.avatar} alt={cust.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{cust.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{cust.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{cust.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {cust.authProvider === 'GOOGLE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <svg className="w-3 h-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                          <span>Google OAuth</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <span>Local / Guest</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {cust.phone ? (
                        <span className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cust.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No phone yet</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {cust.ordersCount} {cust.ordersCount === 1 ? 'order' : 'orders'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                        ৳{cust.totalSpent.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {cust.lastOrderAt ? (
                        <span>{new Date(cust.lastOrderAt).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-slate-400 italic">No orders</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenCustomer(cust)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/80 font-bold text-[11px] transition-colors cursor-pointer"
                        title="View full purchase history and details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Activity</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER DETAILS & PURCHASE HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col transition-colors">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center font-bold text-cyan-800 dark:text-cyan-300 overflow-hidden">
                  {selectedCustomer.avatar ? (
                    <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedCustomer.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedCustomer.name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{selectedCustomer.email}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Total Spend: ৳{selectedCustomer.totalSpent.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Profile Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Authentication</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.authProvider === 'GOOGLE' ? 'Google OAuth Verified' : 'Local / Guest Checkout'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedCustomer.phone || 'None provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Member Registered</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Purchase History Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-cyan-500" />
                    <span>Purchase History ({customerOrders.length} {customerOrders.length === 1 ? 'Order' : 'Orders'})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Shared database records
                  </span>
                </div>

                {isLoadingOrders ? (
                  <div className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-600" />
                    <span>Fetching orders from database...</span>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
                    No orders have been recorded for this customer yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerOrders.map(order => (
                      <div 
                        key={order.id} 
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 shadow-2xs space-y-3"
                      >
                        {/* Order Top Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              #{order.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                              order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {order.status}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-medium text-slate-600 dark:text-slate-300">
                              {order.paymentMethod}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 mr-2">
                              {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              ৳{order.total.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="py-1.5 flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{item.productName}</span>
                                {item.variantName && (
                                  <span className="text-slate-400 text-[10px]">({item.variantName})</span>
                                )}
                                <span className="text-slate-400">× {item.quantity}</span>
                              </div>
                              <span className="font-mono text-slate-700 dark:text-slate-300">৳{item.total.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Shipping address */}
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">Delivery Address: </span>
                            {order.customer.areaAddress}, {order.customer.district || ''}, {order.customer.division}
                          </div>
                        </div>

                        {/* Timeline snippet */}
                        {order.timeline && order.timeline.length > 0 && (
                          <div className="text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-700/60 pt-2 flex items-center justify-between">
                            <span className="italic">
                              Latest update: {order.timeline[order.timeline.length - 1].note}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedCustomer(null);
                                setAdminTab('orders');
                              }}
                              className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Manage in Orders</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Staff member: <strong className="text-slate-800 dark:text-slate-200">{currentStaff?.name}</strong>
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer transition-colors"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
