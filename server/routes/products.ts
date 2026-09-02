import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticateStaff, AuthenticatedRequest, extractClientIp, requirePermission } from '../auth.js';
import { Product, ProductVariant } from '../../src/types.js';

const router = Router();

/**
 * Public: GET /api/products
 * Get active products for the storefront with filtering & sorting
 */
router.get('/', (req: Request, res: Response) => {
  const { category, search, brand, minPrice, maxPrice, sort } = req.query;
  let products = db.getProducts().filter(p => p.status === 'ACTIVE');

  if (category && typeof category === 'string' && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (brand && typeof brand === 'string') {
    products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q)
    );
  }

  if (minPrice) {
    products = products.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    products = products.filter(p => p.price <= Number(maxPrice));
  }

  // Sorting
  if (sort === 'price-asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    products.sort((a, b) => b.rating - a.rating);
  } else {
    // Newest
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(products);
});

/**
 * Public: GET /api/products/:slugOrId
 */
router.get('/:slugOrId', (req: Request, res: Response) => {
  const { slugOrId } = req.params;
  const product = db.getProducts().find(p => p.slug === slugOrId || p.id === slugOrId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  res.json(product);
});

/**
 * Protected: GET /api/admin/products/all
 * Staff product list (includes DRAFT, OUT_OF_STOCK, ARCHIVED)
 */
router.get('/admin/all', authenticateStaff, (req: AuthenticatedRequest, res: Response) => {
  const products = db.getProducts();
  res.json(products);
});

/**
 * Protected: POST /api/admin/products
 */
router.post('/admin', authenticateStaff, requirePermission('canManageProducts'), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const ip = extractClientIp(req);
  const data = req.body;

  if (!data.name || !data.price || !data.category) {
    return res.status(400).json({ error: 'Name, price, and category are required.' });
  }

  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const sku = data.sku || `AKS-${Date.now().toString().slice(-6)}`;

  const newProduct: Product = {
    id: `prod_${Date.now().toString(36)}`,
    name: data.name,
    slug,
    sku,
    category: data.category,
    brand: data.brand || 'AKASH STORE',
    shortDescription: data.shortDescription || '',
    description: data.description || '',
    price: Number(data.price),
    compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
    stock: Number(data.stock || 0),
    lowStockThreshold: Number(data.lowStockThreshold || 5),
    status: data.status || 'ACTIVE',
    images: data.images?.length ? data.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
    variants: data.variants || [],
    specifications: data.specifications || {},
    tags: data.tags || [],
    rating: 5.0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  };

  const products = db.getProducts();
  products.unshift(newProduct);
  db.setProducts(products);

  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'PRODUCT_CREATE',
    resource: 'Product',
    resourceId: newProduct.id,
    details: `${user.name} created new product "${newProduct.name}" (SKU: ${newProduct.sku}, Price: ৳${newProduct.price})`,
    ip,
    status: 'SUCCESS',
  });

  res.status(201).json(newProduct);
});

/**
 * Protected: PUT /api/admin/products/:id
 */
router.put('/admin/:id', authenticateStaff, requirePermission('canManageProducts'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const ip = extractClientIp(req);
  const data = req.body;

  const products = db.getProducts();
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const oldPrice = product.price;
  const oldStock = product.stock;

  Object.assign(product, {
    name: data.name ?? product.name,
    category: data.category ?? product.category,
    brand: data.brand ?? product.brand,
    shortDescription: data.shortDescription ?? product.shortDescription,
    description: data.description ?? product.description,
    price: data.price ? Number(data.price) : product.price,
    compareAtPrice: data.compareAtPrice !== undefined ? Number(data.compareAtPrice) : product.compareAtPrice,
    stock: data.stock !== undefined ? Number(data.stock) : product.stock,
    lowStockThreshold: data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : product.lowStockThreshold,
    status: data.status ?? product.status,
    images: data.images ?? product.images,
    variants: data.variants ?? product.variants,
    specifications: data.specifications ?? product.specifications,
    tags: data.tags ?? product.tags,
  });

  db.setProducts(products);

  let details = `${user.name} updated product "${product.name}".`;
  if (oldPrice !== product.price) {
    details += ` Price changed from ৳${oldPrice} to ৳${product.price}.`;
  }
  if (oldStock !== product.stock) {
    details += ` Stock adjusted from ${oldStock} to ${product.stock}.`;
  }

  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'PRODUCT_UPDATE',
    resource: 'Product',
    resourceId: product.id,
    details,
    ip,
    status: 'SUCCESS',
  });

  res.json(product);
});

/**
 * Protected: PATCH /api/admin/products/:id/stock
 * Quick stock adjustment (Inventory Manager or Admin)
 */
router.patch('/admin/:id/stock', authenticateStaff, requirePermission('canManageInventory'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { stock, variantId, reason } = req.body;
  const user = req.user!;
  const ip = extractClientIp(req);

  const products = db.getProducts();
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  let details = '';
  if (variantId) {
    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return res.status(404).json({ error: 'Variant not found.' });
    const oldVStock = variant.stock;
    variant.stock = Number(stock);
    product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    details = `${user.name} adjusted stock for variant "${variant.name}" of "${product.name}" from ${oldVStock} to ${stock}. Reason: ${reason || 'Manual count'}`;
  } else {
    const oldStock = product.stock;
    product.stock = Number(stock);
    if (product.stock === 0) product.status = 'OUT_OF_STOCK';
    else if (product.status === 'OUT_OF_STOCK') product.status = 'ACTIVE';
    details = `${user.name} adjusted total stock of "${product.name}" from ${oldStock} to ${stock}. Reason: ${reason || 'Manual count'}`;
  }

  db.setProducts(products);

  db.recordAuditLog({
    employeeId: user.id,
    employeeName: user.name,
    employeeEmail: user.email,
    role: user.role,
    action: 'INVENTORY_ADJUST',
    resource: 'Inventory',
    resourceId: product.id,
    details,
    ip,
    status: 'SUCCESS',
  });

  res.json(product);
});

export default router;
