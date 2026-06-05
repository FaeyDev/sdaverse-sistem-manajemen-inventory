/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Category,
  Product,
  Variant,
  Batch,
  BatchStock,
  Warehouse,
  Supplier,
  StockMovement,
  Transfer,
  TransferItem,
  ReturnOrder,
  ReturnItem,
  PricingRule,
  SystemNotification,
  AuditLog
} from "./types";

// Seed Users
export const seedUsers: User[] = [
  {
    id: "u-1",
    username: "admin",
    email: "admin@beatty.co.id",
    fullname: "Agustinov Freeze",
    role: "Admin",
    passwordHash: "bcrypt_hashed_admin",
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "u-2",
    username: "staff_iqbal",
    email: "iqbal@beauty.co.id",
    fullname: "Muhammad Iqbal",
    role: "Warehouse Staff",
    passwordHash: "bcrypt_hashed_staff",
    createdAt: "2026-02-15T09:30:00Z"
  },
  {
    id: "u-3",
    username: "cashier_siti",
    email: "siti@beauty.co.id",
    fullname: "Siti Rahma",
    role: "Cashier",
    passwordHash: "bcrypt_hashed_cashier",
    createdAt: "2026-03-01T10:00:00Z"
  }
];

// Seed Categories
export const seedCategories: Category[] = [
  { id: "cat-1", name: "Skincare", parentId: null, description: "Perawatan kulit wajah dan tubuh" },
  { id: "cat-1-1", name: "Toner", parentId: "cat-1", description: "Penyegar hidrasi wajah" },
  { id: "cat-1-2", name: "Serum", parentId: "cat-1", description: "Konsentrat nutrisi aktif" },
  { id: "cat-1-3", name: "Sunscreen", parentId: "cat-1", description: "Tabir surya pelindung UV" },
  
  { id: "cat-2", name: "Makeup", parentId: null, description: "Kosmetik dekoratif kecantikan" },
  { id: "cat-2-1", name: "Lip Tint", parentId: "cat-2", description: "Pewarna bibir alami" },
  { id: "cat-2-2", name: "Cushion", parentId: "cat-2", description: "Alas bedak compact modern" },
  { id: "cat-2-3", name: "Blush On", parentId: "cat-2", description: "Pemerah pipi estetik" }
];

// Seed Products
export const seedProducts: Product[] = [
  {
    id: "p-1",
    name: "Cosrx BHA Blackhead Power Liquid",
    categoryId: "cat-1-1",
    brand: "Cosrx",
    description: "Cairan eksfoliasi untuk mengangkat komedo dan sel kulit mati.",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400",
    createdAt: "2026-01-20T11:00:00Z"
  },
  {
    id: "p-2",
    name: "Somethinc Niacinamide Sabi Beet Serum",
    categoryId: "cat-1-2",
    brand: "Somethinc",
    description: "Serum pencerah kulit kusam dan menyamarkan noda hitam.",
    image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=400",
    createdAt: "2026-02-10T12:00:00Z"
  },
  {
    id: "p-3",
    name: "Romand Juicy Lasting Tint",
    categoryId: "cat-2-1",
    brand: "Romand",
    description: "Lip tint bertekstur juicy dengan warna yang tahan sepanjang hari.",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400",
    createdAt: "2026-03-05T14:30:00Z"
  },
  {
    id: "p-4",
    name: "ESQA Flawless Cushion",
    categoryId: "cat-2-2",
    brand: "ESQA",
    description: "Cushion full-coverage dengan hasil akhir satin alami yang flawless.",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400",
    createdAt: "2026-03-12T15:00:00Z"
  }
];

