/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "Admin" | "Warehouse Staff" | "Cashier";

export interface User {
  id: string;
  username: string;
  email: string;
  fullname: string;
  role: UserRole;
  passwordHash: string; // Simulated
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null; // Self-referencing hierachy
  description: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  brand: string;
  description: string;
  image: string; // SKU illustration or URL
  createdAt: string;
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  name: string; // e.g., "Shade 01 - Soft Pink", "150ml"
  size: string; // e.g., "150ml", "Standard"
  shade?: string; // e.g., "Soft Pink"
  retailPrice: number;
  resellerPrice: number;
  wholesalePrice: number;
  supplierPrice: number;
  minStockThreshold: number; // For low-stock alert
}

export interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  productionDate: string; // YYYY-MM-DD
  isLocked: boolean; // Expired auto-lock
}

export interface BatchStock {
  id: string;
  batchId: string;
  variantId: string;
  warehouseId: string;
  quantity: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  code: string;
}

export type MovementType = "Stok Masuk" | "Stok Keluar" | "Penjualan" | "Rusak" | "Tester" | "Adjustment" | "Transfer";

export interface StockMovement {
  id: string;
  variantId: string;
  batchId: string;
  warehouseId: string;
  type: MovementType;
  quantity: number; // Positive
  notes: string;
  performedBy: string; // User fullname
  createdAt: string;
}

export interface StockOpname {
  id: string;
  warehouseId: string;
  variantId: string;
  batchId: string;
  systemQuantity: number;
  physicalQuantity: number;
  difference: number;
  notes: string;
  status: "Selesai";
  performedBy: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface SupplierSupplyLog {
  id: string;
  supplierId: string;
  variantId: string;
  price: number;
  quantity: number;
  supplyDate: string;
}

export type TransferStatus = "Pending" | "In Transit" | "Received";

export interface Transfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  status: TransferStatus;
  notes: string;
  performedBy: string;
  createdAt: string;
}

export interface TransferItem {
  id: string;
  transferId: string;
  variantId: string;
  batchId: string;
  quantity: number;
}

export type ReturnType = "Customer" | "Supplier";
export type ReturnCondition = "Cacat (Gudang Rusak)" | "Segel (Stok Jual)";

export interface ReturnOrder {
  id: string;
  returnNumber: string;
  type: ReturnType;
  supplierId?: string;
  customerName?: string;
  warehouseId: string; // target return
  status: "Selesai";
  notes: string;
  createdAt: string;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  variantId: string;
  batchId: string;
  quantity: number;
  condition: ReturnCondition;
}

export interface PricingRule {
  id: string;
  name: string;
  type: "Clearance (Near-Expiry)" | "Tier-Customer";
  nearExpiryMonths?: number; // threshold e.g. 3 months
  discountPercent?: number; // e.g. 30%
  tierType?: "retail" | "reseller" | "wholesale";
  description: string;
  isActive: boolean;
}

export type NotificationType = "Low Stock" | "Near Expiry" | "Expired Locked";

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string; // variant or batch ID
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  fullname: string;
  action: string; // e.g., "Tambah Produk", "Transfer Stock"
  details: string; // Details in JSON or string
  ipAddress: string;
  createdAt: string;
}
