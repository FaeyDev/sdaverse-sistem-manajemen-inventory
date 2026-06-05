/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  GitCompare,
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  FileText
} from "lucide-react";
import { useInventory } from "../InventoryContext";

export const Transfers: React.FC = () => {
  const {
    warehouses,
    variants,
    batches,
    batchStock,
    transfers,
    transferItems,
    createTransfer,
    updateTransferStatus,
    currentUser
  } = useInventory();

  // Create form state
  const [fromWh, setFromWh] = useState(warehouses[0]?.id || "");
  const [toWh, setToWh] = useState(warehouses[1]?.id || "");
  const [notes, setNotes] = useState("");

  // Items list being added
  const [items, setItems] = useState<{ variantId: string; batchId: string; quantity: number }[]>([]);

  // Individual item being added
  const [curVarId, setCurVarId] = useState(variants[0]?.id || "");
  const [curBatchId, setCurBatchId] = useState(batches[0]?.id || "");
  const [curQty, setCurQty] = useState(0);

  const handleAddItem = () => {
    if (!curVarId || !curBatchId || curQty <= 0) return;
    
    // Check if enough stock exists in source warehouse
    const currentStock = batchStock.find(
      (bs) => bs.warehouseId === fromWh && bs.variantId === curVarId && bs.batchId === curBatchId
    );
    const originStock = currentStock ? currentStock.quantity : 0;

    // Accounts for already added quantities in table too
    const alreadyAddedQty = items
      .filter((item) => item.variantId === curVarId && item.batchId === curBatchId)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (originStock < (curQty + alreadyAddedQty)) {
      alert(`Stok tidak memadai di gudang asal! Tersedia: ${originStock} pcs, ingin transfer: ${curQty + alreadyAddedQty} pcs.`);
      return;
    }

    setItems((prev) => [...prev, { variantId: curVarId, batchId: curBatchId, quantity: curQty }]);
    setCurQty(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTransferOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !fromWh || !toWh) return;

    createTransfer(fromWh, toWh, items, notes || "Transfer stok antar gudang.");
    setItems([]);
    setNotes("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* LEFT: Dispatch Desk creation form */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-5 h-fit">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
          <ArrowRightLeft size={16} className="text-amber-500" /> Buat Shipment Transfer Stok
        </h3>

        {currentUser?.role === "Cashier" ? (
          <div className="p-6 bg-slate-800/10 border border-slate-800/60 rounded-2xl text-center text-slate-500 text-xs text-slate-400">
            Akses logistik dikunci. Khusus untuk staf gudang atau administrator.
          </div>
        ) : (
          <form onSubmit={handleCreateTransferOrder} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Origin Warehouse */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">GUDANG ASAL DESPATCH</label>
                <select
                  value={fromWh}
                  onChange={(e) => {
                    setFromWh(e.target.value);
                    setItems([]); // Clear draft if origin shifts!
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Warehouse */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">GUDANG TUJUAN ALOKASI</label>
                <select
                  value={toWh}
                  onChange={(e) => setToWh(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* In-form item adder */}
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
              <span className="text-[10px] font-mono block uppercase font-bold text-slate-400">TAMBAH ITEM DISPATCH:</span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Varian select */}
                <div>
                  <select
                    value={curVarId}
                    onChange={(e) => setCurVarId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl"
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
                  <select
                    value={curBatchId}
                    onChange={(e) => setCurBatchId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} (Exp: {b.expiryDate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Jumlah pcs"
                  value={curQty || ""}
                  onChange={(e) => setCurQty(parseInt(e.target.value) || 0)}
                  className="w-24 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl font-mono text-center"
                />

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Plus size={13} /> Pasang Draft Item
                </button>
              </div>
            </div>

            {/* Added Draft items List table */}
            {items.length > 0 && (
              <div className="border border-slate-800 rounded-2xl overflow-hidden font-medium text-xs bg-slate-900/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold">
                    <tr>
                      <th className="p-2.5">SKU Varian</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const vObj = variants.find((v) => v.id === item.variantId);
                      const bObj = batches.find((b) => b.id === item.batchId);
                      return (
                        <tr key={index} className="border-b border-slate-800/50 text-slate-200">
                          <td className="p-2.5">
                            <span className="font-semibold block">{vObj?.sku}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Bch: {bObj?.batchNumber}</span>
                          </td>
                          <td className="p-2.5 font-mono font-semibold">{item.quantity} pcs</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-500 hover:text-red-400"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">NOTES SHIPMENT</label>
              <input
                type="text"
                placeholder="e.g. Distribusi stok promosi bulanan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              disabled={items.length === 0}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all"
            >
              Proses Pengiriman (In Transit)
            </button>
          </form>
        )}
      </div>

      {/* RIGHT: Active transfers list & history board */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
            <Truck size={16} className="text-amber-550" /> Lembar Pengiriman Logistik (Shipments)
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {transfers.length === 0 ? (
              <p className="text-xs text-slate-500 p-8 text-center">Tidak ada dokumen pengapalan aktif.</p>
            ) : (
              transfers.map((t) => {
                const whFromObj = warehouses.find((w) => w.id === t.fromWarehouseId);
                const whToObj = warehouses.find((w) => w.id === t.toWarehouseId);
                const relatedItems = transferItems.filter((ti) => ti.transferId === t.id);

                return (
                  <div key={t.id} className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-500 block">
                          {t.transferNumber}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Dibuat: {t.createdAt.slice(0, 10)} | Oleh: {t.performedBy}
                        </span>
                      </div>

                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded font-mono ${
                          t.status === "Received"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse"
                        }`}
                      >
                        {t.status === "Received" ? "Diterima (Received)" : "Dalam Perjalanan (In Transit)"}
                      </span>
                    </div>

                    {/* Pathway route rendering */}
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-900 flex items-center justify-between text-xs font-medium">
                      <div className="text-left">
                        <span className="text-[9px] text-slate-500 block uppercase font-mono">PENGIRIM</span>
                        <span className="text-slate-200">{whFromObj?.name}</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-600" />
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block uppercase font-mono">PENERIMA</span>
                        <span className="text-slate-200">{whToObj?.name}</span>
                      </div>
                    </div>

                    {/* Listing of Items inside the transfer */}
                    <div className="space-y-1 pl-1">
                      <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block">Spesifikasi Item:</span>
                      {relatedItems.map((item, index) => {
                        const vObj = variants.find((v) => v.id === item.variantId);
                        const bObj = batches.find((b) => b.id === item.batchId);
                        return (
                          <div key={index} className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                            <span>• {vObj?.sku} ({vObj?.name}) — Batch: {bObj?.batchNumber}</span>
                            <span className="font-bold text-slate-300">{item.quantity} pcs</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-slate-400 italic">“{t.notes}”</div>

                    {/* Confirm receiving */}
                    {t.status === "In Transit" && currentUser?.role !== "Cashier" && (
                      <button
                        onClick={() => updateTransferStatus(t.id, "Received")}
                        className="w-full py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 font-bold text-xs transition duration-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle size={13} /> Selesaikan Terima Barang (Received)
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 leading-none mt-4 font-mono">
          * Catatan: Semua transfer logistik terekam dalam database Audit Trail.
        </div>
      </div>
    </div>
  );
};
