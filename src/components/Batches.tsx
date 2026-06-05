/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CalendarClock, Plus, ShieldCheck, Lock, AlertTriangle, PlayCircle } from "lucide-react";
import { useInventory } from "../InventoryContext";

export const Batches: React.FC = () => {
  const { batches, addBatch, currentUser } = useInventory();

  // Form states
  const [bNo, setBNo] = useState("");
  const [pDate, setPDate] = useState("");
  const [eDate, setEDate] = useState("");

  const handleSubmitBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bNo || !pDate || !eDate) return;
    addBatch(bNo, pDate, eDate);
    setBNo("");
    setPDate("");
    setEDate("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in animate-duration-300">
      {/* LEFT: Batches list directory */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-7">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
          <CalendarClock size={16} className="text-amber-500" /> Manajemen Batch Produksi aktif
        </h3>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {batches.map((b) => {
            const today = new Date("2026-06-05");
            const exp = new Date(b.expiryDate);
            const isExpired = exp.getTime() < today.getTime();

            return (
              <div
                key={b.id}
                className={`p-4 bg-slate-900 border rounded-2xl flex items-center justify-between text-xs relative overflow-hidden ${
                  isExpired
                    ? "border-red-500/20 bg-red-500/5 text-slate-400"
                    : "border-slate-800/80 text-slate-200"
                }`}
              >
                {isExpired && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                )}

                <div>
                  <span className="font-mono text-sm font-extrabold block text-slate-100">
                    {b.batchNumber}
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Mfg: {b.productionDate} | Exp: {b.expiryDate}
                  </p>
                </div>

                <div className="text-right">
                  {isExpired ? (
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1">
                      <Lock size={10} /> AUTO-LOCKED EXPIRED
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-1">
                      <ShieldCheck size={10} /> AMAN (ACTIVE)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Add Batch form */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-12 xl:col-span-5 h-fit">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
          <Plus size={16} className="text-amber-550" /> Daftarkan Batch Baru
        </h3>

        {currentUser?.role !== "Admin" && currentUser?.role !== "Warehouse Staff" ? (
          <div className="p-6 bg-slate-800/10 border border-slate-800/60 rounded-2xl text-center text-slate-500 text-xs">
            Akses dibatasi. Diperlukan peran otorisasi <b>Admin</b> atau <b>Warehouse Staff</b> untuk mendaftarkan batch manufaktur baru.
          </div>
        ) : (
          <form onSubmit={handleSubmitBatch} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">KODE NOMOR BATCH (BATCH NUMBER)</label>
              <input
                type="text"
                required
                placeholder="e.g. BCH-COSRX-2026C"
                value={bNo}
                onChange={(e) => setBNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">TANGGAL PRODUKSI (MFG)</label>
                <input
                  type="date"
                  required
                  value={pDate}
                  onChange={(e) => setPDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">TANGGAL KADALUARSA (EXP)</label>
                <input
                  type="date"
                  required
                  value={eDate}
                  onChange={(e) => setEDate(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-extrabold text-xs hover:scale-[1.02] duration-200 shadow-md text-black transition-all"
            >
              Simpan Nomor Batch
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
