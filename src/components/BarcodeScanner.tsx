/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Scan, Printer, Sparkles, Barcode as BarcodeIcon, Search, Eye, AlertCircle, FileText } from "lucide-react";
import { useInventory } from "../InventoryContext";

export const BarcodeScanner: React.FC = () => {
  const { variants, products, showToast } = useInventory();

  const [scanResult, setScanResult] = useState<any>(null);
  const [laserBlink, setLaserBlink] = useState(false);

  // Label print settings
  const [selectedVarId, setSelectedVarId] = useState(variants[0]?.id || "");
  const [printCopies, setPrintCopies] = useState(4);

  const activeSku = variants.find((v) => v.id === selectedVarId);
  const activeProduct = activeSku ? products.find((p) => p.id === activeSku.productId) : null;

  // Simulator scan action
  const triggerSimulatedScan = (barcode: string) => {
    setLaserBlink(true);
    setTimeout(() => {
      setLaserBlink(false);
      const found = variants.find((v) => v.barcode === barcode);
      if (found) {
        const prod = products.find((p) => p.id === found.productId);
        setScanResult({
          sku: found,
          product: prod
        });
        showToast(`Barcode Scanned: ${found.sku}!`, "success");
      } else {
        setScanResult(null);
        showToast("Barcode tidak terdaftar!", "warning");
      }
    }, 900);
  };

  // Barcode visual drawing generator inside inline SVGs (Simple pseudorandom bar lines based on code text)
  const renderSVGBarcode = (code: string) => {
    // Generate pseudorandom widths of lines based on code characters
    const seed = code || "8809481900125";
    const barCount = 42;
    const bars: React.ReactNode[] = [];
    let currentX = 5;

    for (let i = 0; i < barCount; i++) {
      const isBlack = (seed.charCodeAt(i % seed.length) + i) % 2 === 0;
      const width = ((seed.charCodeAt(i % seed.length) + i) % 3) + 1; // 1, 2, or 3px
      
      if (isBlack) {
        bars.push(
          <rect key={i} x={currentX} y="5" width={width} height="40" fill="currentColor" />
        );
      }
      currentX += width + 1;
    }

    return (
      <svg viewBox={`0 0 ${currentX + 5} 55`} className="w-full text-slate-800" height="55">
        {bars}
        <text x="50%" y="52" fontSize="7" fontFamily="monospace" textAnchor="middle" fill="currentColor">
          {seed}
        </text>
      </svg>
    );
  };

  // Handle standard page print trigger for the generated tag codes
  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in animate-duration-300">
      {/* 1. LASER SCANNER SIMULATOR */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-6 flex flex-col justify-between animate-none">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
            <Scan size={16} className="text-amber-500" /> POS Laser Barcode Scanner Simulator
          </h3>
          <p className="text-[11px] text-slate-400 mb-6 font-light leading-relaxed">
            Peralatan simulasi pembaca kode barcode barang. Klik salah satu SKU di bawah untuk menyimulasikan pemindaian laser optik pos kasir secara instan dalam iFrame.
          </p>

          {/* Interactive digital optical sight box */}
          <div className="relative h-44 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center overflow-hidden mb-6 shadow-inner shadow-amber-500/5">
            {/* Laser element lines */}
            <div className={`absolute left-0 w-full h-[2px] bg-red-500 shadow-md shadow-red-500/50 ${
              laserBlink ? "animate-bounce" : "opacity-35"
            }`} />

            <div className={`text-center space-y-2 transition-all ${laserBlink ? "scale-95 opacity-50" : ""}`}>
              <BarcodeIcon size={42} className="mx-auto text-slate-500 animate-pulse" />
              <p className="text-[10px] text-slate-400 font-mono">
                {laserBlink ? "[MEMBACA KODE INTEGRITAS CAS]" : "[AWAITING OPTICAL LASER BEAM]"}
              </p>
            </div>
          </div>

          {/* List of barcodes to click & simulated scan */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Pilih SKU untuk Disimulasikan:</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {variants.slice(0, 6).map((v) => (
                <button
                  key={v.id}
                  onClick={() => triggerSimulatedScan(v.barcode)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-850 hover:border-amber-500 hover:text-amber-300 text-slate-300 text-left text-[11px] truncate cursor-pointer font-mono font-bold transition-all"
                >
                  ⚡ {v.sku}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scan metadata result output */}
        {scanResult && (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl mt-6 flex gap-4">
            <img
              src={scanResult.product?.image}
              alt={scanResult.product?.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover border border-slate-850 flex-shrink-0"
            />
            <div className="text-xs space-y-1 overflow-hidden">
              <span className="text-[9px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-amber-550 font-extrabold leading-none">
                {scanResult.product?.brand}
              </span>
              <h4 className="font-bold text-slate-100 truncate">{scanResult.product?.name}</h4>
              <p className="text-slate-400 font-mono text-[10px]">SKU: {scanResult.sku?.sku}</p>
              <p className="text-emerald-400 font-bold font-mono">Retail: Rp {scanResult.sku?.retailPrice.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. BARCODE LABEL GENERATOR & PRINT SHOP */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-6 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
            <Printer size={16} className="text-amber-550" /> Cetak Labelling & Label Harga
          </h3>
          <p className="text-[11px] text-slate-400 mb-4 font-light leading-relaxed">
            Modul cetak stiker label boks kosmetik. Sesuaikan jumlah kopi dan klik Cetak untuk mengeluarkan layout thermal label resmi.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
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

            <div>
              <label className="text-[9px] text-slate-400 font-mono block mb-1">JUMLAH STIKER KOPI</label>
              <input
                type="number"
                min="1"
                max="12"
                value={printCopies}
                onChange={(e) => setPrintCopies(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono text-center"
              />
            </div>
          </div>

          {/* Label print roll preview sheet */}
          {activeSku && activeProduct && (
            <div className="space-y-2 mt-4">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Pratinjau Lembaran Label Thermal:</span>
              
              <div id="printable-area" className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto p-4 bg-white rounded-2xl border border-slate-100 text-black">
                {Array.from({ length: printCopies }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col items-center justify-center text-center space-y-1 shadow-sm text-slate-950"
                  >
                    <span className="text-[7px] font-mono uppercase font-black text-slate-500 block leading-none">
                      {activeProduct.brand} • COSMETICS
                    </span>
                    <span className="text-[8px] font-extrabold max-w-full font-mono truncate block" title={activeProduct.name}>
                      {activeProduct.name}
                    </span>
                    <span className="text-[7px] font-mono text-slate-600 block -mt-1">
                      {activeSku.sku} ({activeSku.size})
                    </span>
                    
                    {/* Render visual SVG vectors barcode */}
                    <div className="w-full py-1 text-black">
                      {renderSVGBarcode(activeSku.barcode)}
                    </div>

                    <span className="text-[9px] font-bold font-mono text-emerald-700 block">
                      Rp {activeSku.retailPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handlePrintLabels}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 mt-6 cursor-pointer hover:scale-[1.01] transition-all"
        >
          <Printer size={14} /> Cetak Stiker Label (Thermal Roll)
        </button>
      </div>
    </div>
  );
};
