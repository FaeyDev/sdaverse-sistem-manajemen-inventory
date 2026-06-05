/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertOctagon,
  Coins,
  History,
  CalendarCheck,
  PackageSearch,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { useInventory } from "../InventoryContext";

export const Dashboard: React.FC = () => {
  const {
    products,
    variants,
    batches,
    batchStock,
    warehouses,
    stockMovements,
    auditLogs,
    getFEFOSuggestion
  } = useInventory();

  // FEFO quick checker tool state
  const [fefoVarId, setFefoVarId] = useState(variants[0]?.id || "");
  const [fefoWhId, setFefoWhId] = useState(warehouses[0]?.id || "");

  // 1. Calculations for upper KPI Cards
  const totalProducts = products.length;
  
  // Aggregate real physical stocks (excluding damaged warehouse wh-3 for sellable stocks count)
  const totalStockUnits = batchStock
    .filter((bs) => bs.warehouseId !== "wh-3")
    .reduce((acc, item) => acc + item.quantity, 0);

  // Asset Valuation (Rp): SUM of Stock * Supplier Wholesale Price
  const assetValuation = batchStock
    .filter((bs) => bs.warehouseId !== "wh-3")
    .reduce((sum, bs) => {
      const v = variants.find((variant) => variant.id === bs.variantId);
      if (v) {
        return sum + bs.quantity * v.supplierPrice;
      }
      return sum;
    }, 0);

  // Near expiry / Expired count from batch list
  const activeExpiriesCount = batches.filter((b) => {
    const today = new Date("2026-06-05");
    const expDate = new Date(b.expiryDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90; // <= 3 months
  }).length;

  const expTotalStr = assetValuation.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  });

  // 2. SVG Chart 1 calculation: stock quantity per brand
  const brandDataObj: { [b: string]: number } = {};
  variants.forEach((v) => {
    const p = products.find((prod) => prod.id === v.productId);
    if (p) {
      const qty = batchStock
        .filter((bs) => bs.variantId === v.id && bs.warehouseId !== "wh-3")
        .reduce((sum, bs) => sum + bs.quantity, 0);
      brandDataObj[p.brand] = (brandDataObj[p.brand] || 0) + qty;
    }
  });

  const brandData = Object.keys(brandDataObj).map((brand) => ({
    name: brand,
    value: brandDataObj[brand]
  }));

  // 3. SVG Chart 2: Recent stock transactions activity levels
  const lastFiveMovements = stockMovements.slice(0, 5);

  const fefoResults = fefoVarId && fefoWhId ? getFEFOSuggestion(fefoVarId, fefoWhId, 999) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 4 Bento Stat Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Products */}
        <div className="glass-panel rounded-2xl p-5 border border-zinc-805 hover:border-amber-500/20 transition-all shadow-lg relative overflow-hidden group bg-zinc-950/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Master Produk SKU
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2 group-hover:scale-105 duration-300 transition-transform origin-left">
                {totalProducts} <span className="text-sm font-normal text-zinc-500">Varian</span>
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 mt-4 leading-none">
            Aktif didistribusi & terinventarisasi
          </p>
        </div>

        {/* Card 2: Stock Units */}
        <div className="glass-panel rounded-2xl p-5 border border-zinc-805 hover:border-zinc-500/20 transition-all shadow-lg relative overflow-hidden group bg-zinc-950/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-500/5 rounded-bl-full pointer-events-none group-hover:bg-zinc-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Jumlah Unit Stok Ready
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2 group-hover:scale-105 duration-300 transition-transform origin-left">
                {totalStockUnits} <span className="text-sm font-normal text-zinc-500">Pcs</span>
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-zinc-500/10 text-zinc-450 border border-zinc-500/25 shadow-inner">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-[10px] text-emerald-400 mt-4 leading-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
            Normal Warehouse Hub (G-1, G-2)
          </p>
        </div>

        {/* Card 3: Monetary Valuation */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 hover:border-amber-500/20 transition-all shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Asset Valuation
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 mt-2.5">
                {expTotalStr}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
              <Coins size={18} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 leading-none">
            Berdasarkan harga pokok COGS prapajak
          </p>
        </div>

        {/* Card 4: Alert Products */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 hover:border-red-500/20 transition-all shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none group-hover:bg-red-500/10 transition-colors" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Batch Kritis & Kadaluarsa
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2 group-hover:scale-105 duration-300 transition-transform origin-left text-red-400">
                {activeExpiriesCount} <span className="text-sm font-normal text-slate-500">Batch</span>
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-inner">
              <AlertOctagon size={18} />
            </div>
          </div>
          <p className="text-[10px] text-red-300 mt-4 leading-none">
            Butuh clearance sale / retur supplier
          </p>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Brand Stock Distributions (Custom beautiful SVG Pie-like Donut Chart) */}
        <div className="glass-panel border-zinc-850 rounded-3xl p-6 lg:col-span-5 relative bg-zinc-950/30">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-6 flex items-center gap-2 font-mono">
            <Sparkles size={15} className="text-amber-400" /> Distribusi Unit Stok per Brand
          </h3>

          <div className="flex flex-col items-center justify-center">
            {brandData.length === 0 ? (
              <p className="text-xs text-zinc-500 p-10">Data tidak tersedia</p>
            ) : (
              <div className="w-full flex flex-col md:flex-row items-center justify-around gap-4">
                {/* Custom Responsive SVG Donut Ring Chart */}
                <div className="relative w-44 h-44">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#18181b" strokeWidth="12" />
                    {/* Render rings */}
                    {(() => {
                      let currentOffset = 0;
                      const totalVal = brandData.reduce((s, bd) => s + bd.value, 0) || 1;
                      const colors = ["#f59e0b", "#71717a", "#b45309", "#3b82f6", "#10b981"];
                      return brandData.map((bd, i) => {
                        const pct = (bd.value / totalVal) * 100;
                        const dashArray = `${(pct * (2 * Math.PI * 40)) / 100} ${(2 * Math.PI * 40)}`;
                        const dashOffset = `${-(currentOffset / totalVal) * (2 * Math.PI * 40)}`;
                        currentOffset += bd.value;
                        return (
                          <circle
                            key={bd.name}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={colors[i % colors.length]}
                            strokeWidth="12"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-1000 ease-out"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Total</span>
                    <span className="text-xl font-extrabold text-white">{totalStockUnits}</span>
                  </div>
                </div>

                {/* Legend list with custom percentages */}
                <div className="space-y-2 text-xs w-full sm:w-auto">
                  {brandData.map((bd, i) => {
                    const colors = ["bg-amber-500", "bg-zinc-500", "bg-amber-700", "bg-blue-500", "bg-emerald-500"];
                    const percent = totalStockUnits > 0 ? Math.round((bd.value / totalStockUnits) * 100) : 0;
                    return (
                      <div key={bd.name} className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${colors[i % colors.length]} inline-block`} />
                          <span className="text-slate-200 font-semibold">{bd.name}</span>
                        </div>
                        <span className="text-slate-400 font-mono font-bold">
                          {bd.value} pcs ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic FEFO Suggestion Quick Tool Assistant */}
        <div className="glass-panel border-zinc-850 rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between bg-zinc-950/30">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-2 font-mono">
              <PackageSearch size={16} className="text-amber-500" /> FEFO Automated Picker Assistant
            </h3>
            <p className="text-[11px] text-zinc-400 mb-4 font-light">
              Pilih produk dan gudang, sistem akan memprioritaskan rekomendasi batch mana yang harus
              diambil dahulu sesuai urutan kadaluarsa tertua (First Expired First Out) demi meredam kerugian.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Variant Selector */}
              <div>
                <label className="text-[10px] text-zinc-400 font-mono block mb-1">PILIH PRODUK / SKU</label>
                <select
                  value={fefoVarId}
                  onChange={(e) => setFefoVarId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.sku} - {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warehouse Selector */}
              <div>
                <label className="text-[10px] text-zinc-400 font-mono block mb-1">GUDANG OPERASIONAL</label>
                <select
                  value={fefoWhId}
                  onChange={(e) => setFefoWhId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Suggestions Render block */}
            <div className="space-y-2 mt-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Rekomendasi Pengambilan Batch (Terurut):</span>
              {fefoResults.length === 0 ? (
                <div className="p-4 bg-slate-800/20 border border-slate-800 rounded-xl text-center text-slate-500 text-xs">
                  Stok barang kosong atau tidak tersedia di gudang terpilih!
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {fefoResults.map((res, index) => {
                    const today = new Date("2026-06-05");
                    const exp = new Date(res.batch.expiryDate);
                    const daysLeft = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const isNearExp = daysLeft <= 90;

                    return (
                      <div
                        key={res.batch.id}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          index === 0
                            ? "bg-amber-500/10 border-amber-500/30 text-zinc-100"
                            : "bg-zinc-950 border-zinc-900 text-zinc-450"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            index === 0 ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-200 block">
                              {res.batch.batchNumber}
                            </span>
                            <span className="text-[9px] text-slate-400 block">
                              Exp: {res.batch.expiryDate} ({daysLeft} hari lagi)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isNearExp && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-red-400 italic">
                              Rentan Kadaluarsa
                            </span>
                          )}
                          <span className="text-xs font-bold text-slate-200 bg-slate-800 border border-slate-700/80 px-2 py-0.5 rounded">
                            {res.stock} pcs instock
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-[10px] text-emerald-400/80 font-mono mt-4 border-t border-slate-800 pt-3">
            ✓ FEFO algorithm suggestion engine active. Automatically synced with expiry dates.
          </div>
        </div>
      </div>

      {/* Realtime stream logging and activity stream history */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Recent stock movements */}
        <div className="glass-panel border-zinc-850 rounded-3xl p-6 md:col-span-6 relative bg-zinc-950/30">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
            <Clock size={16} className="text-amber-400" /> Log Transaksi Mutasi Stok Terbaru
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {lastFiveMovements.length === 0 ? (
              <p className="text-xs text-zinc-500 p-8 text-center">Belum ada pergerakan stok terekam.</p>
            ) : (
              lastFiveMovements.map((m) => {
                const isPlus = m.type === "Stok Masuk" || (m.type === "Adjustment" && m.notes.includes("+"));
                const varObj = variants.find((v) => v.id === m.variantId);
                const whObj = warehouses.find((w) => w.id === m.warehouseId);
                return (
                  <div key={m.id} className="p-3 bg-zinc-950/60 border border-zinc-900/80 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-zinc-200 block">{varObj?.name}</span>
                      <span className="text-[10px] text-zinc-500 block">
                        Gudang: {whObj?.name} | Oleh: {m.performedBy}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold block ${isPlus ? "text-emerald-400" : "text-rose-400"}`}>
                        {isPlus ? "+" : "-"}{m.quantity} Pcs
                      </span>
                      <span className="text-[9px] uppercase px-1 rounded bg-zinc-900 text-zinc-500">
                        {m.type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Audit trail summary log */}
        <div className="glass-panel border-zinc-850 rounded-3xl p-6 md:col-span-6 relative bg-zinc-950/30">
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
            <History size={16} className="text-amber-500" /> Keamanan & Audit Trail Terkini
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col gap-1 text-[11px] leading-relaxed">
                <div className="flex justify-between items-center w-full">
                  <span className="font-bold text-slate-300 font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-[9px]">
                    {log.action}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">{log.createdAt.slice(11, 19)}</span>
                </div>
                <p className="text-slate-400 mt-1">{log.details}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-600 mt-1 border-t border-slate-800/40 pt-1">
                  <span>User: {log.fullname}</span>
                  <span>IP: {log.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
