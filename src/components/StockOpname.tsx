/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Boxes,
  PlusCircle,
  MinusCircle,
  ClipboardPen,
  Truck,
  AlertCircle,
  HelpCircle,
  UserCheck,
  CheckCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  X
} from "lucide-react";
import { useInventory } from "../InventoryContext";
import { MovementType } from "../types";

export const StockOpname: React.FC = () => {
  const {
    variants,
    warehouses,
    batches,
    batchStock,
    stockOpnames,
    stockMovements,
    restockVariant,
    reduceStockVariant,
    executeStockOpname,
    getFEFOSuggestion,
    currentUser,
    pricingRules
  } = useInventory();

  // Active sub tab: "in" | "out" | "reconcile"
  const [subTab, setSubTab] = useState<"in" | "out" | "reconcile">("in");

  // Form States for STOK MASUK
  const [inVariantId, setInVariantId] = useState(variants[0]?.id || "");
  const [inBatchId, setInBatchId] = useState(batches[0]?.id || "");
  const [inWhId, setInWhId] = useState(warehouses[0]?.id || "");
  const [inQty, setInQty] = useState(0);
  const [inNotes, setInNotes] = useState("");

  // Form States for STOK KELUAR
  const [outVariantId, setOutVariantId] = useState(variants[0]?.id || "");
  const [outWhId, setOutWhId] = useState(warehouses[0]?.id || "");
  const [outQty, setOutQty] = useState(0);
  const [outNotes, setOutNotes] = useState("");
  const [outType, setOutType] = useState<MovementType>("Penjualan");
  const [fefoSuggestOpen, setFefoSuggestOpen] = useState(false);

  // Form States for OPNAME RECONCILE
  const [recWhId, setRecWhId] = useState(warehouses[0]?.id || "");
  const [recVarId, setRecVarId] = useState(variants[0]?.id || "");
  const [recBatchId, setRecBatchId] = useState(batches[0]?.id || "");
  const [recPhysQty, setRecPhysQty] = useState(0);
  const [recNotes, setRecNotes] = useState("");

  // Handle incoming submit
  const handleIncomingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inVariantId || !inBatchId || !inWhId || inQty <= 0) return;
    restockVariant(inVariantId, inBatchId, inWhId, inQty, inNotes || "Restock manual.");
    setInQty(0);
    setInNotes("");
  };

  // Handle outgoing submit
  const handleOutgoingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outVariantId || !outWhId || outQty <= 0) return;

    // Utilize FEFO automatic suggestion order to grab correct batches!
    const fefoSuggests = getFEFOSuggestion(outVariantId, outWhId, outQty);
    if (fefoSuggests.length === 0) {
      alert("Stok barang ini kosong di gudang terpilih!");
      return;
    }

    let remainingQty = outQty;
    // Iterate over candidate batches in FEFO sequence to reduce stock!
    for (const item of fefoSuggests) {
      if (remainingQty <= 0) break;
      const deductQty = Math.min(remainingQty, item.stock);
      const success = reduceStockVariant(
        outVariantId,
        item.batch.id,
        outWhId,
        deductQty,
        outType,
        outNotes || `Pengeluaran ${outType} (Otomatis FEFO Batch: ${item.batch.batchNumber})`
      );
      if (success) {
        remainingQty -= deductQty;
      }
    }

    if (remainingQty <= 0) {
      setOutQty(0);
      setOutNotes("");
    }
  };

  // Handle opname reconcile submit
  const handleReconSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recWhId || !recVarId || !recBatchId) return;
    executeStockOpname(recWhId, recVarId, recBatchId, recPhysQty, recNotes || "Stock Opname Audit");
    setRecNotes("");
  };

  // Helper find current system stock level
  const getCurrentSystemStock = (whId: string, varId: string, bId: string): number => {
    const item = batchStock.find((bs) => bs.warehouseId === whId && bs.variantId === varId && bs.batchId === bId);
    return item ? item.quantity : 0;
  };

  const sysQtyForReview = getCurrentSystemStock(recWhId, recVarId, recBatchId);

  // Suggested FEFO table previews for outgoing search
  const previewSuggs = outVariantId && outWhId ? getFEFOSuggestion(outVariantId, outWhId, 999) : [];

  return (
    <div className="space-y-6">
      {/* Sub Tabs Toggle Toolbar */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setSubTab("in")}
          className={`px-5 py-3 hover:text-white transition text-xs font-semibold uppercase font-mono tracking-wider flex items-center gap-2 ${
            subTab === "in" ? "border-b-2 border-amber-500 text-amber-500 font-extrabold" : "text-slate-400"
          }`}
        >
          <PlusCircle size={14} /> Stok Masuk (Restock)
        </button>
        <button
          onClick={() => setSubTab("out")}
          className={`px-5 py-3 hover:text-white transition text-xs font-semibold uppercase font-mono tracking-wider flex items-center gap-2 ${
            subTab === "out" ? "border-b-2 border-amber-500 text-amber-500 font-extrabold" : "text-slate-400"
          }`}
        >
          <MinusCircle size={14} /> Stok Keluar (Penjualan / Rusak)
        </button>
        <button
          onClick={() => setSubTab("reconcile")}
          className={`px-5 py-3 hover:text-white transition text-xs font-semibold uppercase font-mono tracking-wider flex items-center gap-2 ${
            subTab === "reconcile" ? "border-b-2 border-amber-500 text-amber-500 font-extrabold" : "text-slate-400"
          }`}
        >
          <ClipboardPen size={14} /> Stock Opname Audit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TAB CONTENT LEFT (Operational Forms) */}
        <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-7">
          {/* 1. STOK MASUK */}
          {subTab === "in" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Input Restok & Stok Masuk Gudang
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-mono">
                  FEFO Allowed
                </span>
              </div>

              {currentUser?.role === "Cashier" ? (
                <div className="p-8 bg-slate-800/10 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                  Hak transaksi dikunci. Peran Anda (Cashier) hanya diizinkan mencatat mutasi <b>Stok Keluar (Penjualan Retail)</b>.
                </div>
              ) : (
                <form onSubmit={handleIncomingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* SKU Selection */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">PILIH SKU VARIAN</label>
                      <select
                        value={inVariantId}
                        onChange={(e) => setInVariantId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.sku} - {v.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Batch Number */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">NOMOR BATCH PRODUKSI</label>
                      <select
                        value={inBatchId}
                        onChange={(e) => setInBatchId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.batchNumber} (Exp: {b.expiryDate}) {b.isLocked ? "🔒" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Destination Warehouse */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">GUDANG ALOKASI</label>
                      <select
                        value={inWhId}
                        onChange={(e) => setInWhId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">JUMLAH PCS</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={inQty || ""}
                        onChange={(e) => setInQty(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">KETERANGAN / CATATAN TRANSAKSI</label>
                    <input
                      type="text"
                      placeholder="e.g. Pembelian PO Supplier Romand, bonus tester"
                      value={inNotes}
                      onChange={(e) => setInNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Simpan & Update Kartu Stok Masuk
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. STOK KELUAR WITH AUTOMATED FEFO SEQUENCE */}
          {subTab === "out" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Catat Pengeluaran Unit & Sells
                </h3>
                <button
                  type="button"
                  onClick={() => setFefoSuggestOpen(!fefoSuggestOpen)}
                  className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-1 hover:bg-amber-500/25 cursor-pointer"
                >
                  {fefoSuggestOpen ? "Sembunyikan" : "Tampilkan"} FEFO Finder
                </button>
              </div>

              {/* Show active FEFO sequence alert to cashier */}
              {previewSuggs.length > 0 && (
                <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 text-[11px] leading-relaxed text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                    <AlertCircle size={13} strokeWidth={2.5} /> Semburan Prioritas Sistem FEFO Aktif
                  </div>
                  Prioritas terdekat kadaluarsa di gudang ini adalah batch <b>{previewSuggs[0].batch.batchNumber}</b> (Exp: {previewSuggs[0].batch.expiryDate}). Sistem akan mengambil stok batch ini otomatis saat form di-submit.
                </div>
              )}

              <form onSubmit={handleOutgoingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SKU Varian */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">PILIH SKU VARIAN</label>
                    <select
                      value={outVariantId}
                      onChange={(e) => setOutVariantId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.sku} - {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Origin Warehouse */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">AMBIL DARI GUDANG</label>
                    <select
                      value={outWhId}
                      onChange={(e) => setOutWhId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Outgoing Type */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">ALASAN PENGELUARAN</label>
                    <select
                      value={outType}
                      onChange={(e) => setOutType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="Penjualan">Penjualan (Sales Cashier POS)</option>
                      <option value="Rusak">Rusak / Bocor (Gudang Rusak)</option>
                      <option value="Tester">Tester counter mockup</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">JUMLAH PCS</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={outQty || ""}
                      onChange={(e) => setOutQty(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">CATATAN PENGELUARAN</label>
                  <input
                    type="text"
                    placeholder="e.g. Kasir pos order, tester promosi booth"
                    value={outNotes}
                    onChange={(e) => setOutNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shadow-md cursor-pointer transition-all"
                >
                  Keluarkan Stok (FEFO Auto Allotted)
                </button>
              </form>
            </div>
          )}

          {/* 3. STOCK OPNAME AUDIT */}
          {subTab === "reconcile" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Fisik VS Sistem Stock Opname Audit
                </h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                  Sistem Autotrack
                </span>
              </div>

              {currentUser?.role !== "Admin" && currentUser?.role !== "Warehouse Staff" ? (
                <div className="p-8 bg-slate-800/10 border border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                  Otorisasi ditolak. Khusus untuk <b>Admin</b> / <b>Warehouse Staff</b> yang berwenang melakukan stock take di lapangan.
                </div>
              ) : (
                <form onSubmit={handleReconSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Warehouse */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">GUDANG AUDIT</label>
                      <select
                        value={recWhId}
                        onChange={(e) => setRecWhId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Varian */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">VARIASI SKU</label>
                      <select
                        value={recVarId}
                        onChange={(e) => setRecVarId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.sku} - {v.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Batch id */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">BATCH PRODUKSI</label>
                      <select
                        value={recBatchId}
                        onChange={(e) => setRecBatchId(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white"
                      >
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.batchNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Stock difference review */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400 block font-light">Stok Sistem Saat Ini</span>
                      <span className="text-lg font-bold text-white font-mono">{sysQtyForReview} pcs</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <label className="text-[10px] text-amber-500 font-mono block text-right font-bold">QTY FISIK NYATA</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={recPhysQty}
                          onChange={(e) => setRecPhysQty(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center font-bold font-mono outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">BERITA ACARA SELISIH / ALASAN REKONSILIASI</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ditemukan 1 box jatuh pecah di pojok rak B, tercatat cacat"
                      value={recNotes}
                      onChange={(e) => setRecNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Selesaikan Rekonsiliasi & Adjust Stok
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* TAB CONTENT RIGHT (Audit History List of Opnames / Mutations) */}
        <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-5 h-fit">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
            <ClipboardPen size={15} className="text-amber-500" /> Log Penyelarasan Fisik Terbaru
          </h3>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {stockOpnames.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Belum ada berkas data rekonsiliasi opname fisik terekam saat ini.
              </div>
            ) : (
              stockOpnames.map((o) => {
                const varObj = variants.find((v) => v.id === o.variantId);
                const whObj = warehouses.find((w) => w.id === o.warehouseId);
                const isDiffNegative = o.difference < 0;

                return (
                  <div key={o.id} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200 truncate pr-2">{varObj?.name}</span>
                      <span className={`font-mono font-bold ${isDiffNegative ? "text-red-400" : o.difference === 0 ? "text-slate-400" : "text-emerald-400"}`}>
                        {o.difference > 0 ? "+" : ""}{o.difference} pcs
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">“{o.notes}”</p>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono border-t border-slate-800/40 pt-1">
                      <span>U: {o.performedBy}</span>
                      <span>Mod: {o.createdAt.slice(11, 16)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