// Seed Variants
export const seedVariants: Variant[] = [
  // COSRX Liquid
  {
    id: "v-1",
    productId: "p-1",
    sku: "SKU-COSRX-BHA100",
    barcode: "8809481900125",
    name: "100ml Standard",
    size: "100ml",
    retailPrice: 245000,
    resellerPrice: 220000,
    wholesalePrice: 195000,
    supplierPrice: 140000,
    minStockThreshold: 15
  },
  {
    id: "v-2",
    productId: "p-1",
    sku: "SKU-COSRX-BHA50",
    barcode: "8809481900132",
    name: "50ml Travel Size",
    size: "50ml",
    retailPrice: 135000,
    resellerPrice: 120000,
    wholesalePrice: 105000,
    supplierPrice: 75000,
    minStockThreshold: 10
  },
  // Somethinc Serum
  {
    id: "v-3",
    productId: "p-2",
    sku: "SKU-SMT-NIAC20",
    barcode: "8997232230045",
    name: "20ml Regular",
    size: "20ml",
    retailPrice: 129000,
    resellerPrice: 115000,
    wholesalePrice: 100000,
    supplierPrice: 68000,
    minStockThreshold: 20
  },
  {
    id: "v-4",
    productId: "p-2",
    sku: "SKU-SMT-NIAC40",
    barcode: "8997232230052",
    name: "40ml Jumbo Pack",
    size: "40ml",
    retailPrice: 210000,
    resellerPrice: 190000,
    wholesalePrice: 165000,
    supplierPrice: 115000,
    minStockThreshold: 12
  },
  // Romand Juicy Tint
  {
    id: "v-5",
    productId: "p-3",
    sku: "SKU-RMD-JLT06",
    barcode: "8809625241031",
    name: "Shade 06 Figfig",
    size: "5.5g",
    shade: "Shade 06 Figfig",
    retailPrice: 145000,
    resellerPrice: 130000,
    wholesalePrice: 115000,
    supplierPrice: 80000,
    minStockThreshold: 25
  },
  {
    id: "v-6",
    productId: "p-3",
    sku: "SKU-RMD-JLT07",
    barcode: "8809625241048",
    name: "Shade 07 Jujube",
    size: "5.5g",
    shade: "Shade 07 Jujube",
    retailPrice: 145000,
    resellerPrice: 130000,
    wholesalePrice: 115000,
    supplierPrice: 80000,
    minStockThreshold: 25
  },
  // ESQA Cushion
  {
    id: "v-7",
    productId: "p-4",
    sku: "SKU-ESQ-CUSH01",
    barcode: "8997219800230",
    name: "Shade Milkshake",
    size: "15g",
    shade: "Milkshake",
    retailPrice: 185000,
    resellerPrice: 165000,
    wholesalePrice: 145000,
    supplierPrice: 95000,
    minStockThreshold: 15
  },
  {
    id: "v-8",
    productId: "p-4",
    sku: "SKU-ESQ-CUSH02",
    barcode: "8997219800247",
    name: "Shade Vanilla",
    size: "15g",
    shade: "Vanilla",
    retailPrice: 185000,
    resellerPrice: 165000,
    wholesalePrice: 145000,
    supplierPrice: 95000,
    minStockThreshold: 15
  }
];

// Seed Warehouses
export const seedWarehouses: Warehouse[] = [
  { id: "wh-1", name: "Gudang Utama Jakarta", location: "Kuningan, Jakarta Selatan", code: "JKT-UTAMA" },
  { id: "wh-2", name: "Cabang Surabaya Hub", location: "Rungkut, Surabaya", code: "SBY-HUB" },
  { id: "wh-3", name: "Hub Rusak & Retur", location: "Cakung, Jakarta Timur", code: "BAD-STOK" }
];

// Seed Batches
export const seedBatches: Batch[] = [
  {
    id: "b-1",
    batchNumber: "BCH-COSRX-2026A",
    expiryDate: "2026-08-15", // In ~2 months (Near Expiry!)
    productionDate: "2024-08-15",
    isLocked: false
  },
  {
    id: "b-2",
    batchNumber: "BCH-COSRX-2026B",
    expiryDate: "2027-12-20", // Clear/Fresh
    productionDate: "2025-12-20",
    isLocked: false
  },
  {
    id: "b-3",
    batchNumber: "BCH-SMT-2026C",
    expiryDate: "2026-07-01", // Near Expiry (<1 month!)
    productionDate: "2024-07-01",
    isLocked: false
  },
  {
    id: "b-4",
    batchNumber: "BCH-RMD-2027F",
    expiryDate: "2027-05-18", // Fresh
    productionDate: "2025-05-18",
    isLocked: false
  },
  {
    id: "b-5",
    batchNumber: "BCH-BAD-EXPIRED",
    expiryDate: "2026-04-10", // ALREADY EXPIRED! System will auto-lock!
    productionDate: "2024-04-10",
    isLocked: true // Locked state
  }
];

