import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, CreditCard, Truck, Save, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext.js';

export const SettingsManager: React.FC = () => {
  const { settings, refreshSettings, token, showToast, currentStaff } = useStore();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bkashNumber, setBkashNumber] = useState('');
  const [bkashEnabled, setBkashEnabled] = useState(true);
  const [nagadNumber, setNagadNumber] = useState('');
  const [nagadEnabled, setNagadEnabled] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);
  const [insideDhakaFee, setInsideDhakaFee] = useState(60);
  const [outsideDhakaFee, setOutsideDhakaFee] = useState(120);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(2000);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || 'AKASH STORE');
      setOwnerName(settings.ownerName || 'Akash Chondror Roy');
      setHeadquarters(settings.headquarters || 'Sherpur, Bogura, Bangladesh');
      setContactEmail(settings.contactEmail || 'akashchondroroy@protonmail.com');
      setBkashNumber(settings.bkashNumber || '01874839665');
      setBkashEnabled(settings.bkashEnabled ?? true);
      setNagadNumber(settings.nagadNumber || '');
      setNagadEnabled(settings.nagadEnabled ?? false);
      setCodEnabled(settings.codEnabled ?? true);
      setInsideDhakaFee(settings.insideDhakaFee || 60);
      setOutsideDhakaFee(settings.outsideDhakaFee || 120);
      setFreeDeliveryThreshold(settings.freeDeliveryThreshold || 2000);
    }
  }, [settings]);

  if (currentStaff?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Restricted Access</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Store and payment configuration is only accessible to <strong>SUPER_ADMIN</strong>.
        </p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeName,
          ownerName,
          headquarters,
          contactEmail,
          bkashNumber,
          bkashEnabled,
          nagadNumber,
          nagadEnabled,
          codEnabled,
          insideDhakaFee,
          outsideDhakaFee,
          freeDeliveryThreshold,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to save settings', 'error');
        return;
      }

      showToast('Store & payment settings updated successfully.');
      refreshSettings();
    } catch {
      showToast('Network error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">Store, bKash Payment & Logistics Configuration</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Centralized settings for headquarters, official bKash receiving number, Nagad channel, and Bangladesh delivery fees.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Store & Entity Information */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Identity & Headquarters
            </h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Store Brand Name</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Founder / Owner</label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Headquarters Location</label>
            <input
              type="text"
              required
              value={headquarters}
              onChange={(e) => setHeadquarters(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Official Contact Email</label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Section 2: Payment Gateways */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CreditCard className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              bKash & Payment Settings
            </h4>
          </div>

          <div className="p-3 bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-900 dark:text-pink-300">Official bKash Receiving Number</label>
              <input
                type="checkbox"
                checked={bkashEnabled}
                onChange={(e) => setBkashEnabled(e.target.checked)}
                className="rounded text-pink-600 focus:ring-pink-500"
              />
            </div>
            <input
              type="text"
              required
              value={bkashNumber}
              onChange={(e) => setBkashNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-pink-300 dark:border-pink-800 rounded-lg focus:outline-none font-mono font-bold text-slate-900 dark:text-pink-300"
            />
            <span className="text-[10px] text-pink-700 dark:text-pink-400 block">
              Default: 01874839665. Displayed with a "Copy" button during customer checkout.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nagad Receiving Number</label>
              <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={nagadEnabled}
                  onChange={(e) => setNagadEnabled(e.target.checked)}
                  className="rounded text-orange-600"
                />
                <span>Enable Nagad</span>
              </label>
            </div>
            <input
              type="text"
              placeholder="e.g., 017XXXXXXXX"
              value={nagadNumber}
              onChange={(e) => setNagadNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none font-mono"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Allow Cash on Delivery (COD) across Bangladesh</span>
            </label>
          </div>
        </div>

        {/* Section 3: Delivery Fees & Thresholds */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 md:col-span-2 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Nationwide Delivery & Free Shipping Rules
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inside Dhaka City Fee (৳)
              </label>
              <input
                type="number"
                value={insideDhakaFee}
                onChange={(e) => setInsideDhakaFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Default: ৳60</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Outside Dhaka Fee (৳)
              </label>
              <input
                type="number"
                value={outsideDhakaFee}
                onChange={(e) => setOutsideDhakaFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none font-bold"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Default: ৳120</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Free Delivery Threshold (৳)
              </label>
              <input
                type="number"
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none font-bold text-emerald-700 dark:text-emerald-400"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Orders above this get free delivery (Default: ৳2,000)</span>
            </div>
          </div>
        </div>

      </div>
    </form>
  );
};
