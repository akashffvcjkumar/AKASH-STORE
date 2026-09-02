import fs from 'fs';
import path from 'path';
import { 
  EmployeeUser, 
  SessionRecord, 
  AuditLogRecord, 
  Product, 
  OrderRecord, 
  PaymentRecord, 
  CouponRecord, 
  StoreSettings 
} from '../src/types.js';
import { hashPassword, generateOrderId } from './crypto.js';

interface DatabaseSchema {
  users: EmployeeUser[];
  sessions: SessionRecord[];
  auditLogs: AuditLogRecord[];
  products: Product[];
  orders: OrderRecord[];
  payments: PaymentRecord[];
  coupons: CouponRecord[];
  settings: StoreSettings;
  orderSequence: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store_db.json');

function getInitialData(): DatabaseSchema {
  // Hash default passwords safely at startup
  const ownerAuth = hashPassword('AkashOwner@2026');
  const rahimAuth = hashPassword('RahimStaff@2026');
  const tanvirAuth = hashPassword('TanvirStaff@2026');
  const nusratAuth = hashPassword('NusratStaff@2026');
  const farukAuth = hashPassword('FarukAdmin@2026');

  const users: EmployeeUser[] = [
    {
      id: 'usr_owner_001',
      name: 'Akash Chondror Roy',
      email: 'akashchondroroy@protonmail.com',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: ownerAuth.hash,
      salt: ownerAuth.salt,
      mustChangePassword: false,
      lastLoginAt: new Date().toISOString(),
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_emp_005',
      name: 'Faruk Hasan',
      email: 'faruk@akashstore.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: farukAuth.hash,
      salt: farukAuth.salt,
      mustChangePassword: false,
      lastLoginAt: '2026-09-01T17:10:00.000Z',
      createdAt: '2026-01-20T12:00:00.000Z',
      updatedAt: '2026-01-20T12:00:00.000Z',
    },
    {
      id: 'usr_emp_002',
      name: 'Rahim Ahmed',
      email: 'rahim@akashstore.com',
      role: 'MANAGER',
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: rahimAuth.hash,
      salt: rahimAuth.salt,
      mustChangePassword: false,
      lastLoginAt: '2026-09-01T14:20:00.000Z',
      createdAt: '2026-02-15T09:30:00.000Z',
      updatedAt: '2026-02-15T09:30:00.000Z',
    },
    {
      id: 'usr_emp_004',
      name: 'Nusrat Jahan',
      email: 'nusrat@akashstore.com',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: nusratAuth.hash,
      salt: nusratAuth.salt,
      mustChangePassword: false,
      lastLoginAt: '2026-09-02T09:45:00.000Z',
      createdAt: '2026-04-01T10:00:00.000Z',
      updatedAt: '2026-04-01T10:00:00.000Z',
    },
    {
      id: 'usr_emp_003',
      name: 'Tanvir Hossain',
      email: 'tanvir@akashstore.com',
      role: 'INVENTORY_MANAGER',
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: tanvirAuth.hash,
      salt: tanvirAuth.salt,
      mustChangePassword: false,
      lastLoginAt: '2026-09-02T08:15:00.000Z',
      createdAt: '2026-03-10T11:00:00.000Z',
      updatedAt: '2026-03-10T11:00:00.000Z',
    },
    // Seeded Regular Customer (Default role: CUSTOMER, Google Authenticated)
    {
      id: 'usr_cust_001',
      name: 'Hanter Pro (Customer)',
      email: 'hanterpro899@gmail.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      authProvider: 'GOOGLE',
      googleId: 'google_108273917492817291823',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
      lastLoginAt: '2026-09-02T10:30:00.000Z',
      createdAt: '2026-08-01T08:00:00.000Z',
      updatedAt: '2026-09-02T10:30:00.000Z',
    },
  ];

  const settings: StoreSettings = {
    storeName: 'AKASH STORE',
    ownerName: 'Akash Chondror Roy',
    headquarters: 'Sherpur, Bogura, Bangladesh',
    contactEmail: 'akashchondroroy@protonmail.com',
    supportPhoneDisplay: 'Available via Support Agent',
    currency: 'BDT',
    currencySymbol: '৳',
    bkashNumber: '01874839665',
    bkashEnabled: true,
    nagadNumber: '', // Configurable in admin; disabled until configured
    nagadEnabled: false,
    codEnabled: true,
    codRequiresConfirmation: true,
    insideDhakaFee: 60,
    outsideDhakaFee: 120,
    freeDeliveryThreshold: 2000,
  };

  const products: Product[] = [
    {
      id: 'prod_001',
      name: 'Samsung Galaxy A55 5G (8GB/256GB)',
      slug: 'samsung-galaxy-a55-5g',
      sku: 'AKS-SAM-A55-01',
      category: 'Electronics',
      brand: 'Samsung',
      shortDescription: 'Super AMOLED 120Hz display, 50MP OIS camera, 5000mAh battery with official Bangladesh warranty.',
      description: 'The Samsung Galaxy A55 5G brings metal frame premium design, Knox Vault security, and IP67 dust/water resistance. Perfect for high-speed multitasking and mobile photography.',
      price: 46999,
      compareAtPrice: 49999,
      stock: 14,
      lowStockThreshold: 5,
      status: 'ACTIVE',
      images: [
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      ],
      variants: [
        { id: 'v_a55_awesome_iceblue', name: 'Awesome Iceblue / 8GB + 256GB', sku: 'AKS-SAM-A55-BLU', price: 46999, stock: 8, attributes: { color: 'Iceblue', storage: '256GB' } },
        { id: 'v_a55_awesome_navy', name: 'Awesome Navy / 8GB + 256GB', sku: 'AKS-SAM-A55-NVY', price: 46999, stock: 6, attributes: { color: 'Navy', storage: '256GB' } },
      ],
      specifications: {
        Display: '6.6" FHD+ Super AMOLED 120Hz',
        Processor: 'Exynos 1480 (4nm)',
        RearCamera: '50MP (OIS) + 12MP Ultra-Wide + 5MP Macro',
        FrontCamera: '32MP',
        Battery: '5000mAh (25W Fast Charging)',
        Warranty: '1 Year Official Warranty',
      },
      tags: ['smartphone', 'samsung', '5g', 'electronics'],
      rating: 4.8,
      reviewCount: 38,
      createdAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'prod_002',
      name: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
      slug: 'sony-wh-1000xm5-headphones',
      sku: 'AKS-SNY-XM5-02',
      category: 'Gadgets',
      brand: 'Sony',
      shortDescription: 'Industry-leading noise cancellation with two processors and 8 microphones for unparalleled calls and music.',
      description: 'Engineered to perfection with Auto NC Optimizer, lightweight design with soft fit leather, and up to 30 hours of continuous battery life.',
      price: 36500,
      compareAtPrice: 38990,
      stock: 9,
      lowStockThreshold: 3,
      status: 'ACTIVE',
      images: [
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      ],
      variants: [
        { id: 'v_xm5_black', name: 'Matte Black', sku: 'AKS-SNY-XM5-BLK', price: 36500, stock: 5, attributes: { color: 'Black' } },
        { id: 'v_xm5_silver', name: 'Platinum Silver', sku: 'AKS-SNY-XM5-SLV', price: 36500, stock: 4, attributes: { color: 'Silver' } },
      ],
      specifications: {
        BatteryLife: 'Up to 30 Hours (NC On)',
        DriverUnit: '30mm Carbon Fiber',
        Microphones: '8 Microphones beamforming',
        Connectivity: 'Bluetooth 5.2, LDAC, Multipoint',
        Weight: '250g',
      },
      tags: ['headphones', 'audio', 'sony', 'wireless', 'gadgets'],
      rating: 4.9,
      reviewCount: 52,
      createdAt: '2026-02-18T14:00:00.000Z',
    },
    {
      id: 'prod_003',
      name: 'Men\'s Premium Washed Cotton Slim Fit Casual Shirt',
      slug: 'mens-premium-washed-cotton-shirt',
      sku: 'AKS-FSH-SHIRT-03',
      category: 'Fashion',
      brand: 'Akash Heritage',
      shortDescription: '100% combed breathable cotton with tailored button-down collar and durable stitching.',
      description: 'Crafted from premium long-staple cotton for year-round comfort in Bangladesh climate. Pre-shrunk and enzyme washed for ultra-soft hand feel.',
      price: 1850,
      compareAtPrice: 2200,
      stock: 45,
      lowStockThreshold: 10,
      status: 'ACTIVE',
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
      ],
      variants: [
        { id: 'v_shirt_olive_m', name: 'Olive Green / Medium', sku: 'AKS-SHIRT-OLV-M', price: 1850, stock: 12, attributes: { color: 'Olive', size: 'M' } },
        { id: 'v_shirt_olive_l', name: 'Olive Green / Large', sku: 'AKS-SHIRT-OLV-L', price: 1850, stock: 15, attributes: { color: 'Olive', size: 'L' } },
        { id: 'v_shirt_navy_m', name: 'Classic Navy / Medium', sku: 'AKS-SHIRT-NVY-M', price: 1850, stock: 10, attributes: { color: 'Navy', size: 'M' } },
        { id: 'v_shirt_navy_l', name: 'Classic Navy / Large', sku: 'AKS-SHIRT-NVY-L', price: 1850, stock: 8, attributes: { color: 'Navy', size: 'L' } },
      ],
      specifications: {
        Material: '100% Combed Cotton',
        Pattern: 'Solid Enzyme Washed',
        Collar: 'Spread Button-Down',
        Care: 'Machine Wash Cold, Hang Dry',
      },
      tags: ['fashion', 'men', 'shirt', 'clothing'],
      rating: 4.7,
      reviewCount: 26,
      createdAt: '2026-03-12T11:00:00.000Z',
    },
    {
      id: 'prod_004',
      name: 'Anker 737 Power Bank (PowerCore 24K, 140W)',
      slug: 'anker-737-power-bank-140w',
      sku: 'AKS-ANK-737-04',
      category: 'Gadgets',
      brand: 'Anker',
      shortDescription: 'Ultra-powerful 140W two-way fast charging with smart digital smart display and 24,000mAh capacity.',
      description: 'Charge your laptop, tablet, and smartphone simultaneously at lightning speed. Equipped with PowerIQ 4.0 technology and ActiveShield 2.0 real-time temperature protection.',
      price: 13500,
      compareAtPrice: 14990,
      stock: 18,
      lowStockThreshold: 4,
      status: 'ACTIVE',
      images: [
        'https://images.unsplash.com/photo-1609592424328-98e38d7c2a71?w=800&q=80',
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
      ],
      variants: [
        { id: 'v_anker737_default', name: 'Space Gray 24,000mAh', sku: 'AKS-ANK-737-GRY', price: 13500, stock: 18, attributes: { color: 'Space Gray' } },
      ],
      specifications: {
        Capacity: '24,000mAh',
        TotalOutput: '140W Max',
        Ports: '2x USB-C + 1x USB-A',
        Display: 'Smart Digital Color Display',
        Warranty: '18 Months Warranty',
      },
      tags: ['gadgets', 'powerbank', 'fast-charging', 'anker'],
      rating: 4.9,
      reviewCount: 41,
      createdAt: '2026-02-25T15:00:00.000Z',
    },
    {
      id: 'prod_005',
      name: 'Authentic Pure Sundarban Honey (500g Jar)',
      slug: 'sundarban-raw-wild-honey-500g',
      sku: 'AKS-GRO-HONEY-05',
      category: 'Grocery',
      brand: 'Bengal Pure',
      shortDescription: '100% natural unfiltered raw wild honey sustainably harvested from deep mangrove forests of Sundarban.',
      description: 'Raw, unpasteurized, and rich in natural enzymes, antioxidants, and trace minerals. Directly collected from local traditional Mouwals in the Sundarbans.',
      price: 850,
      compareAtPrice: 950,
      stock: 60,
      lowStockThreshold: 15,
      status: 'ACTIVE',
      images: [
        'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
        'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80',
      ],
      variants: [
        { id: 'v_honey_500g', name: '500g Glass Jar', sku: 'AKS-HNY-500G', price: 850, stock: 35, attributes: { weight: '500g' } },
        { id: 'v_honey_1000g', name: '1kg Glass Jar', sku: 'AKS-HNY-1000G', price: 1600, stock: 25, attributes: { weight: '1kg' } },
      ],
      specifications: {
        Origin: 'Sundarban Mangrove Forest, Bangladesh',
        Type: 'Raw Multi-Flora Wild Honey',
        Packaging: 'Food-Grade Air Tight Glass Jar',
        ShelfLife: '24 Months',
      },
      tags: ['grocery', 'organic', 'honey', 'bangladesh'],
      rating: 4.9,
      reviewCount: 88,
      createdAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: 'prod_006',
      name: 'CeraVe Moisturizing Cream with Ceramides (454g)',
      slug: 'cerave-moisturizing-cream-454g',
      sku: 'AKS-BTY-CRV-06',
      category: 'Beauty',
      brand: 'CeraVe',
      shortDescription: 'Essential 3 ceramides and hyaluronic acid for barrier-restoring, 24-hour hydration.',
      description: 'Developed with dermatologists, this non-comedogenic, fragrance-free formula uses MVE Delivery Technology for continuous hydration on dry to very dry skin.',
      price: 2450,
      compareAtPrice: 2800,
      stock: 22,
      lowStockThreshold: 6,
      status: 'ACTIVE',
      images: [
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
        'https://images.unsplash.com/photo-1608248597359-54859a85bc1f?w=800&q=80',
      ],
      variants: [
        { id: 'v_crv_454g', name: '454g Tub with Pump', sku: 'AKS-CRV-454G', price: 2450, stock: 22, attributes: { size: '454g' } },
      ],
      specifications: {
        SkinType: 'Dry to Very Dry Skin',
        KeyIngredients: 'Ceramides 1, 3, 6-II, Hyaluronic Acid',
        Formulation: 'Fragrance-Free Cream',
        CountryOfOrigin: 'USA',
      },
      tags: ['beauty', 'skincare', 'cerave', 'moisturizer'],
      rating: 4.8,
      reviewCount: 64,
      createdAt: '2026-02-10T13:00:00.000Z',
    },
  ];

