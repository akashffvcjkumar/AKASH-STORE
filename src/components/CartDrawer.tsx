import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext.js';

export const CartDrawer: React.FC = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateCartQuantity, 
    cartSubtotal, 
    settings, 
    couponCode,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    setCheckoutModalOpen
  } = useStore();

  const [inputCoupon, setInputCoupon] = React.useState('');

  if (!isCartOpen) return null;

  const threshold = settings?.freeDeliveryThreshold || 2000;
  const progressToFreeDelivery = Math.min(100, Math.round((cartSubtotal / threshold) * 100));
  const remainingForFree = Math.max(0, threshold - cartSubtotal);

  const discount = appliedCoupon?.discount || 0;
  const estTotal = Math.max(0, cartSubtotal - discount);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Your Shopping Cart</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 text-xs">
          {remainingForFree > 0 ? (
            <div>
              <p className="text-emerald-800 font-medium mb-1">
                Add <strong className="font-bold">৳{remainingForFree.toLocaleString()}</strong> more for <strong>FREE Delivery</strong> across Bangladesh!
              </p>
              <div className="w-full h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressToFreeDelivery}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-emerald-800 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              You qualify for FREE Delivery across Bangladesh!
            </p>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShoppingBag className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Your cart is currently empty</p>
              <p className="text-xs text-slate-400 mt-1">Explore our genuine product catalog and add items.</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const price = item.variant ? item.variant.price : item.product.price;
              const img = item.product.images[0] || '';
              return (
                <div key={`${item.product.id}_${item.variant?.id || 'base'}_${idx}`} className="pt-3 first:pt-0 flex gap-3">
                  <img 
                    src={img} 
                    alt="" 
                    className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    {item.variant && (
                      <p className="text-[11px] text-slate-500 font-medium">
                        Option: {item.variant.name}
                      </p>
                    )}
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      ৳{price.toLocaleString()}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.variant?.id, item.quantity - 1)}
                          className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 text-xs font-bold text-slate-900 min-w-[1.5rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.variant?.id, item.quantity + 1)}
                          className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Coupon & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            {/* Promo Code Input */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coupon "{appliedCoupon.code}" applied (-৳{appliedCoupon.discount})</span>
                  </div>
                  <button onClick={removeCoupon} className="text-rose-600 font-bold hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Try AKASH10 or WELCOME200"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 uppercase"
                  />
                  <button
                    onClick={() => {
                      if (inputCoupon) applyCouponCode(inputCoupon);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">৳{cartSubtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold">-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-slate-500 italic">
                  {cartSubtotal >= threshold ? 'FREE' : 'Calculated at checkout'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Estimated Total</span>
                <span className="text-emerald-700 font-black">৳{estTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                setCheckoutModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
