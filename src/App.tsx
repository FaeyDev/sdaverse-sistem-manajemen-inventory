/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { InventoryProvider, useInventory } from "./InventoryContext";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./components/Dashboard";
import { Products } from "./components/Products";
import { Categories } from "./components/Categories";
import { StockOpname } from "./components/StockOpname";
import { Batches } from "./components/Batches";
import { Transfers } from "./components/Transfers";
import { Suppliers } from "./components/Suppliers";
import { Returns } from "./components/Returns";
import { PricingRules } from "./components/PricingRules";
import { BarcodeScanner } from "./components/BarcodeScanner";
import { AuditTrail } from "./components/AuditTrail";
import { Auth } from "./components/Auth";
import { Sparkles, X, ShieldAlert, AlertTriangle } from "lucide-react";

const AppContent: React.FC = () => {
  const { currentUser, toasts, removeToast } = useInventory();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!currentUser) {
    return <Auth />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "products":
        return <Products />;
      case "categories":
        return <Categories />;
      case "stock":
        return <StockOpname />;
      case "batches":
        return <Batches />;
      case "transfers":
        return <Transfers />;
      case "suppliers":
        return <Suppliers />;
      case "returns":
        return <Returns />;
      case "pricing":
        return <PricingRules />;
      case "barcode":
        return <BarcodeScanner />;
      case "audit":
        return <AuditTrail />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#070b13] text-slate-100 font-sans">
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* 2. MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar header */}
        <Topbar onSearch={setSearchQuery} activeTab={activeTab} />

        {/* Outer content container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#080d17]/40 relative">
          {/* Main content body */}
          <div className="max-w-7xl mx-auto h-full">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* 3. FLOATING ACTION TOAST ALERTS OVERLAY */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-center justify-between gap-3 text-xs w-full animate-fade-in transition-all ${
              toast.type === "success"
                ? "bg-slate-900/90 border-emerald-500/25 text-emerald-300"
                : toast.type === "error"
                ? "bg-slate-900/90 border-red-500/25 text-red-400"
                : "bg-slate-900/90 border-amber-500/25 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="flex-shrink-0 animate-spin" />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded"
              title="Close toast"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