  const coupons: CouponRecord[] = [
    {
      code: 'AKASH10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 1000,
      maxDiscount: 500,
      usageCount: 14,
      usageLimit: 500,
      expiryDate: '2026-12-31T23:59:59.000Z',
      isActive: true,
    },
    {
      code: 'WELCOME200',
      discountType: 'FIXED',
      discountValue: 200,
      minOrderAmount: 1500,
      usageCount: 22,
      usageLimit: 300,
      expiryDate: '2026-12-31T23:59:59.000Z',
      isActive: true,
    },
  ];

  const orderId1 = generateOrderId(101);
  const paymentId1 = 'pay_bkash_101';

  const orders: OrderRecord[] = [
    {
      id: orderId1,
      customer: {
        fullName: 'Mahmudul Hasan',
        phone: '01712345678',
        email: 'mahmudul@gmail.com',
        division: 'Rajshahi',
        district: 'Bogura',
        upazila: 'Sherpur',
        areaAddress: 'Station Road, Ward 4',
        postalCode: '5840',
      },
      items: [
        {
          productId: 'prod_003',
          variantId: 'v_shirt_olive_m',
          productName: "Men's Premium Washed Cotton Slim Fit Casual Shirt",
          variantName: 'Olive Green / Medium',
          sku: 'AKS-SHIRT-OLV-M',
          image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80',
          price: 1850,
          quantity: 1,
          total: 1850,
        },
      ],
      subtotal: 1850,
      deliveryFee: 120,
      discount: 0,
      total: 1970,
      currency: 'BDT',
      status: 'CONFIRMED',
      paymentMethod: 'BKASH',
      paymentStatus: 'PAID',
      paymentId: paymentId1,
      timeline: [
        { status: 'PENDING', timestamp: '2026-09-02T08:00:00.000Z', note: 'Order created by customer' },
        { status: 'PAYMENT_VERIFICATION', timestamp: '2026-09-02T08:05:00.000Z', note: 'Customer submitted bKash TrxID BK90287162' },
        { status: 'CONFIRMED', timestamp: '2026-09-02T08:30:00.000Z', note: 'Payment verified by Faruk Hasan (ADMIN)', updatedBy: 'usr_emp_005' },
      ],
      createdAt: '2026-09-02T08:00:00.000Z',
      updatedAt: '2026-09-02T08:30:00.000Z',
    },
    {
      id: generateOrderId(102),
      customer: {
        fullName: 'Sadia Sultana',
        phone: '01898765432',
        email: 'sadia.sultana@outlook.com',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Mirpur',
        areaAddress: 'Section 10, Block C, House 24',
        postalCode: '1216',
      },
      items: [
        {
          productId: 'prod_005',
          variantId: 'v_honey_500g',
          productName: 'Authentic Pure Sundarban Honey (500g Jar)',
          variantName: '500g Glass Jar',
          sku: 'AKS-HNY-500G',
          image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
          price: 850,
          quantity: 2,
          total: 1700,
        },
      ],
      subtotal: 1700,
      deliveryFee: 60,
      discount: 170,
      total: 1590,
      currency: 'BDT',
      status: 'PAYMENT_VERIFICATION',
      paymentMethod: 'BKASH',
      paymentStatus: 'VERIFICATION_PENDING',
      paymentId: 'pay_bkash_102',
      timeline: [
        { status: 'PENDING', timestamp: '2026-09-02T10:10:00.000Z', note: 'Order created by customer' },
        { status: 'PAYMENT_VERIFICATION', timestamp: '2026-09-02T10:15:00.000Z', note: 'bKash TrxID submitted: 9H7B29XQ11' },
      ],
      createdAt: '2026-09-02T10:10:00.000Z',
      updatedAt: '2026-09-02T10:15:00.000Z',
    },
    {
      id: generateOrderId(103),
      customer: {
        fullName: 'Kazi Tanvir',
        phone: '01511223344',
        division: 'Chittagong',
        district: 'Chittagong',
        upazila: 'Panchlaish',
        areaAddress: 'GEC Circle, Green View Tower, Apt 4B',
      },
      items: [
        {
          productId: 'prod_004',
          variantId: 'v_anker737_default',
          productName: 'Anker 737 Power Bank (PowerCore 24K, 140W)',
          variantName: 'Space Gray 24,000mAh',
          sku: 'AKS-ANK-737-GRY',
          image: 'https://images.unsplash.com/photo-1609592424328-98e38d7c2a71?w=800&q=80',
          price: 13500,
          quantity: 1,
          total: 13500,
        },
      ],
      subtotal: 13500,
      deliveryFee: 0, // Free shipping exceeded threshold
      discount: 0,
      total: 13500,
      currency: 'BDT',
      status: 'PROCESSING',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      paymentId: 'pay_cod_103',
      timeline: [
        { status: 'PENDING', timestamp: '2026-09-01T16:00:00.000Z', note: 'Cash on Delivery order created' },
        { status: 'CONFIRMED', timestamp: '2026-09-01T16:30:00.000Z', note: 'Customer phoned & order confirmed by Rahim Ahmed (ORDER_MANAGER)', updatedBy: 'usr_emp_002' },
        { status: 'PROCESSING', timestamp: '2026-09-02T09:00:00.000Z', note: 'Dispatched to packaging department', updatedBy: 'usr_emp_002' },
      ],
      createdAt: '2026-09-01T16:00:00.000Z',
      updatedAt: '2026-09-02T09:00:00.000Z',
    }
  ];

