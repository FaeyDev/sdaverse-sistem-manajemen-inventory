/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  CalendarClock,
  Layers,
  ArrowRightLeft,
  Truck,
  RotateCcw,
  Tag,
  Scan,
  History,
  FolderTree,
  X,
  ChevronLeft,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { useInventory } from "../InventoryContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (col: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed
}) => {
  const { currentUser } = useInventory();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Warehouse Staff", "Cashier"] },
    { id: "products", label: "Produk & Varian", icon: Package, roles: ["Admin", "Warehouse Staff", "Cashier"] },
    { id: "categories", label: "Kategori Tree", icon: FolderTree, roles: ["Admin", "Warehouse Staff"] },
    { id: "stock", label: "Opname & Transaksi", icon: Boxes, roles: ["Admin", "Warehouse Staff", "Cashier"] },
    { id: "batches", label: "Batch & FEFO", icon: CalendarClock, roles: ["Admin", "Warehouse Staff"] },
    { id: "transfers", label: "Multi-Gudang", icon: ArrowRightLeft, roles: ["Admin", "Warehouse Staff"] },
    { id: "suppliers", label: "Suppliers Hub", icon: Truck, roles: ["Admin", "Warehouse Staff"] },
    { id: "returns", label: "Retur Penjualan", icon: RotateCcw, roles: ["Admin", "Warehouse Staff", "Cashier"] },
    { id: "pricing", label: "Pricing & Tier", icon: Tag, roles: ["Admin", "Cashier"] },
    { id: "barcode", label: "Scanner & Label", icon: Scan, roles: ["Admin", "Warehouse Staff", "Cashier"] },
    { id: "audit", label: "Audit Trail", icon: History, roles: ["Admin"] }
  ];

  // Filter based on roles
  const filteredMenu = menuItems.filter(
    (item) => !currentUser || item.roles.includes(currentUser.role)
  );

  return (
    <aside
      className={`glass-panel border-r border-slate-800 h-screen transition-all duration-300 relative flex flex-col z-30 ${
        collapsed ? "w-16 sm:w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-black text-black shadow-lg shadow-amber-500/10">
              S
            </div>
            <div>
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200 tracking-wider text-base">
                SDAVerse
              </span>
              <span className="font-light text-zinc-400 text-[10px] block -mt-1 tracking-wider uppercase">
                INVENTORY ERP
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-black text-black mx-auto">
            S
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden sm:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-850 items-center justify-center text-zinc-400 hover:text-amber-400 transition-colors"
          id="sidebar-toggle"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Staff profile summary */}
      {!collapsed && currentUser && (
        <div className="p-4 mx-3 my-4 rounded-xl bg-zinc-950/40 border border-zinc-900/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-amber-550 flex items-center justify-center font-bold text-amber-400 shadow-sm">
            {currentUser.fullname.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-zinc-200 truncate">{currentUser.fullname}</h4>
            <div className="flex items-center gap-1">
              <UserCheck size={11} className="text-amber-500" />
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest leading-none">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-2 py-3 space-y-1.5 overflow-y-auto">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-250 ${
                isActive
                  ? "bg-gradient-to-r from-amber-500/15 via-zinc-800/10 to-transparent text-amber-400 border-l-4 border-amber-550 font-semibold"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/35"
              }`}
              title={collapsed ? item.label : undefined}
              id={`sidebar-link-${item.id}`}
            >
              <Icon
                size={18}
                className={`flex-shrink-0 transition-transform ${
                  isActive ? "text-amber-400 scale-110 glow-text" : "text-zinc-400"
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer block */}
      {!collapsed && (
        <div className="p-4 border-t border-zinc-850/60 text-center">
          <p className="text-[10px] text-zinc-650 font-mono">EST. 2026 • SDAVerse</p>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1.5 animate-pulse" />
          <span className="text-[10px] text-zinc-400">Server Online</span>
        </div>
      )}
    </aside>
  );
};
