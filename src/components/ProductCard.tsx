import React from 'react';
import { Heart, ShoppingBag, Eye, Star, AlertCircle } from 'lucide-react';
import { Product } from '../types.js';
import { useStore } from '../context/StoreContext.js';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useStore();

  const isLiked = isInWishlist(product.id);
  const discountPercent = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;
  const isOutOfStock = product.stock <= 0 || product.status === 'OUT_OF_STOCK';

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col h-full">
      {/* Image & Badges */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <img 
          src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white tracking-wide shadow-2xs">
              -{discountPercent}%
            </span>
          )}
          {isLowStock && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-2xs">
              <AlertCircle className="w-3 h-3" /> Only {product.stock} left
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-200">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-xs transition-colors z-10 ${
            isLiked ? 'bg-rose-50 text-rose-600' : 'bg-white/90 text-slate-600 hover:text-rose-600 hover:bg-white'
          }`}
          title={isLiked ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600' : ''}`} />
        </button>

        {/* Quick View Overlay on hover */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => onQuickView(product)}
            className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-semibold shadow-md flex items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-700" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
              {product.category}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">{product.brand}</span>
          </div>

          <h3 
            onClick={() => onQuickView(product)}
            className="text-sm font-semibold text-slate-900 line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors mb-1.5 leading-snug"
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2.5">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold ml-1 text-slate-800">{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-400 text-[11px]">({product.reviewCount})</span>
          </div>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-slate-100 mt-2">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-black text-slate-900">
              ৳{product.price.toLocaleString()}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ৳{product.compareAtPrice.toLocaleString()}
              </span>
            )}
          </div>

          <button
            disabled={isOutOfStock}
            onClick={() => {
              if (product.variants && product.variants.length > 0) {
                // If product has variants, open Quick View so customer selects variant
                onQuickView(product);
              } else {
                addToCart(product);
              }
            }}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs hover:shadow-xs'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>
              {isOutOfStock 
                ? 'Out of Stock' 
                : (product.variants && product.variants.length > 0 ? 'Select Options' : 'Add to Cart')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