  const payments: PaymentRecord[] = [
    {
      id: paymentId1,
      orderId: orderId1,
      method: 'BKASH',
      status: 'PAID',
      verificationStatus: 'VERIFIED',
      amount: 1970,
      currency: 'BDT',
      senderPhone: '01712345678',
      receiverPhone: '01874839665',
      transactionId: 'BK90287162',
      verifiedAt: '2026-09-02T08:30:00.000Z',
      verifiedBy: 'usr_emp_005',
      createdAt: '2026-09-02T08:05:00.000Z',
      updatedAt: '2026-09-02T08:30:00.000Z',
    },
    {
      id: 'pay_bkash_102',
      orderId: generateOrderId(102),
      method: 'BKASH',
      status: 'VERIFICATION_PENDING',
      verificationStatus: 'PENDING',
      amount: 1590,
      currency: 'BDT',
      senderPhone: '01898765432',
      receiverPhone: '01874839665',
      transactionId: '9H7B29XQ11',
      createdAt: '2026-09-02T10:15:00.000Z',
      updatedAt: '2026-09-02T10:15:00.000Z',
    },
    {
      id: 'pay_cod_103',
      orderId: generateOrderId(103),
      method: 'COD',
      status: 'UNPAID',
      verificationStatus: 'NONE',
      amount: 13500,
      currency: 'BDT',
      createdAt: '2026-09-01T16:00:00.000Z',
      updatedAt: '2026-09-01T16:00:00.000Z',
    },
  ];

