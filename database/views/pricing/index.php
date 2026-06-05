<?php
// views/pricing/index.php

require_once __DIR__ . '/../../core/Database.php';
require_once __DIR__ . '/../../core/Middleware.php';
require_once __DIR__ . '/../../views/layouts/app.php';
require_once __DIR__ . '/../../core/AuditLog.php';

Middleware::auth();

$db = Database::connect();
$success = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'toggle') {
        $ruleId = (int)($_POST['rule_id'] ?? 0);
        try {
            $stmt = $db->prepare("UPDATE pricing_rules SET is_active = 1 - is_active WHERE id = :id");
            $stmt->execute(['id' => $ruleId]);
            $success = 'Status keaktifan aturan promosi berhasil diperbarui!';
            AuditLog::write('Ubah Status Aturan Harga', 'Mengubah status aturan harga ID: ' . $ruleId);
        } catch (PDOException $e) {
            $error = 'Gagal mengubah status: ' . $e->getMessage();
        }
    } elseif ($action === 'add_rule') {
        try {
            $name = trim($_POST['name'] ?? '');
            $months = (int)($_POST['near_expiry_months'] ?? 3);
            $discount = (float)($_POST['discount_percent'] ?? 10);
            $desc = trim($_POST['description'] ?? '');

            if (empty($name)) {
                $error = 'Nama aturan promosi wajib diisi!';
            } else {
                $stmtIns = $db->prepare("INSERT INTO pricing_rules (name, type, near_expiry_months, discount_percent, description, is_active) VALUES (:name, 'Clearance (Near-Expiry)', :months, :discount, :desc, 1)");
                $stmtIns->execute([
                    'name' => $name,
                    'months' => $months,
                    'discount' => $discount,
                    'desc' => $desc
                ]);
                $success = 'Aturan promosi near-expiry baru berhasil disimpan!';
                AuditLog::write('Tambah Aturan Harga', 'Menambah aturan harga promo baru: ' . $name);
            }
        } catch (PDOException $e) {
            $error = 'Gagal mendaftarkan aturan baru: ' . $e->getMessage();
        }
    }
}

// Ambil aturan pemangkasan harga otomatis di DB
$rules = $db->query("SELECT * FROM pricing_rules ORDER BY id ASC")->fetchAll();

