<?php
// views/suppliers/index.php

require_once __DIR__ . '/../../core/Database.php';
require_once __DIR__ . '/../../core/Middleware.php';
require_once __DIR__ . '/../../views/layouts/app.php';
require_once __DIR__ . '/../../core/AuditLog.php';

Middleware::auth();

$db = Database::connect();
$success = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $contactPerson = trim($_POST['contact_person'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $address = trim($_POST['address'] ?? '');

    if (empty($name) || empty($contactPerson)) {
        $error = 'Nama perusahaan dan Contact Person wajib diisi!';
    } else {
        try {
            $stmt = $db->prepare("INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (:name, :contact_person, :phone, :email, :address)");
            $stmt->execute([
                'name' => $name,
                'contact_person' => $contactPerson,
                'phone' => $phone,
                'email' => $email,
                'address' => $address
            ]);
            $success = 'Supplier "' . htmlspecialchars($name) . '" berhasil didaftarkan!';
            AuditLog::write('Tambah Supplier', 'Daftar supplier baru: ' . $name);
        } catch (PDOException $e) {
            $error = 'Gagal menyimpan supplier: ' . $e->getMessage();
        }
    }
}

// Ambil semua supplier
$suppliers = $db->query("SELECT * FROM suppliers ORDER BY id DESC")->fetchAll();

ob_start();
?>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
    <!-- LEFT: Suppliers directory -->
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-12 lg:col-span-7">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3">
            🏢 Direktori Supplier & Pemasok Kosmetik
        </h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <?php if (empty($suppliers)): ?>
                <div class="col-span-full text-center p-8 text-slate-500 italic bg-slate-900/20 border border-slate-850 rounded-2xl text-xs">
                    Belum ada supplier yang terdaftar.
                </div>
            <?php else: ?>
                <?php foreach ($suppliers as $s): ?>
                    <div class="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl relative overflow-hidden">
                        <h4 class="text-xs font-bold text-slate-100 flex items-center gap-1.5 justify-between">
                            <span><?= htmlspecialchars($s['name']) ?></span>
                            <span class="text-[9px] font-mono font-bold bg-slate-800 text-amber-500 px-1.5 py-0.5 rounded border border-slate-750">ID: <?= $s['id'] ?></span>
                        </h4>
                        <p class="text-[10px] text-slate-400 font-light mt-2 mr-1">PIC: <strong class="text-slate-250"><?= htmlspecialchars($s['contact_person']) ?></strong></p>
                        <p class="text-[10px] text-slate-400 font-light mt-0.5">TELP: <strong class="text-slate-255"><?= htmlspecialchars($s['phone'] ?? '-') ?></strong></p>
                        <p class="text-[10px] text-slate-400 font-light mt-0.5">EMAIL: <strong class="text-slate-255"><?= htmlspecialchars($s['email'] ?? '-') ?></strong></p>
                        <span class="text-[9px] text-slate-500 block mt-3 truncate"><?= htmlspecialchars($s['address'] ?? 'Alamat resmi belum diunggah.') ?></span>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <!-- RIGHT: Add supplier form -->
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-12 lg:col-span-5 h-fit">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3 text-amber-500">
            ➕ Daftarkan Supplier Baru
        </h3>
        <p class="text-[11px] text-slate-400 mb-4 leading-relaxed font-light text-justify">
            Daftarkan perusahaan pemasok luar negeri, maklon kecantikan lokal, atau distributor regional baru untuk pencatatan restock multi-batch pada dashboard gudang.
        </p>

        <?php if ($success): ?>
            <div class="mb-4 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs text-center font-medium">
                <?= htmlspecialchars($success) ?>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="mb-4 p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-red-500 text-xs text-center font-medium">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="" class="space-y-4">
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">NAMA PT / PERUSAHAAN</label>
                <input type="text" name="name" required placeholder="Contoh: PT Beauty Global Indonesia" class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">CONTACT PERSON</label>
                    <input type="text" name="contact_person" required placeholder="Nama PIC" class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                </div>
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">TLPN MOBILE</label>
                    <input type="text" name="phone" placeholder="Contoh: 0812..." class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                </div>
            </div>
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">EMAIL PEMASOK</label>
                <input type="email" name="email" placeholder="Contoh: sales@beauty.co" class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
            </div>
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">ALAMAT RESPONDEN</label>
                <textarea rows="2" name="address" placeholder="Detail alamat resmi..." class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"></textarea>
            </div>
            <button type="submit" class="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-xs text-black rounded-xl hover:brightness-110 transition cursor-pointer">
                Daftarkan Pemasok Resmi
            </button>
        </form>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Direktori Supplier & Pemasok', $content, 'suppliers');
?>
