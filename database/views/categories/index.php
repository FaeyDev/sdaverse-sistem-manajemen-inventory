<?php
// views/categories/index.php

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
    $parentId = $_POST['parent_id'] ?? '';
    $parentId = ($parentId === '') ? null : (int)$parentId;
    $description = trim($_POST['description'] ?? '');

    if (empty($name)) {
        $error = 'Nama kategori wajib diisi!';
    } else {
        try {
            $insStmt = $db->prepare("INSERT INTO categories (name, parent_id, description) VALUES (:name, :parent_id, :description)");
            $insStmt->execute([
                'name' => $name,
                'parent_id' => $parentId,
                'description' => $description
            ]);
            $success = 'Kategori "' . htmlspecialchars($name) . '" berhasil ditambahkan!';
            AuditLog::write('Tambah Kategori', 'Menambah kategori baru: ' . $name);
        } catch (PDOException $e) {
            $error = 'Gagal menyimpan kategori: ' . $e->getMessage();
        }
    }
}

// Ambil semua kategori induk (parent_id is null)
$stmt = $db->query("SELECT * FROM categories WHERE parent_id IS NULL");
$parentCategories = $stmt->fetchAll();

ob_start();
?>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
    
    <!-- LEFT: Category List Tree -->
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-7">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-900 pb-3">
            📂 Arsitektur Hierarki Kategori Kecantikan
        </h3>
        
        <div class="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            <?php foreach ($parentCategories as $parent): ?>
                <div class="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-slate-100 text-xs uppercase font-mono"><?= htmlspecialchars($parent['name']) ?></span>
                        <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-750">PARENT NODE</span>
                    </div>
                    <p class="text-[11px] text-slate-400 mb-3 truncate font-light"><?= htmlspecialchars($parent['description'] ?? 'Tidak ada deskripsi.') ?></p>
                    
                    <!-- Fetch subcategories -->
                    <div class="pl-4 mt-2 border-l border-slate-800 space-y-2">
                        <?php
                        $subStmt = $db->prepare("SELECT * FROM categories WHERE parent_id = :id");
                        $subStmt->execute(['id' => $parent['id']]);
                        $children = $subStmt->fetchAll();
                        
                        if (empty($children)):
                        ?>
                            <span class="text-[10px] text-slate-550 italic block">Tidak ada subkategori terpasang.</span>
                        <?php else: ?>
                            <?php foreach ($children as $child): ?>
                                <div class="flex justify-between items-center text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                                    <span class="font-sans font-medium text-slate-355"><?= htmlspecialchars($child['name']) ?></span>
                                    <span class="text-[9px] font-mono text-slate-500 truncate max-w-[150px]"><?= htmlspecialchars($child['description'] ?? '') ?></span>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- RIGHT: Add Category form -->
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-5 h-fit">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-900 pb-3 text-amber-500">
            ➕ Daftarkan Kategori Baru
        </h3>
        <p class="text-[11px] text-slate-400 mb-4 leading-relaxed font-light">
            Masukkan parameter kategori kosmetik baru untuk menyusun grouping induk produk ERP demi efisiensi query dan pelaporan akuntansi stok.
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
                <label class="text-[9px] text-slate-400 font-mono block mb-1">NAMA KATEGORI</label>
                <input type="text" name="name" required placeholder="Contoh: Moisturizer, Clay Mask" class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
            </div>

            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">PARENT CATEGORY (OPSIONAL)</label>
                <select name="parent_id" class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-400 focus:outline-none focus:border-amber-500">
                    <option value="">-- TANPA PARENT NODE --</option>
                    <?php foreach ($parentCategories as $parent): ?>
                        <option value="<?= $parent['id'] ?>"><?= htmlspecialchars($parent['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">DESKRIPSI SINGKAT</label>
                <textarea rows="3" name="description" placeholder="Keterangan kategori fungsional..." class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"></textarea>
            </div>

            <button type="submit" class="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-xs text-black rounded-xl hover:brightness-110 transition cursor-pointer">
                Simpan Hirarki Kategori
            </button>
        </form>
    </div>

</div>
<?php
$content = ob_get_clean();
render_layout('Hierarki Kategori Produk', $content, 'categories');
?>
