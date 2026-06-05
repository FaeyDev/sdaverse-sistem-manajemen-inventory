/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FolderTree, Plus, ChevronRight, Folder, FileCheck, HelpCircle } from "lucide-react";
import { useInventory } from "../InventoryContext";

export const Categories: React.FC = () => {
  const { categories, products, addCategory, currentUser } = useInventory();

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catParentId, setCatParentId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    addCategory(catName, catParentId === "" ? null : catParentId, catDesc);
    setCatName("");
    setCatDesc("");
    setCatParentId(null);
  };

  // Find root nodes
  const rootCategories = categories.filter((c) => c.parentId === null);

  // Helper counting products in category + its children subcategories
  const countProducts = (catId: string): number => {
    // direct product count
    const directArray = products.filter((p) => p.categoryId === catId);
    let count = directArray.length;

    // fetch subcategories
    const subs = categories.filter((c) => c.parentId === catId);
    subs.forEach((sub) => {
      count += countProducts(sub.id);
    });

    return count;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* 1. Category Tree Rendering visual panel */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between animate-none">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
            <FolderTree size={16} className="text-amber-500" /> Arsitektur Hierarki Kategori Kecantikan
          </h3>
          <p className="text-[11px] text-slate-400 mb-6 font-light leading-relaxed">
            Struktur kategori produk skincare & makeup dalam bentuk self-referential tree nodes. Produk baru dapat dipasang langsung ke node subkategori spesifik untuk pembukuan ERP yang akurat.
          </p>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {rootCategories.map((root) => {
              const children = categories.filter((c) => c.parentId === root.id);
              const rootProjCount = countProducts(root.id);

              return (
                <div key={root.id} className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Folder size={16} className="text-amber-500" />
                      <span className="font-bold text-slate-100 text-sm">{root.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {rootProjCount} Master SKU
                    </span>
                  </div>
                  {root.description && (
                    <p className="text-[11px] text-slate-400 ml-6 mt-1 font-light italic">{root.description}</p>
                  )}

                  {/* Render Subcategories */}
                  {children.length > 0 && (
                    <div className="mt-3 ml-6 pl-4 border-l border-slate-800 space-y-2 pt-2">
                      {children.map((child) => {
                        const childCount = products.filter((p) => p.categoryId === child.id).length;
                        return (
                          <div key={child.id} className="flex items-center justify-between py-1 border-b border-slate-800/20">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <ChevronRight size={12} className="text-slate-500" />
                              <FileCheck size={12} className="text-zinc-500" />
                              <span className="font-semibold text-slate-200">{child.name}</span>
                              {child.description && (
                                <span className="text-[10px] text-slate-500 font-light truncate max-w-xs block ml-2">
                                  — {child.description}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded">
                              {childCount} pcs
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 italic mt-6 font-mono leading-relaxed border-t border-slate-800/60 pt-3">
          💡 Setiap kategori root menampung logika recursive. Menghapus kategori induk akan merealokasi anak kategori ke tier root.
        </div>
      </div>

      {/* 2. Add Category Admin Form panel */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-5 h-fit bg-zinc-950/20">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
          <Plus size={16} className="text-amber-550" /> Tambah Kategori Baru
        </h3>

        {currentUser?.role !== "Admin" ? (
          <div className="p-6 bg-slate-800/10 border border-slate-800/60 rounded-2xl text-center text-slate-500 text-xs">
            Akses dikunci. Diperlukan hak otorisasi peran <b>Admin</b> untuk menyusun restrukturisasi database kategori.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">NAMA KATEGORI</label>
              <input
                type="text"
                required
                placeholder="e.g. Eye Shadow, Facial Treatment"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">KATEGORI INDUK (PARENT NODE)</label>
              <select
                value={catParentId || ""}
                onChange={(e) => setCatParentId(e.target.value || null)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">Tidak ada (Jadikan Kategori Utama / Root)</option>
                {/* List only parent categories for safety */}
                {categories.filter(c => c.parentId === null).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">DESKRIPSI INTEGRAL</label>
              <textarea
                placeholder="Deskripsi singkat rumpun segmen pasar kecantikan..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none h-20 resize-none font-sans"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-extrabold text-xs hover:scale-[1.02] duration-200 cursor-pointer shadow-lg shadow-amber-500/10 text-black overflow-hidden"
            >
              Simpan Node Kategori
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
