/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  SlidersHorizontal,
  Package,
  Layers,
  Sparkles,
  Barcode,
  Eye,
  Info,
  DollarSign,
  Boxes,
  Compass,
  Undo2
} from "lucide-react";
import { useInventory } from "../InventoryContext";
import { Product, Variant } from "../types";

export const Products: React.FC = () => {
  const {
    products,
    variants,
    categories,
    batchStock,
    addProduct,
    updateProduct,
    deleteProduct,
    addVariant,
    updateVariant,
    currentUser,
    pricingRules
  } = useInventory();

  // Filter/Search states
  const [searchVal, setSearchVal] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  // Modal / Form states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  
  // Product Form Fields
  const [pName, setPName] = useState("");
  const [pBrand, setPBrand] = useState("");
  const [pCatId, setPCatId] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pImage, setPImage] = useState("");

  // Selected Product Details Drawer
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);
  
  // Variant Form Fields
  const [vSku, setVSku] = useState("");
  const [vBarcode, setVBarcode] = useState("");
  const [vName, setVName] = useState("");
  const [vSize, setVSize] = useState("");
  const [vRetail, setVRetail] = useState(0);
  const [vReseller, setVReseller] = useState(0);
  const [vWholesale, setVWholesale] = useState(0);
  const [vSupplier, setVSupplier] = useState(0);
  const [vMinThreshold, setVMinThreshold] = useState(10);

  const beautyImagePresets = [
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=400",
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400"
  ];

  // List unique brands for filters
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand)));

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchVal.toLowerCase()) ||
                          p.brand.toLowerCase().includes(searchVal.toLowerCase());
    const matchesBrand = selectedBrand === "" || p.brand === selectedBrand;
    const matchesCat = selectedCat === "" || p.categoryId === selectedCat;
    return matchesSearch && matchesBrand && matchesCat;
  });

  const handleOpenAddModal = () => {
    setEditingProd(null);
    setPName("");
    setPBrand("");
    setPCatId(categories[0]?.id || "");
    setPDesc("");
    setPImage(beautyImagePresets[0]);
    setShowProductModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProd(p);
    setPName(p.name);
    setPBrand(p.brand);
    setPCatId(p.categoryId);
    setPDesc(p.description);
    setPImage(p.image);
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pBrand || !pCatId) return;

    if (editingProd) {
      updateProduct(editingProd.id, pName, pCatId, pBrand, pDesc, pImage);
    } else {
      addProduct(pName, pCatId, pBrand, pDesc, pImage);
    }
    setShowProductModal(false);
  };

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd || !vSku || !vName) return;

    addVariant({
      productId: selectedProd.id,
      sku: vSku,
      barcode: vBarcode || Math.floor(Math.random() * 8000000000000 + 1000000000000).toString(),
      name: vName,
      size: vSize || "Standard",
      retailPrice: vRetail || 10000,
      resellerPrice: vReseller || vRetail,
      wholesalePrice: vWholesale || vRetail,
      supplierPrice: vSupplier || 5000,
      minStockThreshold: vMinThreshold
    });

    setShowVariantModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Toolbar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Text Search Input */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari brand, nama produk..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">Semua Brand</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {currentUser?.role === "Admin" && (
          <button
            onClick={handleOpenAddModal}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:scale-105 duration-200 shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Plus size={15} /> Tambah Master Produk
          </button>
        )}
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((p) => {
          const varList = variants.filter((v) => v.productId === p.id);
          const catName = categories.find((c) => c.id === p.categoryId)?.name || "Lainnya";
          
          // Calculate total units inside all active warehouses
          const totalQty = varList.reduce((sum, v) => {
            return (
              sum +
              batchStock
                .filter((bs) => bs.variantId === v.id && bs.warehouseId !== "wh-3")
                .reduce((s, bs) => s + bs.quantity, 0)
            );
          }, 0);

          return (
            <div
              key={p.id}
              className="glass-panel rounded-2xl overflow-hidden border border-zinc-850 hover:border-amber-500/30 group duration-300 transform hover:-translate-y-1 relative"
            >
              {/* Product Thumbnail Banner */}
              <div className="h-40 relative bg-slate-800 overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <span className="absolute top-2.5 left-2.5 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black tracking-widest leading-none font-sans">
                  {p.brand}
                </span>
                <span className="absolute top-2.5 right-2.5 text-[9px] font-mono uppercase bg-slate-900/90 text-slate-300 border border-slate-700 rounded-md px-1.5 py-0.5 leading-none">
                  {catName}
                </span>
              </div>

              {/* Body Content */}
              <div className="p-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 h-8 font-light">
                    {p.description || "Tidak ada deskripsi rinci ditambahkan."}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">STOK READY</span>
                    <span className="font-bold text-slate-200">
                      {totalQty} <span className="text-[10px] font-normal text-slate-400">pcs</span>
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">SKU VARIASI</span>
                    <span className="font-semibold text-slate-300">{varList.length} shade/size</span>
                  </div>
                </div>

                {/* Actions banner */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedProd(p)}
                    className="flex-1 py-1.5 rounded-xl border border-slate-750 bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Boxes size={13} /> Kelola Varian
                  </button>

                  {currentUser?.role === "Admin" && (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/20 transition-all cursor-pointer"
                        title="Edit Master Produk"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-all cursor-pointer"
                        title="Hapus Master Produk"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SELECTED PRODUCT DETAILS DRAWER / SIDE SHEET */}
      {selectedProd && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-4xl bg-[#0b0f19] border-l border-slate-850 h-screen p-6 overflow-y-auto flex flex-col justify-between shadow-2xl relative">
            <button
              onClick={() => setSelectedProd(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
            >
              Tutup Panel (ESC)
            </button>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Package size={24} className="text-amber-500" />
                <div>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block font-mono">
                    {selectedProd.brand}
                  </span>
                  <h3 className="text-xl font-bold text-white">{selectedProd.name}</h3>
                </div>
              </div>

              {/* Variants table */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase font-mono">Daftar SKU Varian Terdaftar:</h4>
                  {currentUser?.role === "Admin" && (
                    <button
                      onClick={() => {
                        setVSku(`SKU-${selectedProd.brand.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`);
                        setVBarcode("");
                        setVName("");
                        setVSize("");
                        setVRetail(0);
                        setVReseller(0);
                        setVWholesale(0);
                        setVSupplier(0);
                        setVMinThreshold(10);
                        setShowVariantModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-400 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Plus size={12} /> Tambah SKU Varian
                    </button>
                  )}
                </div>

                <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-900/40">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Info Varian SKU</th>
                        <th className="p-3">Barcode</th>
                        <th className="p-3 text-right">Harga Pokok (COGS)</th>
                        <th className="p-3 text-right">Eceran Retail</th>
                        <th className="p-3 text-right">Harga Reseller</th>
                        <th className="p-3 text-right">Grosir / Bulk</th>
                        <th className="p-3 text-center">Stok Threshold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {variants
                        .filter((v) => v.productId === selectedProd.id)
                        .map((v) => (
                          <tr key={v.id} className="hover:bg-slate-800/20 text-slate-200">
                            <td className="p-3">
                              <span className="font-mono text-amber-500 block">{v.sku}</span>
                              <span className="text-slate-400">{v.name} ({v.size})</span>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                                <Barcode size={11} className="text-slate-500" /> {v.barcode}
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-300 font-mono">
                              Rp {v.supplierPrice.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-emerald-400 font-mono">
                              Rp {v.retailPrice.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-amber-400 font-mono">
                              Rp {v.resellerPrice.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-blue-400 font-mono">
                              Rp {v.wholesalePrice.toLocaleString()}
                            </td>
                            <td className="p-3 text-center text-slate-400 font-mono">
                              {v.minStockThreshold} pcs
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-800 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedProd(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs transition"
              >
                Selesai & Tutup Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 p-6 relative">
            <h3 className="text-md font-bold text-white mb-3 flex items-center gap-1.5 font-mono">
              <Sparkles size={16} className="text-amber-500" />
              {editingProd ? "EDIT MASTER PRODUK" : "TAMBAH MASTER PRODUK BARU"}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">BRAND</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cosrx, ESQA"
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">KATEGORI</label>
                  <select
                    value={pCatId}
                    onChange={(e) => setPCatId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">NAMA PRODUK</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Niacinamide Serum, Aloe Moisturizer"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">DESKRIPSI INTEGRAL</label>
                <textarea
                  placeholder="Deskripsi singkat produk untuk informasi staff"
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none h-16 resize-none"
                />
              </div>

              {/* Beauty Illustration Preset Thumbnails selector */}
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1.5">PILIH PRESET FOTO KOSMETIK</label>
                <div className="grid grid-cols-6 gap-2">
                  {beautyImagePresets.map((img) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setPImage(img)}
                      className={`h-11 rounded-lg overflow-hidden border ${
                        pImage === img ? "border-amber-500 border-2" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt="Preset cosmetic visual thumbnail" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-755 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Simpan Master Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SKU VARIANT MODAL */}
      {showVariantModal && selectedProd && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 p-6 relative">
            <h3 className="text-xs font-bold text-amber-500 mb-1 uppercase font-mono tracking-widest">
              PRODUK: {selectedProd.name}
            </h3>
            <h2 className="text-md font-bold text-white mb-4 flex items-center gap-1">
              <Plus size={16} /> TAMBAH SKU VARIAN BARU
            </h2>

            <form onSubmit={handleAddVariant} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-0.5">SKU ID (KODE UNIK)</label>
                  <input
                    type="text"
                    required
                    value={vSku}
                    onChange={(e) => setVSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-0.5">BARCODE (EAN-13)</label>
                  <input
                    type="text"
                    placeholder="Auto-generate bila kosong"
                    value={vBarcode}
                    onChange={(e) => setVBarcode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-0.5">NAMA VARIASI (E.G. SHADE FIGFIG)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shade 06 Figfig, Aloe Extreme"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-0.5">UKURAN / VOLUME</label>
                  <input
                    type="text"
                    placeholder="e.g. 50ml, 15g, Standard"
                    value={vSize}
                    onChange={(e) => setVSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-0.5">COGS DISTRIBUTOR</label>
                  <input
                    type="number"
                    value={vSupplier}
                    onChange={(e) => setVSupplier(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-0.5 font-semibold text-amber-400">ECERAN (RETAIL)</label>
                  <input
                    type="number"
                    value={vRetail}
                    onChange={(e) => setVRetail(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-0.5">RESELLER CODE</label>
                  <input
                    type="number"
                    value={vReseller}
                    onChange={(e) => setVReseller(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-mono block mb-0.5">WHOLESALE PRICE</label>
                  <input
                    type="number"
                    value={vWholesale}
                    onChange={(e) => setVWholesale(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-0.5">BATAS MINIMUM ALERT STOCK</label>
                <input
                   type="number"
                   value={vMinThreshold}
                   onChange={(e) => setVMinThreshold(parseInt(e.target.value) || 0)}
                   className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Simpan SKU Varian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
