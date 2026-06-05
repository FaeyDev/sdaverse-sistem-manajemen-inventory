/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, Truck, Building2, Phone, Mail, MapPin, Sparkles, FileSpreadsheet } from "lucide-react";
import { useInventory } from "../InventoryContext";

export const Suppliers: React.FC = () => {
  const { suppliers, addSupplier, currentUser } = useInventory();

  // Form states
  const [name, setName] = useState("");
  const [cp, setCp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cp) return;
    addSupplier({ name, contactPerson: cp, phone, email, address });
    setName("");
    setCp("");
    setPhone("");
    setEmail("");
    setAddress("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* LEFT: Suppliers list directory */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-7">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
          <Truck size={16} className="text-amber-500" /> Direktori Supplier & Pemasok Kosmetik
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
          {suppliers.map((s) => (
            <div key={s.id} className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Building2 size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">{s.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">PIC: {s.contactPerson}</span>
                </div>
              </div>

              <div className="space-y-1 text-slate-400 text-xs">
                {s.phone && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Phone size={12} className="text-slate-500" /> {s.phone}
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-1.5 font-mono">
                    <Mail size={12} className="text-slate-500" /> {s.email}
                  </div>
                )}
                {s.address && (
                  <div className="flex items-start gap-1.5 leading-relaxed font-light mt-1">
                    <MapPin size={12} className="text-slate-500 flex-shrink-0 mt-0.5" />
                    <span>{s.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Add supplier admin form */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 lg:col-span-5 h-fit">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
          <Plus size={16} className="text-amber-550" /> Daftarkan Supplier Baru
        </h3>

        {currentUser?.role !== "Admin" ? (
          <div className="p-6 bg-slate-800/10 border border-slate-800/60 rounded-2xl text-center text-slate-500 text-xs">
            Akses diblokir. Diperlukan peran otorisasi <b>Admin</b> untuk mengubah relasi pendaftaran supplier.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">NAMA PERUSAHAAN / DISTRIBUTOR</label>
              <input
                type="text"
                required
                placeholder="e.g. PT Cosrx Indonesia, Romand Official ID"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">CONTACT PERSON (PIC NYATA)</label>
              <input
                type="text"
                required
                placeholder="e.g. Diana Hartati"
                value={cp}
                onChange={(e) => setCp(e.target.value)}
                className="w-full bg-slate-955 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">TELP / WHATSAPP</label>
                <input
                  type="text"
                  placeholder="e.g. 0812XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">EMAIL RESMI</label>
                <input
                  type="email"
                  placeholder="e.g. contact@distributor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">ALAMAT GUDANG DISTRIBUSI</label>
              <textarea
                placeholder="Alamat lengkap distributor"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white h-16 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-extrabold text-xs hover:scale-[1.02] duration-200 shadow-md text-black transition-all"
            >
              Daftarkan Supplier
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
