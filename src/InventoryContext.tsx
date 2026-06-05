/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  User,
  Category,
  Product,
  Variant,
  Batch,
  BatchStock,
  Warehouse,
  StockMovement,
  StockOpname,
  Supplier,
  Transfer,
  TransferItem,
  ReturnOrder,
  ReturnItem,
  PricingRule,
  SystemNotification,
  AuditLog,
  MovementType,
  TransferStatus,
  ReturnCondition
} from "./types";
import {
  seedUsers,
  seedCategories,
  seedProducts,
  seedVariants,
  seedWarehouses,
  seedBatches,
  seedBatchStock,
  seedSuppliers,
  seedStockMovements,
  seedTransfers,
  seedTransferItems,
  seedReturns,
  seedReturnItems,
  seedPricingRules,
  seedNotifications,
  seedAuditLogs
} from "./mockData";

interface Toast {
  id: string;
  message: string;
  type: "success" | "warning" | "error" | "info";
}

interface InventoryContextProps {
  currentUser: User | null;
  users: User[];
  categories: Category[];
  products: Product[];
  variants: Variant[];
  batches: Batch[];
  batchStock: BatchStock[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  stockMovements: StockMovement[];
  stockOpnames: StockOpname[];
  transfers: Transfer[];
  transferItems: TransferItem[];
  returns: ReturnOrder[];
  returnItems: ReturnItem[];
  pricingRules: PricingRule[];
  notifications: SystemNotification[];
  auditLogs: AuditLog[];
  toasts: Toast[];
  
  // Auth actions
  login: (username: string, role: string) => boolean;
  logout: () => void;
  registerUser: (fullname: string, username: string, email: string, role: string) => boolean;
  
  // Database actions
  showToast: (message: string, type?: "success" | "warning" | "error" | "info") => void;
  removeToast: (id: string) => void;
  logAction: (action: string, details: string) => void;
  
  // Brand / Product CRUD
  addProduct: (name: string, categoryId: string, brand: string, description: string, image: string) => void;
  updateProduct: (id: string, name: string, categoryId: string, brand: string, description: string, image: string) => void;
  deleteProduct: (id: string) => void;
  
  // Category Actions
  addCategory: (name: string, parentId: string | null, description: string) => void;

  // Variant CRUD
  addVariant: (variant: Omit<Variant, "id">) => void;
  updateVariant: (variant: Variant) => void;
  
  // Batch management
  addBatch: (batchNumber: string, productionDate: string, expiryDate: string) => void;
  
  // Stock Movements & Suggestions (FEFO)
  restockVariant: (variantId: string, batchId: string, warehouseId: string, quantity: number, notes: string) => void;
  reduceStockVariant: (variantId: string, batchId: string, warehouseId: string, quantity: number, type: MovementType, notes: string) => boolean;
  getFEFOSuggestion: (variantId: string, warehouseId: string, requiredQty: number) => { batch: Batch; stock: number }[];
  
  // Opname (Reconciliation)
  executeStockOpname: (warehouseId: string, variantId: string, batchId: string, physicalQty: number, notes: string) => void;
  
  // Multi-Warehouse Transfers
  createTransfer: (fromWh: string, toWh: string, items: { variantId: string; batchId: string; quantity: number }[], notes: string) => void;
  updateTransferStatus: (transferId: string, newStatus: TransferStatus) => void;
  
  // Suppliers
  addSupplier: (supplier: Omit<Supplier, "id">) => void;
  
  // Returns
  createReturn: (type: "Customer" | "Supplier", targetWh: string, supplierId: string | undefined, customerName: string | undefined, items: { variantId: string; batchId: string; quantity: number; condition: ReturnCondition }[], notes: string) => void;
  
  // Pricing & Clearance sale config
  togglePricingRule: (id: string) => void;
  getDiscountedPrice: (variant: Variant, batchId: string) => { price: number; discountPercent: number; ruleName: string | null };
}

const InventoryContext = createContext<InventoryContextProps | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try loading from localStorage, otherwise fallback to seed
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("inv_curr_user");
    return saved ? JSON.parse(saved) : seedUsers[0]; // Let default be Admin on startup
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("inv_users");
    return saved ? JSON.parse(saved) : seedUsers;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("inv_categories");
    return saved ? JSON.parse(saved) : seedCategories;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("inv_products");
    return saved ? JSON.parse(saved) : seedProducts;
  });

  const [variants, setVariants] = useState<Variant[]>(() => {
    const saved = localStorage.getItem("inv_variants");
    return saved ? JSON.parse(saved) : seedVariants;
  });

  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem("inv_batches");
    return saved ? JSON.parse(saved) : seedBatches;
  });

  const [batchStock, setBatchStock] = useState<BatchStock[]>(() => {
    const saved = localStorage.getItem("inv_batch_stock");
    return saved ? JSON.parse(saved) : seedBatchStock;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem("inv_warehouses");
    return saved ? JSON.parse(saved) : seedWarehouses;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem("inv_suppliers");
    return saved ? JSON.parse(saved) : seedSuppliers;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem("inv_movements");
    return saved ? JSON.parse(saved) : seedStockMovements;
  });

  const [stockOpnames, setStockOpnames] = useState<StockOpname[]>(() => {
    const saved = localStorage.getItem("inv_opnames");
    return saved ? JSON.parse(saved) : [];
  });

  const [transfers, setTransfers] = useState<Transfer[]>(() => {
    const saved = localStorage.getItem("inv_transfers");
    return saved ? JSON.parse(saved) : seedTransfers;
  });

  const [transferItems, setTransferItems] = useState<TransferItem[]>(() => {
    const saved = localStorage.getItem("inv_transfer_items");
    return saved ? JSON.parse(saved) : seedTransferItems;
  });

  const [returns, setReturns] = useState<ReturnOrder[]>(() => {
    const saved = localStorage.getItem("inv_returns");
    return saved ? JSON.parse(saved) : seedReturns;
  });

  const [returnItems, setReturnItems] = useState<ReturnItem[]>(() => {
    const saved = localStorage.getItem("inv_return_items");
    return saved ? JSON.parse(saved) : seedReturnItems;
  });

  const [pricingRules, setPricingRules] = useState<PricingRule[]>(() => {
    const saved = localStorage.getItem("inv_rules");
    return saved ? JSON.parse(saved) : seedPricingRules;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem("inv_notifications");
    return saved ? JSON.parse(saved) : seedNotifications;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("inv_audit_logs");
    return saved ? JSON.parse(saved) : seedAuditLogs;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Persist state in local storage on changes
  useEffect(() => {
    localStorage.setItem("inv_curr_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("inv_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("inv_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("inv_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("inv_variants", JSON.stringify(variants));
  }, [variants]);

  useEffect(() => {
    localStorage.setItem("inv_batches", JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem("inv_batch_stock", JSON.stringify(batchStock));
  }, [batchStock]);

  useEffect(() => {
    localStorage.setItem("inv_warehouses", JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem("inv_suppliers", JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem("inv_movements", JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem("inv_opnames", JSON.stringify(stockOpnames));
  }, [stockOpnames]);

  useEffect(() => {
    localStorage.setItem("inv_transfers", JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem("inv_transfer_items", JSON.stringify(transferItems));
  }, [transferItems]);

  useEffect(() => {
    localStorage.setItem("inv_returns", JSON.stringify(returns));
  }, [returns]);

  useEffect(() => {
    localStorage.setItem("inv_return_items", JSON.stringify(returnItems));
  }, [returnItems]);

  useEffect(() => {
    localStorage.setItem("inv_rules", JSON.stringify(pricingRules));
  }, [pricingRules]);

  useEffect(() => {
    localStorage.setItem("inv_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("inv_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Toast handler
  const showToast = (message: string, type: "success" | "warning" | "error" | "info" = "success") => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Log auditing
  const logAction = (action: string, details: string) => {
    if (!currentUser) return;
    const log: AuditLog = {
      id: "aud-" + Date.now().toString() + Math.random().toString(36).substring(2, 5),
      userId: currentUser.id,
      username: currentUser.username,
      fullname: currentUser.fullname,
      action,
      details,
      ipAddress: "192.168.1." + Math.floor(Math.random() * 150 + 100),
      createdAt: new Date().toISOString()
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Run periodic automated checks on stock levels / batch expiries to issue real-time system warnings
  useEffect(() => {
    const today = new Date("2026-06-05"); // Standard simulated time: 2026-06-05
    const newAlerts: SystemNotification[] = [];

    // 1. Stock checks: Check which variants have depleted stock levels
    variants.forEach((v) => {
      // Aggregate stock of active warehouses (excluding damaged WH-03)
      const stockQty = batchStock
        .filter((bs) => bs.variantId === v.id && bs.warehouseId !== "wh-3")
        .reduce((sum, bs) => sum + bs.quantity, 0);

      if (stockQty < v.minStockThreshold) {
        // Only generate alert if alert does not exist recently
        const alreadyExists = notifications.some(
          (n) => n.type === "Low Stock" && n.referenceId === v.id && !n.isRead
        );
        if (!alreadyExists) {
          newAlerts.push({
            id: "nt-auto-" + Math.random().toString(36).substring(2, 7),
            type: "Low Stock",
            title: `Low Stock: ${v.sku}`,
            message: `Stok total untuk varian ${v.name} tinggal ${stockQty} unit (Ambang Batas: ${v.minStockThreshold}).`,
            isRead: false,
            createdAt: today.toISOString(),
            referenceId: v.id
          });
        }
      }
    });

    // 2. Expiry checks
    batches.forEach((b) => {
      const expDate = new Date(b.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = diffDays / 30;

      if (diffDays <= 0) {
        // EXPIRED! Auto lock
        if (!b.isLocked) {
          // Lock the batch in state
          setBatches((prev) =>
            prev.map((item) => (item.id === b.id ? { ...item, isLocked: true } : item))
          );
          showToast(`Batch ${b.batchNumber} kadaluarsa & dikooptasi kunci penjualan otomatis!`, "error");
        }

        const alertExists = notifications.some(
          (n) => n.type === "Expired Locked" && n.referenceId === b.id && !n.isRead
        );
        if (!alertExists) {
          newAlerts.push({
            id: "nt-auto-" + Math.random().toString(36).substring(2, 7),
            type: "Expired Locked",
            title: `Locked: Batch ${b.batchNumber} Expired`,
            message: `Batch ${b.batchNumber} kadaluarsa pada tanggal ${b.expiryDate}. Sistem memblokir transfer/penjualan batch ini.`,
            isRead: false,
            createdAt: today.toISOString(),
            referenceId: b.id
          });
        }
      } else if (diffMonths <= 3) {
        // NEAR EXPIRY
        const alertExists = notifications.some(
          (n) => n.type === "Near Expiry" && n.referenceId === b.id && !n.isRead
        );
        if (!alertExists) {
          newAlerts.push({
            id: "nt-auto-" + Math.random().toString(36).substring(2, 7),
            type: "Near Expiry",
            title: `Near Expiry: Batch ${b.batchNumber}`,
            message: `Batch ${b.batchNumber} memasuki rentang kritis kadaluarsa pada ${b.expiryDate} (~${Math.round(diffDays)} hari lagi).`,
            isRead: false,
            createdAt: today.toISOString(),
            referenceId: b.id
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setNotifications((prev) => [...newAlerts, ...prev]);
    }
  }, [batchStock, variants, batches]);

  // Auth Operations
  const login = (username: string, role: string): boolean => {
    const found = users.find((u) => u.username === username.trim().toLowerCase());
    if (found) {
      const updatedUser = { ...found, role: role as any };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));
      showToast(`Selamat datang kembali, ${found.fullname}!`, "success");
      
      const logMsg = `Melakukan login dengan peran ${role}`;
      const logRecord: AuditLog = {
        id: "aud-" + Date.now().toString(),
        userId: found.id,
        username: found.username,
        fullname: found.fullname,
        action: "Login",
        details: logMsg,
        ipAddress: "192.168.1.104",
        createdAt: new Date().toISOString()
      };
      setAuditLogs((prev) => [logRecord, ...prev]);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      logAction("Logout", `Staff ${currentUser.fullname} melakuakan logout`);
    }
    setCurrentUser(null);
    showToast("Berhasil logout dari sistem", "info");
  };

  const registerUser = (fullname: string, username: string, email: string, role: string): boolean => {
    const checkUser = users.some((u) => u.username === username.trim().toLowerCase());
    if (checkUser) {
      showToast("Username sudah digunakan!", "error");
      return false;
    }

    const newUser: User = {
      id: "u-" + (users.length + 1),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      fullname: fullname.trim(),
      role: role as any,
      passwordHash: "client_registered",
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => [...prev, newUser]);
    showToast("User baru berhasil didaftarkan!", "success");
    logAction("Registrasi User", `Menambah user baru: ${fullname} (${role})`);
    return true;
  };

  // Add Category
  const addCategory = (name: string, parentId: string | null, description: string) => {
    const newCat: Category = {
      id: "cat-" + Date.now().toString(),
      name,
      parentId,
      description
    };
    setCategories((prev) => [...prev, newCat]);
    showToast(`Kategori ${name} sukses ditambahkan!`, "success");
    logAction("Tambah Kategori", `Menambah kategori kecantikan ${name}`);
  };

  // Product CRUD
  const addProduct = (name: string, categoryId: string, brand: string, description: string, image: string) => {
    const newProduct: Product = {
      id: "p-" + Date.now().toString(),
      name,
      categoryId,
      brand,
      description,
      image,
      createdAt: new Date().toISOString()
    };
    setProducts((prev) => [...prev, newProduct]);
    showToast(`Produk ${name} telah didaftarkan!`, "success");
    logAction("Tambah Produk", `Mendaftarkan master produk baru: ${brand} - ${name}`);
  };

  const updateProduct = (id: string, name: string, categoryId: string, brand: string, description: string, image: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name, categoryId, brand, description, image } : p
      )
    );
    showToast("Master Produk berhasil diperbarui!", "success");
    logAction("Edit Master Produk", `Mengubah deskripsi & data master produk id ${id}`);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setVariants((prev) => prev.filter((v) => v.productId !== id));
    showToast("Master Produk & variannya dibuang!", "warning");
    logAction("Hapus Produk", `Menghapus master produk id ${id}`);
  };

  // Variant CRUD
  const addVariant = (variant: Omit<Variant, "id">) => {
    const newVariant: Variant = {
      ...variant,
      id: "v-" + Date.now().toString()
    };
    setVariants((prev) => [...prev, newVariant]);
    showToast(`Varian ${variant.name} ditambahkan!`, "success");
    logAction("Tambah Varian", `Menambah SKU varian ${variant.sku} - ${variant.name}`);
  };

  const updateVariant = (v: Variant) => {
    setVariants((prev) => prev.map((item) => (item.id === v.id ? v : item)));
    showToast(`SKU ${v.sku} berhasil diubah!`, "success");
    logAction("Edit Varian", `Mengubah stok ambang batas/sku dan harga ${v.sku}`);
  };

  // Batch
  const addBatch = (batchNumber: string, productionDate: string, expiryDate: string) => {
    const newBatch: Batch = {
      id: "b-" + Date.now().toString(),
      batchNumber,
      productionDate,
      expiryDate,
      isLocked: false
    };
    setBatches((prev) => [...prev, newBatch]);
    showToast(`Batch Produksi ${batchNumber} ditambahkan!`, "success");
    logAction("Tambah Batch", `Memasukkan data nomor batch ${batchNumber} (Exp: ${expiryDate})`);
  };

  // Restock (Stock in)
  const restockVariant = (variantId: string, batchId: string, warehouseId: string, quantity: number, notes: string) => {
    if (quantity <= 0) return;
    
    // Check if batch is locked
    const batchObj = batches.find((b) => b.id === batchId);
    if (batchObj?.isLocked) {
      showToast(`Gagal: Batch ${batchObj.batchNumber} terkunci karena kadaluarsa!`, "error");
      return;
    }

    setBatchStock((prev) => {
      const idx = prev.findIndex(
        (bs) => bs.batchId === batchId && bs.variantId === variantId && bs.warehouseId === warehouseId
      );
      if (idx !== -1) {
        // Mutate
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
        return updated;
      } else {
        // Create new
        const newRecord: BatchStock = {
          id: "bs-" + Date.now().toString() + Math.random().toString(36).substring(2, 5),
          batchId,
          variantId,
          warehouseId,
          quantity
        };
        return [...prev, newRecord];
      }
    });

    // Record Movement
    const movement: StockMovement = {
      id: "mov-" + Date.now().toString(),
      variantId,
      batchId,
      warehouseId,
      type: "Stok Masuk",
      quantity,
      notes,
      performedBy: currentUser?.fullname || "Sistem",
      createdAt: new Date().toISOString()
    };
    setStockMovements((prev) => [movement, ...prev]);

    const variantName = variants.find((v) => v.id === variantId)?.name;
    const warehouseName = warehouses.find((w) => w.id === warehouseId)?.name;
    showToast(`Sukses menambah ${quantity} pcs stok ${variantName}`, "success");
    logAction("Stok Masuk", `Restock ${quantity} unit ${variantName} di ${warehouseName}`);
  };

  // Reduce Stock (Stock out due to sale, breakage, or tester)
  const reduceStockVariant = (
    variantId: string,
    batchId: string,
    warehouseId: string,
    quantity: number,
    type: MovementType,
    notes: string
  ): boolean => {
    const batchObj = batches.find((b) => b.id === batchId);
    if (batchObj?.isLocked) {
      showToast(`Akses dihentikan! Batch ${batchObj.batchNumber} kadaluarsa dan terkunci.`, "error");
      return false;
    }

    // Find stock
    const idx = batchStock.findIndex(
      (bs) => bs.batchId === batchId && bs.variantId === variantId && bs.warehouseId === warehouseId
    );

    if (idx === -1 || batchStock[idx].quantity < quantity) {
      const varName = variants.find((v) => v.id === variantId)?.name;
      const whName = warehouses.find((w) => w.id === warehouseId)?.name;
      showToast(`Gagal: Stok tidak cukup untuk ${varName} di ${whName}`, "error");
      return false;
    }

    setBatchStock((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity - quantity };
      return updated;
    });

    // Record movement
    const movement: StockMovement = {
      id: "mov-" + Date.now().toString(),
      variantId,
      batchId,
      warehouseId,
      type,
      quantity,
      notes,
      performedBy: currentUser?.fullname || "Sistem",
      createdAt: new Date().toISOString()
    };
    setStockMovements((prev) => [movement, ...prev]);

    const variantName = variants.find((v) => v.id === variantId)?.name;
    const warehouseName = warehouses.find((w) => w.id === warehouseId)?.name;
    showToast(`Sukses mengurangi ${quantity} pcs (${type})`, "success");
    logAction(type, `Mengeluarkan ${quantity} unit (${type}) ${variantName} di ${warehouseName}`);
    return true;
  };

  // FEFO Selection Guidance (First Expired, First Out)
  const getFEFOSuggestion = (variantId: string, warehouseId: string, requiredQty: number) => {
    // Collect all batchStock of this variant at this warehouse
    const candidates = batchStock
      .filter((bs) => bs.variantId === variantId && bs.warehouseId === warehouseId && bs.quantity > 0)
      .map((bs) => {
        const batchObj = batches.find((b) => b.id === bs.batchId);
        return {
          batch: batchObj!,
          stock: bs.quantity
        };
      })
      // Filter out invalid batches or locked batches (expired)
      .filter((c) => c.batch && !c.batch.isLocked)
      // Sort oldest expiry date first!
      .sort((a, b) => new Date(a.batch.expiryDate).getTime() - new Date(b.batch.expiryDate).getTime());

    return candidates;
  };

  // Stock Opname
  const executeStockOpname = (
    warehouseId: string,
    variantId: string,
    batchId: string,
    physicalQty: number,
    notes: string
  ) => {
    const idx = batchStock.findIndex(
      (bs) => bs.batchId === batchId && bs.variantId === variantId && bs.warehouseId === warehouseId
    );
    const systemQty = idx !== -1 ? batchStock[idx].quantity : 0;
    const diff = physicalQty - systemQty;

    // Update stock
    if (idx !== -1) {
      setBatchStock((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: physicalQty };
        return updated;
      });
    } else {
      setBatchStock((prev) => [
        ...prev,
        {
          id: "bs-" + Date.now(),
          batchId,
          variantId,
          warehouseId,
          quantity: physicalQty
        }
      ]);
    }

    // Save opname entry
    const newOpname: StockOpname = {
      id: "op-" + Date.now().toString(),
      warehouseId,
      variantId,
      batchId,
      systemQuantity: systemQty,
      physicalQuantity: physicalQty,
      difference: diff,
      notes,
      status: "Selesai",
      performedBy: currentUser?.fullname || "Sistem",
      createdAt: new Date().toISOString()
    };
    setStockOpnames((prev) => [newOpname, ...prev]);

    // Record stock movement adjustments
    const movement: StockMovement = {
      id: "mov-" + Date.now().toString(),
      variantId,
      batchId,
      warehouseId,
      type: "Adjustment",
      quantity: Math.abs(diff),
      notes: `Penyesuaian Opname Fisik: ${diff > 0 ? "+" : ""}${diff} unit. Notes: ${notes}`,
      performedBy: currentUser?.fullname || "Sistem",
      createdAt: new Date().toISOString()
    };
    setStockMovements((prev) => [movement, ...prev]);

    const vName = variants.find((v) => v.id === variantId)?.name;
    const wName = warehouses.find((w) => w.id === warehouseId)?.name;
    showToast(`Opname selesai. Selisih ${diff > 0 ? "+" : ""}${diff} unit (${vName})`, "info");
    logAction("Stock Opname", `Melakukan rekonsiliasi stok<sup>${wName}</sup> untuk ${vName} (Sistem: ${systemQty}, Fisik: ${physicalQty})`);
  };

  // Transfers
  const createTransfer = (fromWh: string, toWh: string, items: { variantId: string; batchId: string; quantity: number }[], notes: string) => {
    if (fromWh === toWh) {
      showToast("Gudang asal dan tujuan tidak boleh sama!", "error");
      return;
    }

    const trfId = "trf-" + Date.now().toString();
    const trfNumber = `TRF/${new Date().toISOString().slice(0, 7).replace("-", "")}/${Math.floor(Math.random() * 9000 + 1000)}`;

    const newTransfer: Transfer = {
      id: trfId,
      transferNumber: trfNumber,
      fromWarehouseId: fromWh,
      toWarehouseId: toWh,
      status: "Pending",
      notes,
      performedBy: currentUser?.fullname || "Staff",
      createdAt: new Date().toISOString()
    };

    const newItems: TransferItem[] = items.map((item) => {
      // Deduct from origin warehouse immediately to place into In-Transit state
      setBatchStock((prev) => {
        const idx = prev.findIndex(
          (bs) => bs.variantId === item.variantId && bs.batchId === item.batchId && bs.warehouseId === fromWh
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity - item.quantity };
          return updated;
        }
        return prev;
      });

      // Movement origin
      const moveOut: StockMovement = {
        id: "mov-trfo-" + Math.random().toString(),
        variantId: item.variantId,
        batchId: item.batchId,
        warehouseId: fromWh,
        type: "Transfer",
        quantity: item.quantity,
        notes: `Transfer Keluar ke ${trfNumber}`,
        performedBy: currentUser?.fullname || "Sistem",
        createdAt: new Date().toISOString()
      };
      setStockMovements((prev) => [moveOut, ...prev]);

      return {
        id: "trfi-" + Math.random(),
        transferId: trfId,
        variantId: item.variantId,
        batchId: item.batchId,
        quantity: item.quantity
      };
    });

    setTransfers((prev) => [newTransfer, ...prev]);
    setTransferItems((prev) => [...prev, ...newItems]);

    showToast(`Transfer order ${trfNumber} dibuat (In Transit)!`, "success");
    logAction("Buat Transfer", `Mentransfer stok dalam pengiriman dari ${warehouses.find(w => w.id === fromWh)?.name} ke ${warehouses.find(w => w.id === toWh)?.name}`);
  };

  const updateTransferStatus = (transferId: string, newStatus: TransferStatus) => {
    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id !== transferId) return t;

        // If transitioning to Received, we execute adding stock to target warehouse
        if (newStatus === "Received" && t.status !== "Received") {
          // Find all transfer items
          const itemsToCredit = transferItems.filter((ti) => ti.transferId === transferId);
          itemsToCredit.forEach((item) => {
            // Credit target Warehouse Stock
            setBatchStock((prevStock) => {
              const idx = prevStock.findIndex(
                (bs) => bs.variantId === item.variantId && bs.batchId === item.batchId && bs.warehouseId === t.toWarehouseId
              );
              if (idx !== -1) {
                const updated = [...prevStock];
                updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
                return updated;
              } else {
                return [
                  ...prevStock,
                  {
                    id: "bs-trfi-" + Math.random(),
                    batchId: item.batchId,
                    variantId: item.variantId,
                    warehouseId: t.toWarehouseId,
                    quantity: item.quantity
                  }
                ];
              }
            });

            // Log entry for receiving
            const moveIn: StockMovement = {
              id: "mov-trfi-" + Math.random(),
              variantId: item.variantId,
              batchId: item.batchId,
              warehouseId: t.toWarehouseId,
              type: "Transfer",
              quantity: item.quantity,
              notes: `Transfer Masuk dari ${t.transferNumber}`,
              performedBy: currentUser?.fullname || "Sistem",
              createdAt: new Date().toISOString()
            };
            setStockMovements((prev) => [moveIn, ...prev]);
          });

          showToast(`Transfer ${t.transferNumber} diterima sepenuhnya!`, "success");
          logAction("Selesai Transfer", `Menerima kiriman barang ${t.transferNumber}`);
        }

        return { ...t, status: newStatus };
      })
    );
  };

  // Supplier supply additions
  const addSupplier = (supplier: Omit<Supplier, "id">) => {
    const newSup: Supplier = {
      ...supplier,
      id: "sup-" + Date.now().toString()
    };
    setSuppliers((prev) => [...prev, newSup]);
    showToast(`Supplier ${supplier.name} didaftarkan!`, "success");
    logAction("Tambah Supplier", `Mendaftarkan supplier kosmetik ${supplier.name}`);
  };

  // Returns
  const createReturn = (
    type: "Customer" | "Supplier",
    targetWh: string,
    supplierId: string | undefined,
    customerName: string | undefined,
    items: { variantId: string; batchId: string; quantity: number; condition: ReturnCondition }[],
    notes: string
  ) => {
    const returnId = "ret-" + Date.now().toString();
    const rNumber = `RET/${new Date().toISOString().slice(0, 7).replace("-", "")}/${Math.floor(Math.random() * 9000 + 1000)}`;

    const newReturn: ReturnOrder = {
      id: returnId,
      returnNumber: rNumber,
      type,
      supplierId,
      customerName,
      warehouseId: targetWh,
      status: "Selesai",
      notes,
      createdAt: new Date().toISOString()
    };

    const newItems: ReturnItem[] = items.map((item) => {
      // Adjust stock based on return type and condition
      if (type === "Customer") {
        const actualWh = item.condition === "Cacat (Gudang Rusak)" ? "wh-3" : targetWh; // wh-3 is damaged depot
        setBatchStock((prevStock) => {
          const idx = prevStock.findIndex(
            (bs) => bs.variantId === item.variantId && bs.batchId === item.batchId && bs.warehouseId === actualWh
          );
          if (idx !== -1) {
            const updated = [...prevStock];
            updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
            return updated;
          } else {
            return [
              ...prevStock,
              {
                id: "bs-ret-" + Math.random(),
                batchId: item.batchId,
                variantId: item.variantId,
                warehouseId: actualWh,
                quantity: item.quantity
              }
            ];
          }
        });

        // Record stock movement (inward return)
        const moveIn: StockMovement = {
          id: "mov-ret-" + Math.random(),
          variantId: item.variantId,
          batchId: item.batchId,
          warehouseId: actualWh,
          type: "Stok Masuk",
          quantity: item.quantity,
          notes: `Retur Pelanggan (${customerName}) - ${item.condition}`,
          performedBy: currentUser?.fullname || "Sistem",
          createdAt: new Date().toISOString()
        };
        setStockMovements((prev) => [moveIn, ...prev]);
      } else {
        // Supplier return: we subtract items from stock and return to manufacturer
        setBatchStock((prevStock) => {
          const idx = prevStock.findIndex(
            (bs) => bs.variantId === item.variantId && bs.batchId === item.batchId && bs.warehouseId === targetWh
          );
          if (idx !== -1) {
            const updated = [...prevStock];
            const leftover = Math.max(0, updated[idx].quantity - item.quantity);
            updated[idx] = { ...updated[idx], quantity: leftover };
            return updated;
          }
          return prevStock;
        });

        const moveOut: StockMovement = {
          id: "mov-rets-" + Math.random(),
          variantId: item.variantId,
          batchId: item.batchId,
          warehouseId: targetWh,
          type: "Stok Keluar",
          quantity: item.quantity,
          notes: `Retur dikembalikan ke Supplier id ${supplierId}`,
          performedBy: currentUser?.fullname || "Sistem",
          createdAt: new Date().toISOString()
        };
        setStockMovements((prev) => [moveOut, ...prev]);
      }

      return {
        id: "reti-" + Math.random(),
        returnId,
        variantId: item.variantId,
        batchId: item.batchId,
        quantity: item.quantity,
        condition: item.condition
      };
    });

    setReturns((prev) => [newReturn, ...prev]);
    setReturnItems((prev) => [...prev, ...newItems]);
    
    showToast(`Order Retur<sup>${rNumber}</sup> diproses & diselesaikan!`, "info");
    logAction("Retur Diselesaikan", `Memproses retur ${type} dengan nomor ${rNumber}. Notes: ${notes}`);
  };

  // Toggle pricing rule
  const togglePricingRule = (id: string) => {
    setPricingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    showToast("Aturan diskon / clearance berhasil diperbarui", "success");
    logAction("Ubah Aturan Harga", `Mengaktifkan/menonaktifkan aturan ID ${id}`);
  };

  // Get active pricing (Auto clearance near-expiry FEFO discount, or multi-tier price)
  const getDiscountedPrice = (variant: Variant, batchId: string) => {
    const batchObj = batches.find((b) => b.id === batchId);
    let price = variant.retailPrice;
    let discountPercent = 0;
    let ruleName: string | null = null;

    if (batchObj) {
      const today = new Date("2026-06-05");
      const expDate = new Date(batchObj.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = diffDays / 30;

      // Find active rules
      const activeRules = pricingRules.filter((r) => r.isActive);

      if (diffMonths <= 1) {
        const r = activeRules.find((rule) => rule.nearExpiryMonths === 1);
        if (r && r.discountPercent) {
          discountPercent = r.discountPercent;
          price = variant.retailPrice * (1 - discountPercent / 100);
          ruleName = r.name;
        }
      } else if (diffMonths <= 3) {
        const r = activeRules.find((rule) => rule.nearExpiryMonths === 3);
        if (r && r.discountPercent) {
          discountPercent = r.discountPercent;
          price = variant.retailPrice * (1 - discountPercent / 100);
          ruleName = r.name;
        }
      }
    }

    return {
      price: Math.round(price),
      discountPercent,
      ruleName
    };
  };

  return (
    <InventoryContext.Provider
      value={{
        currentUser,
        users,
        categories,
        products,
        variants,
        batches,
        batchStock,
        warehouses,
        suppliers,
        stockMovements,
        stockOpnames,
        transfers,
        transferItems,
        returns,
        returnItems,
        pricingRules,
        notifications,
        auditLogs,
        toasts,
        
        login,
        logout,
        registerUser,
        showToast,
        removeToast,
        logAction,
        
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        addVariant,
        updateVariant,
        addBatch,
        restockVariant,
        reduceStockVariant,
        getFEFOSuggestion,
        executeStockOpname,
        createTransfer,
        updateTransferStatus,
        addSupplier,
        createReturn,
        togglePricingRule,
        getDiscountedPrice
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return context;
};