// Seed BatchStock (Quantities per location per batch per variant)
export const seedBatchStock: BatchStock[] = [
  // COSRX standard: v-1
  { id: "bs-1", batchId: "b-1", variantId: "v-1", warehouseId: "wh-1", quantity: 8 },  // Low Stock
  { id: "bs-2", batchId: "b-2", variantId: "v-1", warehouseId: "wh-1", quantity: 30 }, // Good Stock
  { id: "bs-3", batchId: "b-1", variantId: "v-1", warehouseId: "wh-2", quantity: 5 },
  
  // COSRX travel: v-2
  { id: "bs-4", batchId: "b-2", variantId: "v-2", warehouseId: "wh-1", quantity: 18 },
  
  // Somethinc 20ml: v-3 (Close to expiry in 1 month!)
  { id: "bs-5", batchId: "b-3", variantId: "v-3", warehouseId: "wh-1", quantity: 35 },
  
  // Romand shade 06: v-5
  { id: "bs-6", batchId: "b-4", variantId: "v-5", warehouseId: "wh-1", quantity: 50 },
  { id: "bs-7", batchId: "b-4", variantId: "v-5", warehouseId: "wh-2", quantity: 20 },
  
  // Romand shade 07: v-6
  { id: "bs-8", batchId: "b-4", variantId: "v-6", warehouseId: "wh-1", quantity: 12 }, // Low stock threshold 25
  
  // ESQA 01: v-7
  { id: "bs-9", batchId: "b-4", variantId: "v-7", warehouseId: "wh-1", quantity: 22 },
  
  // Expired Items in Damaged warehouse
  { id: "bs-10", batchId: "b-5", variantId: "v-1", warehouseId: "wh-3", quantity: 10 },
  { id: "bs-11", batchId: "b-5", variantId: "v-3", warehouseId: "wh-3", quantity: 15 }
];

// Seed Suppliers
export const seedSuppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "PT Kimia Kosmetik Distributor",
    contactPerson: "Budi Santoso",
    phone: "081234567890",
    email: "budi@kimiakosmetik.co.id",
    address: "Kawasan Industri MM2100, Cibitung, Bekasi"
  },
  {
    id: "sup-2",
    name: "Romand Official Indonesia Hub",
    contactPerson: "Diana Wijaya",
    phone: "081977665544",
    email: "diana@romand.id",
    address: "Sudirman Central Business District, Jakarta Pusat"
  },
  {
    id: "sup-3",
    name: "Somethinc Glow Distribution",
    contactPerson: "Andrian Hartanto",
    phone: "082199880011",
    email: "andrian@ somethinc.id",
    address: "Panjang Road Baru No 45, Jakarta Barat"
  }
];

// Seed Stock Movements
export const seedStockMovements: StockMovement[] = [
  {
    id: "mov-1",
    variantId: "v-1",
    batchId: "b-1",
    warehouseId: "wh-1",
    type: "Stok Masuk",
    quantity: 50,
    notes: "Restock awal barang dari distributor Utama",
    performedBy: "Muhammad Iqbal",
    createdAt: "2026-05-10T09:00:00Z"
  },
  {
    id: "mov-2",
    variantId: "v-1",
    batchId: "b-1",
    warehouseId: "wh-1",
    type: "Penjualan",
    quantity: 12,
    notes: "Penjualan offline cashier POS",
    performedBy: "Siti Rahma",
    createdAt: "2026-05-18T14:20:00Z"
  },
  {
    id: "mov-3",
    variantId: "v-3",
    batchId: "b-3",
    warehouseId: "wh-1",
    type: "Stok Masuk",
    quantity: 35,
    notes: "Incoming batch promo skincare fair",
    performedBy: "Muhammad Iqbal",
    createdAt: "2026-05-25T10:15:00Z"
  }
];

// Seed Transfers
export const seedTransfers: Transfer[] = [
  {
    id: "trn-1",
    transferNumber: "TRF/202605/0001",
    fromWarehouseId: "wh-1",
    toWarehouseId: "wh-2",
    status: "Received",
    notes: "Distribusi stok surplus Romand Lip Tint",
    performedBy: "Muhammad Iqbal",
    createdAt: "2026-05-20T11:00:00Z"
  },
  {
    id: "trn-2",
    transferNumber: "TRF/202606/0002",
    fromWarehouseId: "wh-1",
    toWarehouseId: "wh-2",
    status: "In Transit",
    notes: "Request darurat 10pcs COSRX BHA toner",
    performedBy: "Agustinov Freeze",
    createdAt: "2026-06-03T16:45:00Z"
  }
];