  const auditLogs: AuditLogRecord[] = [
    {
      id: 'aud_001',
      employeeId: 'usr_emp_005',
      employeeName: 'Faruk Hasan',
      employeeEmail: 'faruk@akashstore.com',
      role: 'ADMIN',
      action: 'PAYMENT_VERIFY',
      resource: 'Payment',
      resourceId: paymentId1,
      details: `Verified bKash payment for order #${orderId1} (TrxID: BK90287162, Amount: ৳1,970)`,
      ip: '103.145.118.22',
      status: 'SUCCESS',
      timestamp: '2026-09-02T08:30:00.000Z',
    },
    {
      id: 'aud_002',
      employeeId: 'usr_emp_002',
      employeeName: 'Rahim Ahmed',
      employeeEmail: 'rahim@akashstore.com',
      role: 'ORDER_MANAGER',
      action: 'ORDER_STATUS_CHANGE',
      resource: 'Order',
      resourceId: generateOrderId(103),
      details: 'Rahim changed order #AKS-20260901-000103 from Confirmed to Processing.',
      ip: '103.145.118.22',
      status: 'SUCCESS',
      timestamp: '2026-09-02T09:00:00.000Z',
    },
    {
      id: 'aud_003',
      employeeId: 'usr_owner_001',
      employeeName: 'Akash Chondror Roy',
      employeeEmail: 'akashchondroroy@protonmail.com',
      role: 'SUPER_ADMIN',
      action: 'EMPLOYEE_CREATE',
      resource: 'Staff',
      resourceId: 'usr_emp_004',
      details: 'Super Admin created employee account for Nusrat Jahan (SUPPORT_AGENT)',
      ip: '103.145.118.1',
      status: 'SUCCESS',
      timestamp: '2026-04-01T10:00:00.000Z',
    },
  ];

