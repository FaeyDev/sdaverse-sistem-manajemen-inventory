/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Bell,
  Search,
  LogOut,
  User,
  Shield,
  Eye,
  CheckCheck,
  AlertTriangle,
  FolderSync,
  Clock
} from "lucide-react";
import { useInventory } from "../InventoryContext";

interface TopbarProps {
  onSearch: (q: string) => void;
  activeTab: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onSearch, activeTab }) => {
  const {
    currentUser,
    notifications,
    users,
    login,
    logout,
    showToast
  } = useInventory();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  // Quick switch role handler
  const handleRoleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    if (currentUser) {
      const ok = login(currentUser.username, role);
      if (ok) {
        showToast(`Beralih peran ke: ${role}`, "info");
      }
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard Utama";
      case "products":
        return "Manajemen Produk & Varian SKU";
      case "categories":
        return "Arsitektur Kategori Hierarki";
      case "stock":
        return "Mutasi Stok & Opname Fisik";
      case "batches":
        return "Inventori Batch & FEFO Suggestion";
      case "transfers":
        return "Alokasi Multi-Gudang";
      case "suppliers":
        return "Pemasok & Suppliers Hub";
      case "returns":
        return "Retur Barang & Penjualan";
      case "pricing":
        return "Clearance Engine & Multi-Tier Pricing";
      case "barcode":
        return "Scanner Kamera & Label Barcode";
      case "audit":
        return "Log Audit Sistem ERP";
      default:
        return "Sistem Manajemen Inventori";
    }
  };

  return (
    <header className="glass-panel border-b border-zinc-850/60 h-16 px-6 flex items-center justify-between relative z-20">
      {/* Title block */}
      <div className="flex items-center gap-3">
        <h2 className="text-md sm:text-lg font-bold tracking-tight text-white uppercase font-mono">
          {getPageTitle()}
        </h2>
        <span className="hidden md:inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
      </div>

      {/* Center Search bar */}
      <div className="hidden lg:flex items-center gap-2 max-w-md w-72 relative">
        <Search size={15} className="absolute left-3 text-zinc-400" />
        <input
          type="text"
          placeholder="Cari SKU, Barcode, Produk..."
          value={searchVal}
          onChange={(e) => {
            setSearchVal(e.target.value);
            onSearch(e.target.value);
          }}
          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-white placeholder-zinc-550 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Role Quick Switch Emulator */}
        {currentUser && (
          <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl px-2 py-1">
            <Shield size={12} className="text-amber-400" />
            <span className="text-[10px] uppercase text-zinc-400 font-mono hidden sm:inline">Role:</span>
            <select
              value={currentUser.role}
              onChange={handleRoleSwitch}
              className="bg-transparent border-none text-[11px] font-bold text-zinc-100 outline-none cursor-pointer font-mono"
            >
              <option value="Admin" className="bg-zinc-900 text-zinc-100">ADMIN</option>
              <option value="Warehouse Staff" className="bg-zinc-900 text-zinc-100">STAFF</option>
              <option value="Cashier" className="bg-zinc-900 text-zinc-100">CASHIER</option>
            </select>
          </div>
        )}

        {/* Notifications Alert Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:border-amber-500 hover:text-amber-400 text-zinc-300 transition-colors relative"
            id="notification-bell"
          >
            <Bell size={16} />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-extrabold flex items-center justify-center text-black animate-bounce">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {/* Quick Notifications dropdown list */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950 border border-zinc-850 shadow-2xl p-4 z-40 text-left">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                <span className="text-xs font-bold text-white uppercase font-mono">
                  Notifikasi Sistem ({unreadNotifs.length})
                </span>
                <span className="text-[10px] text-zinc-400">Time-Simulated (2026)</span>
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  Tidak ada notifikasi aktif.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border flex gap-2.5 transition-colors ${
                        n.isRead
                          ? "bg-zinc-950/40 border-zinc-900 text-zinc-400"
                          : "bg-amber-500/5 border-amber-550/20 text-zinc-200"
                      }`}
                    >
                      <AlertTriangle
                        size={14}
                        className={`mt-0.5 flex-shrink-0 ${
                          n.type === "Low Stock"
                            ? "text-amber-400"
                            : n.type === "Expired Locked"
                            ? "text-red-500"
                            : "text-amber-500"
                        }`}
                      />
                      <div className="text-[11px] leading-relaxed">
                        <p className="font-semibold text-zinc-200">{n.title}</p>
                        <p className="text-zinc-400 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-zinc-500 block mt-1 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2.5 border-t border-zinc-900 pt-2 flex justify-end">
                <button
                  onClick={() => setShowNotifMenu(false)}
                  className="px-2.5 py-1 text-[10px] rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium"
                >
                  Tutup Panel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User profile Action */}
        <div className="flex items-center gap-2 border-l border-zinc-850 pl-4">
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-red-500/10 hover:border-red-500 text-zinc-400 hover:text-red-400 transition-colors"
            title="Keluar / Logout"
            id="logout-button"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
