import React, { useState, useEffect } from 'react';
import { X, Star, ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Product, ProductVariant } from '../types.js';
import { useStore } from '../context/StoreContext.js';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart, toggleWishlist, isInWishlist, setCheckoutModalOpen } = useStore();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant(undefined);
    }
    setActiveImageIndex(0);
    setQuantity(1);
  }, [product]);

  if (!product) return null;

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;
  const isLiked = isInWishlist(product.id);
  const isOutOfStock = currentStock <= 0;

  const handleBuyNow = () => {
    addToCart(product, selectedVariant, quantity);
    onClose();
    setCheckoutModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
          
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square w-full rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
              <img 
                src={product.images[activeImageIndex] || product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Guarantees Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Genuine Official Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Express Bangladesh Delivery (Dhaka: ৳60 / Outside: ৳120)</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>7-Day Return Policy for defective items</span>
              </div>
            </div>
          </div>

          {/* Details & Action */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs mb-1.5">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wider text-[10px]">
                  {product.category}
                </span>
                <span className="text-slate-400 font-mono">SKU: {currentSku}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {product.name}
              </h2>

              <div className="flex items-center gap-3 my-2 text-xs">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold ml-1 text-slate-800">{product.rating.toFixed(1)}</span>
                  <span className="text-slate-400 ml-1">({product.reviewCount} customer reviews)</span>
                </div>
                <span>•</span>
                <span className="text-slate-500">Brand: <strong className="text-slate-800">{product.brand}</strong></span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 my-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  ৳{currentPrice.toLocaleString()}
                </span>
                {product.compareAtPrice && product.compareAtPrice > currentPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    ৳{product.compareAtPrice.toLocaleString()}
                  </span>
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  isOutOfStock ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isOutOfStock ? 'Out of Stock' : `In Stock (${currentStock} available)`}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed my-3">
                {product.description || product.shortDescription}
              </p>

              {/* Variant Selector */}
              {product.variants && product.variants.length > 0 && (
                <div className="my-4 space-y-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Select Option / Variant:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3 py-2 text-xs rounded-lg border font-medium transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {v.name} - ৳{v.price.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="my-3 pt-3 border-t border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-800 mb-2 uppercase tracking-wider text-[10px]">Specifications</h4>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-600">
                    {Object.entries(product.specifications).map(([k, v]) => (
                      <div key={k} className="bg-slate-50 p-1.5 rounded border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">{k}</span>
                        <span className="font-medium text-slate-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                  <button
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold text-slate-800 min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    disabled={quantity >= currentStock || isOutOfStock}
                    onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  disabled={isOutOfStock}
                  onClick={() => {
                    addToCart(product, selectedVariant, quantity);
                    onClose();
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                {/* Wishlist */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    isLiked ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-600' : ''}`} />
                </button>
              </div>

              {/* Direct Buy Now */}
              <button
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                Buy Now with Instant Checkout
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
