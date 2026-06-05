/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Shield, Sparkles, User, Key, UserCheck, ToggleLeft } from "lucide-react";
import { useInventory } from "../InventoryContext";

export const Auth: React.FC = () => {
  const { login, registerUser, users } = useInventory();

  const [registerMode, setRegisterMode] = useState(false);

  // Login variables
  const [logUsername, setLogUsername] = useState("admin");
  const [logRole, setLogRole] = useState("Admin");

  // Register variables
  const [regFullname, setRegFullname] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState("Warehouse Staff");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logUsername) return;
    login(logUsername, logRole);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regFullname) return;
    const ok = registerUser(regFullname, regUsername, regEmail, regRole);
    if (ok) {
      setRegisterMode(false);
      setLogUsername(regUsername);
      setLogRole(regRole);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#030303]">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-zinc-500/5 blur-3xl animate-pulse" />

      {/* Main card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-zinc-800 shadow-2xl relative z-10 bg-zinc-950/40">
        
        {/* Brand logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-black text-black shadow-xl shadow-amber-500/10 mx-auto mb-3 text-lg">
            S
          </div>
          <h2 className="text-2xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500">
            SDAVerse
          </h2>
          <p className="text-[11px] text-zinc-400 mt-1.5 tracking-widest uppercase">
            PREMIUM INVENTORY PLATFORM
          </p>
        </div>

        {/* LOGIN FORM */}
        {!registerMode ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1 uppercase tracking-wider">PILIH LOGIN USERNAME</label>
              <select
                value={logUsername}
                onChange={(e) => {
                  setLogUsername(e.target.value);
                  const found = users.find(u => u.username === e.target.value);
                  if (found) setLogRole(found.role);
                }}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50 transition-colors"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.username} className="bg-zinc-950">
                    {u.fullname} (@{u.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1 uppercase tracking-wider">LOG AS ROLE EMULATION</label>
              <select
                value={logRole}
                onChange={(e) => setLogRole(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-amber-500/50 transition-colors"
              >
                <option value="Admin" className="bg-zinc-950">Admin (Full write rights)</option>
                <option value="Warehouse Staff" className="bg-zinc-950">Warehouse Staff (Restock, Opname)</option>
                <option value="Cashier" className="bg-zinc-950">Cashier (POS sells, stock checks)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 font-bold text-xs hover:scale-[1.01] duration-200 cursor-pointer shadow-lg shadow-amber-500/5 text-black hover:from-amber-350 hover:to-amber-450 mt-6"
            >
              Masuk ke Dashboard ERP
            </button>

            <p className="text-center text-[11px] text-zinc-500 mt-6 font-light">
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => setRegisterMode(true)}
                className="text-amber-500 font-bold underline hover:text-amber-400"
              >
                Registrasi Staff Baru
              </button>
            </p>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1 uppercase tracking-wider">NAMA LENGKAP STAFF</label>
              <input
                type="text"
                required
                placeholder="e.g. M. Iqbal Maulana"
                value={regFullname}
                onChange={(e) => setRegFullname(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono block mb-1 uppercase tracking-wider">USERNAME UNIK</label>
              <input
                type="text"
                required
                placeholder="e.g. iqbal_staff"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-400 font-mono block mb-1 uppercase tracking-wider">EMAIL UTAMA</label>
                <input
                  type="email"
                  required
                  placeholder="name@beauty.co.id"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-mono block mb-1 uppercase tracking-wider">ALOKASI PERAN (ROLE)</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-zinc-955 border border-zinc-850 rounded-xl px-2.5 py-2 text-xs text-zinc-300 focus:border-amber-500/50 outline-none"
                >
                  <option value="Admin" className="bg-zinc-950">Administrator</option>
                  <option value="Warehouse Staff" className="bg-zinc-950">Staff Gudang</option>
                  <option value="Cashier" className="bg-zinc-950">Kasir POS Retail</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 font-bold text-xs hover:scale-[1.01] duration-200 cursor-pointer text-black shadow-lg shadow-amber-500/5 focus:outline-none"
            >
              Daftarkan Staff Baru
            </button>

            <p className="text-center text-[11px] text-zinc-500 mt-6 font-light">
              Sudah terdaftar?{" "}
              <button
                type="button"
                onClick={() => setRegisterMode(false)}
                className="text-amber-500 font-bold underline hover:text-amber-400"
              >
                Log In Disini
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
