/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Tag, Sparkles, AlertTriangle, ShieldCheck, DollarSign, RefreshCw, Activity, Layers } from "lucide-react";
import { useInventory } from "../InventoryContext";

export const PricingRules: React.FC = () => {
  const {
    pricingRules,
    togglePricingRule,
    variants,
    products,
    batches,
    getDiscountedPrice,
    currentUser
  } = useInventory();

  // Selected SKU for live pricing emulator matrix
  const [selectedVarId, setSelectedVarId] = useState(variants[0]?.id || "");
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || "");

  const activeSku = variants.find((v) => v.id === selectedVarId);
  const activeProduct = activeSku ? products.find((p) => p.id === activeSku.productId) : null;
  const activeBatch = batches.find((b) => b.id === selectedBatchId);

  // Compute live price after automatic clearance discounts
  const clearanceData = activeSku && selectedBatchId
    ? getDiscountedPrice(activeSku, selectedBatchId)
    : { price: activeSku?.retailPrice || 0, discountPercent: 0, ruleName: null };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* LEFT PANEL: Clearance sale engine config & active regulations */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-6 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
            <Tag size={16} className="text-amber-500" /> Clearance Sale Engine Config (FEFO Rules)
          </h3>
          <p className="text-[11px] text-slate-400 mb-6 font-light leading-relaxed">
            Sistem clearance otomatis memotong harga eceran (retail) secara dinamis bagi batch yang umurnya mendekati masa kadaluarsa (3 bulan atau 1 bulan) demi mendorong penjualan kilat (FEFO push).
          </p>

          <div className="space-y-4">
            {pricingRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border flex items-start gap-4 transition duration-300 relative overflow-hidden ${
                  rule.isActive
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-slate-900/40 border-slate-850 opacity-60"
                }`}
              >
                {rule.isActive && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                )}

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-500">
                  <Activity size={16} />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-100 text-xs uppercase font-mono">{rule.name}</span>
                    <span className="text-[10px] font-bold text-amber-500 font-mono">DISCOUNT: {rule.discountPercent}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-light">{rule.description}</p>
                  
                  {/* Toggle button */}
                  {currentUser?.role === "Admin" && (
                    <div className="pt-2 text-right">
                      <button
                        type="button"
                        onClick={() => togglePricingRule(rule.id)}
                        className={`px-3 py-1 text-[10px] rounded-lg font-bold uppercase transition ${
                          rule.isActive
                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 hover:bg-amber-500/25 text-amber-405 border border-amber-500/20"
                        }`}
                      >
                        {rule.isActive ? "Matikan Aturan" : "Aktifkan Aturan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-3 mt-6">
          * Aturan penentuan harga multi-tier (Reseller, Wholesale) terikat permanen pada spesifikasi SKU Varian.
        </div>
      </div>

      {/* RIGHT PANEL: Live SKU Pricing matrix emulator simulator */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
          <Sparkles size={16} className="text-amber-500" /> Live Interactive Pricing Emulator
        </h3>
        <p className="text-[11px] text-slate-400 mb-4 font-light">
          Pilih variasi produk beserta nomor batch produksinya. Sistem akan mendeduksi umur batch tersebut (berdasarkan simulated date 2026-06-05) dan menampilkan skema harga eceran real-time pasca diskon clearance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Sku select */}
          <div>
            <label className="text-[9px] text-slate-400 font-mono block mb-1">PILIH SKU VARIAN</label>
            <select
              value={selectedVarId}
              onChange={(e) => setSelectedVarId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white"
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.sku} - {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch select */}
          <div>
            <label className="text-[9px] text-slate-400 font-mono block mb-1 font-semibold text-amber-500 font-bold">PILIH BATCH (DEDUKSI UMUR)</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full bg-slate-955 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} (Exp: {b.expiryDate})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing Matrix Table Card */}
        {activeSku && (
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850/80 space-y-4">
            <div className="border-b border-slate-850 pb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                {activeProduct?.brand} PRODUCT SEGMENT
              </span>
              <h4 className="font-bold text-slate-200 text-sm mt-0.5">
                {activeProduct?.name} ({activeSku.name})
              </h4>
            </div>

            {/* Price values sheet */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Distributor Supplier Price (COGS):</span>
                <span className="font-mono font-bold text-slate-200">Rp {activeSku.supplierPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Normal Eceran Retail Price:</span>
                <span className="font-mono font-bold text-slate-200">Rp {activeSku.retailPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 font-light">
                <span>Reseller Tier Price:</span>
                <span className="font-mono font-bold text-amber-400">Rp {activeSku.resellerPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 font-light">
                <span>Grosir / Bulk Wholesale Price:</span>
                <span className="font-mono font-bold text-blue-400">Rp {activeSku.wholesalePrice.toLocaleString()}</span>
              </div>

              {/* Clearance effect area */}
              <div className="pt-3.5 border-t border-slate-900 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-amber-500 font-bold block uppercase font-mono">
                    Live FEFO Sells Price:
                  </span>
                  {clearanceData.discountPercent > 0 && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/20 text-amber-500 font-bold italic font-sans inline-block mt-1">
                      🏷️ {clearanceData.ruleName}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  {clearanceData.discountPercent > 0 ? (
                    <>
                      <span className="text-[10px] text-slate-500 line-through block font-mono">
                        Rp {activeSku.retailPrice.toLocaleString()}
                      </span>
                      <span className="text-base font-black text-emerald-400 font-mono">
                        Rp {clearanceData.price.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-base font-black text-slate-200 font-mono">
                      Rp {activeSku.retailPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
