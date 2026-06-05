<?php
// views/batches/index.php

require_once __DIR__ . '/../../core/Database.php';
require_once __DIR__ . '/../../core/Middleware.php';
require_once __DIR__ . '/../../views/layouts/app.php';
require_once __DIR__ . '/../../core/AuditLog.php';

Middleware::auth();

$db = Database::connect();
$success = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $batchNumber = trim($_POST['batch_number'] ?? '');
    $productionDate = trim($_POST['production_date'] ?? '');
    $expiryDate = trim($_POST['expiry_date'] ?? '');

    if (empty($batchNumber) || empty($productionDate) || empty($expiryDate)) {
        $error = 'Nomor batch, tanggal produksi, dan tanggal expiry wajib diisi!';
    } else {
        try {
            $stmt = $db->prepare("INSERT INTO batches (batch_number, production_date, expiry_date, is_locked) VALUES (:batch_number, :production_date, :expiry_date, 0)");
            $stmt->execute([
                'batch_number' => $batchNumber,
                'production_date' => $productionDate,
                'expiry_date' => $expiryDate
            ]);
            $success = 'Lot batch "' . htmlspecialchars($batchNumber) . '" berhasil disimpan!';
            AuditLog::write('Tambah Batch', 'Daftar batch produksi baru: ' . $batchNumber);
        } catch (PDOException $e) {
            $error = 'Gagal menyimpan batch: ' . $e->getMessage();
        }
    }
}

// Ambil semua batch aktif diurutkan berdasarkan kedaluarsa (FEFO)
$stmt = $db->query("SELECT * FROM batches ORDER BY expiry_date ASC");
$batches = $stmt->fetchAll();

ob_start();
?>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-7">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3">
            📅 Manajemen Lot & Batch Produksi (FEFO Track)
        </h3>
        
        <div class="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            <?php if (empty($batches)): ?>
                <div class="text-center p-8 text-slate-500 italic bg-slate-900/20 border border-slate-850 rounded-2xl">
                    Tidak ada batch aktif.
                </div>
            <?php else: ?>
                <?php foreach ($batches as $b): ?>
                    <div class="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl flex justify-between items-center">
                        <div>
                            <span class="text-xs font-mono font-bold text-amber-500 block"><?= htmlspecialchars($b['batch_number']) ?></span>
                            <span class="text-[9px] text-slate-500 font-mono">PROD: <?= htmlspecialchars($b['production_date']) ?> | EXP: <span class="text-red-400 font-bold"><?= htmlspecialchars($b['expiry_date']) ?></span></span>
                        </div>
                        <div>
                            <?php if ($b['is_locked']): ?>
                                <span class="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/15">AUTO-LOCKED (EXP)</span>
                            <?php else: ?>
                                <span class="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">AMAN (ACTIVE)</span>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-5 h-fit">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3 text-amber-500">
            ➕ Daftarkan Lot Batch Baru
        </h3>
        <p class="text-[11px] text-slate-400 mb-4 leading-relaxed font-light text-justify">
            Gunakan fungsionalitas ini saat barang masuk dari pabrik / importir. Pencatatan lot lot manufaktur sangat esensial untuk melacak siklus usang produk kecantikan.
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
                <label class="text-[9px] text-slate-400 font-mono block mb-1">NOMOR BATCH (LOT NUMBER)</label>
                <input type="text" name="batch_number" required placeholder="Contoh: BATCH-LPT-042" class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">TANGGAL PRODUKSI</label>
                    <input type="date" name="production_date" required class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500">
                </div>
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">TANGGAL EXPIRY</label>
                    <input type="date" name="expiry_date" required class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500">
                </div>
            </div>
            <button type="submit" class="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-xs text-black rounded-xl hover:brightness-110 transition cursor-pointer">
                Simpan Lot Batch
            </button>
        </form>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Sistem Lot & Expatriation FEFO', $content, 'batches');
?>
