/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { History, Search, ShieldAlert, Sparkles, Filter, FileSpreadsheet } from "lucide-react";
import { useInventory } from "../InventoryContext";

export const AuditTrail: React.FC = () => {
  const { auditLogs } = useInventory();
  const [searchVal, setSearchVal] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const uniqueActions = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.fullname.toLowerCase().includes(searchVal.toLowerCase()) ||
      log.details.toLowerCase().includes(searchVal.toLowerCase()) ||
      log.username.toLowerCase().includes(searchVal.toLowerCase());
    const matchesAction = filterAction === "" || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 animate-fade-in animate-duration-300">
      {/* Filters bar */}
      <div className="glass-panel border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Text searching */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pelaku, detail tindakan..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          {/* Action category filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300"
          >
            <option value="">Semua Tindakan</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            // Emulate Excel report download
            alert("Mengekspor berkas CSV audit log...");
          }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <FileSpreadsheet size={14} /> Ekspor Audit CSV
        </button>
      </div>

      {/* Audit Log Table container card */}
      <div className="glass-panel border bg-slate-900/10 border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-1.5 mb-6">
          <ShieldAlert size={16} className="text-amber-500 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
            Log Aktivitas Server & Otorisasi Transaksi
          </h3>
        </div>

        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40">
          <table className="w-full text-left text-xs text-slate-400">
            <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 font-mono text-[10px]">TIME BLOCK (UTC)</th>
                <th className="p-3 font-mono text-[10px]">TINDAKAN / ACTION</th>
                <th className="p-3">KETERANGAN LOG SECURE</th>
                <th className="p-3">PEKTOR (OPERATO)</th>
                <th className="p-3 font-mono text-[10px] text-right">METADATA IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 font-medium text-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                    Log tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/25">
                    <td className="p-3 font-mono text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-750">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-light leading-relaxed max-w-sm">
                      {log.details}
                    </td>
                    <td className="p-3 text-slate-300">
                      <span className="font-semibold">{log.fullname}</span>
                      <span className="text-[10px] block text-slate-500 font-mono">@{log.username}</span>
                    </td>
                    <td className="p-3 text-right font-mono text-[10px] text-slate-500">
                      {log.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