// Ambil matrix multi-tier harga varian produk kosmetik
$stmtVariants = $db->query("
    SELECT pv.*, p.name as product_name, p.brand
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    ORDER BY pv.id ASC
");
$variants = $stmtVariants->fetchAll();

ob_start();
?>
<div class="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
    <!-- LEFT: Pricing rules list -->
    <div class="glass-panel p-6 rounded-3xl xl:col-span-5 h-fit">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3 text-amber-500">
            🏷️ Aturan Promosi FEFO (Near-Expiry)
        </h3>

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
        
        <div class="space-y-4 mb-6">
            <?php foreach ($rules as $r): ?>
                <div class="p-4 bg-slate-900/40 border <?= $r['is_active'] ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-850' ?> rounded-2xl relative">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-bold text-slate-100"><?= htmlspecialchars($r['name']) ?></span>
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold <?= $r['is_active'] ? 'bg-amber-500/10 text-amber-500 border border-amber-500/15' : 'bg-slate-850 text-slate-500' ?>">
                                <?= $r['is_active'] ? 'ACTIVE' : 'INACTIVE' ?>
                            </span>

                            <form method="POST" action="" class="inline-block">
                                <input type="hidden" name="action" value="toggle">
                                <input type="hidden" name="rule_id" value="<?= $r['id'] ?>">
                                <button type="submit" class="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-[9px] hover:text-amber-500 hover:border-amber-500 duration-150 cursor-pointer">
                                    🔄 Toggle
                                </button>
                            </form>
                        </div>
                    </div>
                    <p class="text-[11px] text-slate-400 font-light text-xs mb-3 text-justify leading-relaxed">
                        <?= htmlspecialchars($r['description']) ?>
                    </p>
                    <div class="flex justify-between text-[10px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-900/40">
                        <span>Trigger: &lt; <?= $r['near_expiry_months'] ?> Bulan Expiry</span>
                        <span class="text-amber-500 font-bold">Diskon: <?= $r['discount_percent'] ?>%</span>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3 text-amber-500">
            ➕ Daftarkan Aturan Promo Baru
        </h3>
        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="add_rule">
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">NAMA PROMO / ATURAN</label>
                <input type="text" name="name" required placeholder="Contoh: Super Clearance Flash" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">TRIGGER MASA EXPIRY (BULAN)</label>
                    <input type="number" min="1" max="24" name="near_expiry_months" required placeholder="Contoh: 3" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                </div>
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">BESAR POTONGAN (%)</label>
                    <input type="number" min="1" max="99" name="discount_percent" required placeholder="Contoh: 40" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                </div>
            </div>
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">NARASI DESKRIPSI</label>
                <textarea name="description" rows="2" placeholder="Promo pemangkasan harga instan lot menua..." class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"></textarea>
            </div>
            <button type="submit" class="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-xs text-black rounded-xl hover:brightness-110 transition cursor-pointer">
                Simpan Aturan Promo
            </button>
        </form>
    </div>

    <!-- RIGHT: Tier Pricing Catalog grid -->
    <div class="glass-panel p-6 rounded-3xl xl:col-span-7">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3">
            💰 Kamus Matriks Multi-Tier Harga Varian SKU
        </h3>
        <p class="text-[11px] text-slate-400 mb-4 leading-relaxed font-light">
            Penetapan harga jual berganda (Ritel B2C, Mitra Reseller, B2B Grosir Partai, dan Modal Vendor) yang diikat erat pada nomor barcode fungsional.
        </p>

        <div class="overflow-x-auto max-h-[850px] overflow-y-auto pr-1">
            <table class="w-full text-left border-collapse text-[11px] font-mono">
                <thead>
                    <tr class="border-b border-slate-900 text-slate-400 uppercase text-[9px] font-bold">
                        <th class="p-3">Variant SKU</th>
                        <th class="p-3">Nama Varian</th>
                        <th class="p-3 text-right">Supplier (Modal)</th>
                        <th class="p-3 text-right text-amber-400 font-bold">Ritel (B2C)</th>
                        <th class="p-3 text-right text-purple-400">Reseller</th>
                        <th class="p-3 text-right text-indigo-400">Wholesale</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-900/30">
                    <?php if (empty($variants)): ?>
                        <tr>
                            <td colspan="6" class="p-6 text-center text-slate-500 italic">Belum ada varian produk terdaftar.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($variants as $v): ?>
                            <tr>
                                <td class="p-3">
                                    <span class="font-bold text-slate-200"><?= htmlspecialchars($v['sku']) ?></span>
                                    <span class="text-[8px] text-slate-500 block uppercase"><?= htmlspecialchars($v['brand']) ?></span>
                                </td>
                                <td class="p-3 font-sans">
                                    <span class="font-semibold text-slate-300 block text-xs"><?= htmlspecialchars($v['product_name']) ?></span>
                                    <span class="text-slate-500 text-[10px] font-mono"><?= htmlspecialchars($v['name']) ?> (<?= htmlspecialchars($v['size']) ?>)</span>
                                </td>
                                <td class="p-3 text-right text-slate-400 font-mono">Rp <?= number_format($v['supplier_price'], 0, ',', '.') ?></td>
                                <td class="p-3 text-right text-amber-500 font-bold font-mono">Rp <?= number_format($v['retail_price'], 0, ',', '.') ?></td>
                                <td class="p-3 text-right text-purple-400 font-mono">Rp <?= number_format($v['reseller_price'], 0, ',', '.') ?></td>
                                <td class="p-3 text-right text-indigo-400 font-mono">Rp <?= number_format($v['wholesale_price'], 0, ',', '.') ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Skema Multi-Tier & Promosi FEFO', $content, 'pricing');
?>
