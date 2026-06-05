/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Undo2, Plus, RotateCcw, AlertTriangle, User, ShieldAlert, Sparkles, FolderSync, Truck } from "lucide-react";
import { useInventory } from "../InventoryContext";
import { ReturnCondition } from "../types";

export const Returns: React.FC = () => {
  const {
    returns,
    returnItems,
    variants,
    batches,
    warehouses,
    suppliers,
    createReturn,
    currentUser
  } = useInventory();

  // Return Form states
  const [retType, setRetType] = useState<"Customer" | "Supplier">("Customer");
  const [targetWh, setTargetWh] = useState(warehouses[0]?.id || "");
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  // Items draft state
  const [items, setItems] = useState<{ variantId: string; batchId: string; quantity: number; condition: ReturnCondition }[]>([]);

  // Individual item being added
  const [curVarId, setCurVarId] = useState(variants[0]?.id || "");
  const [curBatchId, setCurBatchId] = useState(batches[0]?.id || "");
  const [curQty, setCurQty] = useState(0);
  const [curCond, setCurCond] = useState<ReturnCondition>("Cacat (Gudang Rusak)");

  const handleAddItem = () => {
    if (!curVarId || !curBatchId || curQty <= 0) return;
    setItems((prev) => [
      ...prev,
      { variantId: curVarId, batchId: curBatchId, quantity: curQty, condition: curCond }
    ]);
    setCurQty(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturnOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !targetWh) return;

    createReturn(
      retType,
      targetWh,
      retType === "Supplier" ? supplierId : undefined,
      retType === "Customer" ? customerName : undefined,
      items,
      notes || `Form Retur ${retType}`
    );

    setItems([]);
    setCustomerName("");
    setNotes("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in animate-duration-300">
      {/* LEFT FORM CREATOR */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-5 h-fit">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
          <RotateCcw size={16} className="text-amber-500" /> Proses Retur Barang
        </h3>

        <form onSubmit={handleSubmitReturnOrder} className="space-y-4">
          {/* Return Type Select */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">TIPE RETUR</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setRetType("Customer");
                  setItems([]);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg ${
                  retType === "Customer" ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-inner" : "text-slate-400 hover:text-white"
                }`}
              >
                Customer Return
              </button>
              <button
                type="button"
                onClick={() => {
                  setRetType("Supplier");
                  setItems([]);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg ${
                  retType === "Supplier" ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-inner" : "text-slate-400 hover:text-white"
                }`}
              >
                Supplier Return
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer Name or Supplier */}
            {retType === "Customer" ? (
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">NAMA PELANGGAN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrs. Linda Amelia"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            ) : (
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">SUPPLIER TARGET</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Warehouse destination / source */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                {retType === "Customer" ? "TERIMA DI GUDANG" : "AMBIL DARI GUDANG"}
              </label>
              <select
                value={targetWh}
                onChange={(e) => setTargetWh(e.target.value)}
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

          {/* Item Adder draft */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-3">
            <span className="text-[10px] font-mono block uppercase font-bold text-slate-400">TAMBAH ITEM RETUR:</span>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={curVarId}
                onChange={(e) => setCurVarId(e.target.value)}
                className="bg-slate-900 border border-slate-750 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl w-full"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.sku} - {v.name}
                  </option>
                ))}
              </select>

              <select
                value={curBatchId}
                onChange={(e) => setCurBatchId(e.target.value)}
                className="bg-slate-900 border border-slate-750 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl w-full"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Jumlah pcs"
                value={curQty || ""}
                onChange={(e) => setCurQty(parseInt(e.target.value) || 0)}
                className="bg-slate-900 border border-slate-750 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl text-center font-mono w-full"
              />

              <select
                value={curCond}
                onChange={(e) => setCurCond(e.target.value as any)}
                className="bg-slate-900 border border-slate-750 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl w-full"
              >
                <option value="Cacat (Gudang Rusak)">Cacat (Ke Gudang Rusak)</option>
                <option value="Segel (Stok Jual)">Segel (Ke Stok Jual)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all animate-none"
            >
              <Plus size={13} /> Pasang Draft Item
            </button>
          </div>

          {/* Draft list rendering */}
          {items.length > 0 && (
            <div className="border border-slate-800 rounded-2xl overflow-hidden font-medium text-xs bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-2">Item SKU</th>
                    <th className="p-2">Kondisi</th>
                    <th className="p-2 text-center">Batal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const vObj = variants.find((v) => v.id === item.variantId);
                    return (
                      <tr key={index} className="border-b border-slate-800/40 text-slate-200">
                        <td className="p-2">
                          <span className="font-bold block">{vObj?.sku}</span>
                          <span className="text-[10px] text-slate-500">Qty: {item.quantity} pcs</span>
                        </td>
                        <td className="p-2">
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded leading-none ${
                            item.condition.includes("Cacat")
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {item.condition}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-400 hover:scale-105 transition"
                          >
                            ×
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
            <label className="text-[10px] text-slate-400 block mb-1 font-mono">BERITA ACARA RETUR</label>
            <input
              type="text"
              required
              placeholder="e.g. Pecah boks pengiriman kurir pos"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={items.length === 0}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all"
          >
            Selesaikan Retur & Adjust Stok
          </button>
        </form>
      </div>

      {/* RIGHT HISTORY BOARD */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-7">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
          <Undo2 size={16} className="text-amber-500" /> Histori Penyelesaian Retur Penjualan
        </h3>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {returns.length === 0 ? (
            <p className="text-xs text-slate-500 p-8 text-center">Belum ada penyelesaian berkas retur.</p>
          ) : (
            returns.map((r) => {
              const relItems = returnItems.filter((ri) => ri.returnId === r.id);
              const targetWhObj = warehouses.find((w) => w.id === r.warehouseId);

              return (
                <div key={r.id} className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-550 block">{r.returnNumber}</span>
                      <span className="text-[9px] text-slate-500">Pencatatan: {r.createdAt.slice(0, 10)}</span>
                    </div>

                    <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase px-2 py-0.5 rounded leading-none">
                      {r.type} Return
                    </span>
                  </div>

                  <div className="bg-slate-950/40 p-2.5 rounded-xl text-xs font-medium border border-slate-900 flex justify-between items-center">
                    <span>
                      {r.type === "Customer" ? `Dari: ${r.customerName}` : `Kembali ke Supplier ID: ${r.supplierId}`}
                    </span>
                    <span className="text-slate-400 font-normal">Gudang Penyimpanan: <b>{targetWhObj?.name}</b></span>
                  </div>

                  {/* List items return */}
                  <div className="space-y-1.5 pl-1">
                    <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block">Spesifikasi Item Retur:</span>
                    {relItems.map((item, id) => {
                      const vObj = variants.find((v) => v.id === item.variantId);
                      const bObj = batches.find((b) => b.id === item.batchId);
                      return (
                        <div key={id} className="flex justify-between items-center text-[11px] font-mono leading-none">
                          <span className="text-slate-300">• {vObj?.sku} ({vObj?.name}) — Bch: {bObj?.batchNumber}</span>
                          <span className="font-bold text-slate-400">{item.quantity} pcs ({item.condition.slice(0, 5)})</span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-slate-400 italic">“Berita Acara: {r.notes}”</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