export const seedTransferItems: TransferItem[] = [
  {
    id: "trni-1",
    transferId: "trn-1",
    variantId: "v-5",
    batchId: "b-4",
    quantity: 20
  },
  {
    id: "trni-2",
    transferId: "trn-2",
    variantId: "v-1",
    batchId: "b-2",
    quantity: 10
  }
];

// Seed Returns
export const seedReturns: ReturnOrder[] = [
  {
    id: "ret-1",
    returnNumber: "RET/202605/001",
    type: "Customer",
    customerName: "Mrs. Linda Amelia",
    warehouseId: "wh-3", // goes to damaged warehouse
    status: "Selesai",
    notes: "Kemasan retak saat pengiriman kurir",
    createdAt: "2026-05-28T15:20:00Z"
  }
];

export const seedReturnItems: ReturnItem[] = [
  {
    id: "reti-1",
    returnId: "ret-1",
    variantId: "v-1",
    batchId: "b-1",
    quantity: 2,
    condition: "Cacat (Gudang Rusak)"
  }
];

// Seed Pricing Rules
export const seedPricingRules: PricingRule[] = [
  {
    id: "pr-1",
    name: "Diskon FEFO 3 Bulan",
    type: "Clearance (Near-Expiry)",
    nearExpiryMonths: 3,
    discountPercent: 15,
    description: "Diskon promo otomatis 15% untuk produk 3 bulan sebelum masa kadaluarsa agar fast-moving.",
    isActive: true
  },
  {
    id: "pr-2",
    name: "Diskon FEFO Ekstrim 1 Bulan",
    type: "Clearance (Near-Expiry)",
    nearExpiryMonths: 1,
    discountPercent: 40,
    description: "Obral cuci gudang diskon 40% otomatis untuk barang yang kadaluarsa dalam 30 hari.",
    isActive: true
  }
];

// Seed System Notifications
export const seedNotifications: SystemNotification[] = [
  {
    id: "nt-1",
    type: "Low Stock",
    title: "Stock Menipis: Romand Shade 07",
    message: "Stok tersisa 12 pcs di Gudang Utama Jakarta (Min. Ambang Batas: 25 pcs). Segera lakukan pemesanan ke Supplier.",
    isRead: false,
    createdAt: "2026-06-03T09:00:00Z",
    referenceId: "v-6"
  },
  {
    id: "nt-2",
    type: "Near Expiry",
    title: "Masa Kadaluarsa Mendekat: Somethinc Serum (BCH-SMT-2026C)",
    message: "Produk akan kadaluarsa pada 2026-07-01 (~26 hari lagi). Sistem menyarankan aturan Clearance Sale.",
    isRead: false,
    createdAt: "2026-06-04T07:15:00Z",
    referenceId: "b-3"
  },
  {
    id: "nt-3",
    type: "Expired Locked",
    title: "Sistem Terkunci: Batch BCH-BAD-EXPIRED Kadaluarsa",
    message: "Batch BCH-BAD-EXPIRED telah melewati masa kadaluarsa (2026-04-10). Akses penjualan untuk batch ini diblokir otomatis demi keamanan konsumen.",
    isRead: true,
    createdAt: "2026-04-11T00:01:00Z",
    referenceId: "b-5"
  }
];

// Seed AuditLogs
export const seedAuditLogs: AuditLog[] = [
  {
    id: "aud-1",
    userId: "u-1",
    username: "admin",
    fullname: "Agustinov Freeze",
    action: "Login Sukses",
    details: "Melakukan otentikasi login admin pada platform",
    ipAddress: "192.168.1.100",
    createdAt: "2026-06-05T08:00:12Z"
  },
  {
    id: "aud-2",
    userId: "u-2",
    username: "staff_iqbal",
    fullname: "Muhammad Iqbal",
    action: "Tambah Batch Baru",
    details: "Memasukkan nomor batch BCH-RMD-2027F dengan expired 2027-05-18",
    ipAddress: "192.168.1.102",
    createdAt: "2026-06-05T09:40:00Z"
  },
  {
    id: "aud-3",
    userId: "u-1",
    username: "admin",
    fullname: "Agustinov Freeze",
    action: "Diskon Otomatis Diaktifkan",
    details: "Mengaktifkan aturan clearance sale 15% untuk barang masa kadaluarsa mendekati 3 bulan",
    ipAddress: "192.168.1.100",
    createdAt: "2026-06-05T10:11:00Z"
  }
];