  return {
    users,
    sessions: [],
    auditLogs,
    products,
    orders,
    payments,
    coupons,
    settings,
    orderSequence: 104,
  };
}

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...getInitialData(),
          ...parsed,
          // ensure initial users exist if missing
          users: parsed.users?.length ? parsed.users : getInitialData().users,
          settings: { ...getInitialData().settings, ...(parsed.settings || {}) },
        };
      }
    } catch (e) {
      console.error('Error loading DB file, fallback to initial data', e);
    }
    const initial = getInitialData();
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB file', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  // Getters
  public getUsers() { return this.data.users; }
  public getSessions() { return this.data.sessions; }
  public getAuditLogs() { return this.data.auditLogs; }
  public getProducts() { return this.data.products; }
  public getOrders() { return this.data.orders; }
  public getPayments() { return this.data.payments; }
  public getCoupons() { return this.data.coupons; }
  public getSettings() { return this.data.settings; }
  public nextOrderSequence() {
    const seq = this.data.orderSequence++;
    this.save();
    return seq;
  }

  // Mutators with auto-save
  public setUsers(users: EmployeeUser[]) { this.data.users = users; this.save(); }
  public setSessions(sessions: SessionRecord[]) { this.data.sessions = sessions; this.save(); }
  public setAuditLogs(logs: AuditLogRecord[]) { this.data.auditLogs = logs; this.save(); }
  public setProducts(products: Product[]) { this.data.products = products; this.save(); }
  public setOrders(orders: OrderRecord[]) { this.data.orders = orders; this.save(); }
  public setPayments(payments: PaymentRecord[]) { this.data.payments = payments; this.save(); }
  public setCoupons(coupons: CouponRecord[]) { this.data.coupons = coupons; this.save(); }
  public setSettings(settings: StoreSettings) { this.data.settings = settings; this.save(); }

  // Convenience methods
  public recordAuditLog(log: Omit<AuditLogRecord, 'id' | 'timestamp'>) {
    const newLog: AuditLogRecord = {
      ...log,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
    return newLog;
  }

  public revokeUserSessions(userId: string) {
    this.data.sessions = this.data.sessions.filter(s => s.userId !== userId);
    this.save();
  }

  /**
   * RBAC Security: Authenticate or register customer via Google OAuth.
   * Default role for all new sign-ups is STRICTLY 'CUSTOMER'.
   * Never grants staff roles or admin access.
   */
  public findOrCreateGoogleCustomer(params: {
    email: string;
    name: string;
    avatar?: string;
    googleId?: string;
  }): EmployeeUser {
    const emailClean = params.email.trim().toLowerCase();
    let user = this.data.users.find(u => u.email.toLowerCase() === emailClean);

    if (user) {
      // Existing user: Update Google metadata and last login
      user.lastLoginAt = new Date().toISOString();
      if (params.avatar) user.avatar = params.avatar;
      if (params.googleId) user.googleId = params.googleId;
      user.updatedAt = new Date().toISOString();
      this.save();
      return user;
    }

    // New User: Strictly enforce role = 'CUSTOMER'
    const newUser: EmployeeUser = {
      id: `usr_cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: params.name || 'Google Customer',
      email: emailClean,
      role: 'CUSTOMER', // STRICT DEFAULT FOR NEW SIGNUPS
      status: 'ACTIVE',
      authProvider: 'GOOGLE',
      googleId: params.googleId,
      avatar: params.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.name || 'Customer')}`,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  /**
   * RBAC Security: Register a manual customer.
   * Default role is STRICTLY 'CUSTOMER'.
   */
  public registerCustomer(params: {
    name: string;
    email: string;
    passwordHash?: string;
    salt?: string;
  }): EmployeeUser {
    const emailClean = params.email.trim().toLowerCase();
    const existing = this.data.users.find(u => u.email.toLowerCase() === emailClean);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: EmployeeUser = {
      id: `usr_cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: params.name,
      email: emailClean,
      role: 'CUSTOMER', // STRICT DEFAULT FOR NEW SIGNUPS
      status: 'ACTIVE',
      authProvider: 'LOCAL',
      passwordHash: params.passwordHash,
      salt: params.salt,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.save();
    return newUser;
  }
}

export const db = new DatabaseStore();
