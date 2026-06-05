<?php
// views/products/index.php

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

    if ($action === 'add_product') {
        try {
            $name = trim($_POST['name'] ?? '');
            $categoryId = (int)($_POST['category_id'] ?? 0);
            $brand = trim($_POST['brand'] ?? '');
            $description = trim($_POST['description'] ?? '');
            $image = trim($_POST['image'] ?? '');

            if (empty($name) || !$categoryId || empty($brand)) {
                $error = 'Nama produk, kategori, dan brand wajib diisi!';
            } else {
                $stmtIns = $db->prepare("INSERT INTO products (name, category_id, brand, description, image) VALUES (:name, :category_id, :brand, :description, :image)");
                $stmtIns->execute([
                    'name' => $name,
                    'category_id' => $categoryId,
                    'brand' => $brand,
                    'description' => $description,
                    'image' => !empty($image) ? $image : null
                ]);
                $success = 'Produk "' . htmlspecialchars($name) . '" berhasil didaftarkan!';
                AuditLog::write('Tambah Produk', 'Menambah produk induk baru: ' . $brand . ' - ' . $name);
            }
        } catch (PDOException $e) {
            $error = 'Gagal menyimpan produk: ' . $e->getMessage();
        }
    } elseif ($action === 'add_variant') {
        try {
            $productId = (int)($_POST['product_id'] ?? 0);
            $sku = trim($_POST['sku'] ?? '');
            $barcode = trim($_POST['barcode'] ?? '');
            $name = trim($_POST['name'] ?? '');
            $size = trim($_POST['size'] ?? '');
            $shade = trim($_POST['shade'] ?? '');
            $retailPrice = (float)($_POST['retail_price'] ?? 0);
            $resellerPrice = (float)($_POST['reseller_price'] ?? 0);
            $wholesalePrice = (float)($_POST['wholesale_price'] ?? 0);
            $supplierPrice = (float)($_POST['supplier_price'] ?? 0);
            $threshold = (int)($_POST['min_stock_threshold'] ?? 10);

            if (!$productId || empty($sku) || empty($barcode) || empty($name) || empty($size)) {
                $error = 'Product ID, SKU, Barcode, Nama Varian, dan Ukuran wajib diisi!';
            } else {
                $stmtInsVar = $db->prepare("INSERT INTO product_variants (product_id, sku, barcode, name, size, shade, retail_price, reseller_price, wholesale_price, supplier_price, min_stock_threshold) VALUES (:product_id, :sku, :barcode, :name, :size, :shade, :retail_price, :reseller_price, :wholesale_price, :supplier_price, :min_stock_threshold)");
                $stmtInsVar->execute([
                    'product_id' => $productId,
                    'sku' => $sku,
                    'barcode' => $barcode,
                    'name' => $name,
                    'size' => $size,
                    'shade' => !empty($shade) ? $shade : null,
                    'retail_price' => $retailPrice,
                    'reseller_price' => $resellerPrice,
                    'wholesale_price' => $wholesalePrice,
                    'supplier_price' => $supplierPrice,
                    'min_stock_threshold' => $threshold
                ]);
                $success = 'Variasi SKU "' . htmlspecialchars($sku) . '" berhasil ditambahkan!';
                AuditLog::write('Tambah Varian SKU', 'Menambah varian SKU baru: ' . $sku);
            }
        } catch (PDOException $e) {
            $error = 'Gagal menyimpan variasi SKU: ' . $e->getMessage();
        }
    }
}

// Read search parameter if active
$search = trim($_GET['search'] ?? '');

if ($search !== '') {
    // Advanced query looking into multi fields
    $stmt = $db->prepare("
        SELECT p.*, c.name as category_name, COUNT(pv.id) as variant_count
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        WHERE p.name LIKE :search 
           OR p.brand LIKE :search 
           OR c.name LIKE :search 
           OR p.id IN (SELECT DISTINCT product_id FROM product_variants WHERE sku LIKE :search OR barcode LIKE :search)
        GROUP BY p.id
        ORDER BY p.id DESC
    ");
    $stmt->execute(['search' => "%{$search}%"]);
} else {
    // Default load
    $stmt = $db->query("
        SELECT p.*, c.name as category_name, COUNT(pv.id) as variant_count
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        GROUP BY p.id
        ORDER BY p.id DESC
    ");
}
$products = $stmt->fetchAll();

// Fetch categories for select dropdown lists
$categories = $db->query("SELECT * FROM categories ORDER BY name ASC")->fetchAll();

ob_start();
?>
<div class="glass-panel p-6 rounded-3xl mb-8 animate-fade-in">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
            <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">Katalog Kosmetik & Induk SKU</h3>
            <p class="text-[11px] text-slate-400 mt-1">Katalog produk kosmetik utama yang diintegrasikan dengan batching stock FEFO dan pelacakan batch.</p>
        </div>
        <div>
            <button onclick="toggleModal('addProductModal', true)" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-bold rounded-xl transition font-sans cursor-pointer">
                + Daftarkan Induk SKU
            </button>
        </div>
    </div>

    <!-- Showing Search Filter Alert Info if Active -->
    <?php if ($search !== ''): ?>
        <div class="mb-5 px-4 py-2 bg-slate-950/65 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
            <span class="text-slate-400 font-medium">
                Hasil pencarian untuk kata kunci: <strong class="text-cyan-400">"<?= htmlspecialchars($search) ?>"</strong> 
                (Ditemukan <strong class="text-white"><?= count($products) ?></strong> item)
            </span>
            <a href="index.php?route=products" class="text-cyan-500 font-bold hover:underline text-[10px] uppercase font-mono tracking-wider">
                Reset Cari ✕
            </a>
        </div>
    <?php endif; ?>

    <?php if ($success): ?>
        <div class="mb-5 p-3 rounded-xl bg-emerald-950/35 border border-emerald-500/25 text-emerald-400 text-xs text-center font-medium leading-relaxed">
            <?= htmlspecialchars($success) ?>
        </div>
    <?php endif; ?>

    <?php if ($error): ?>
        <div class="mb-5 p-3 rounded-xl bg-red-950/35 border border-red-500/25 text-red-400 text-xs text-center font-medium leading-relaxed">
            <?= htmlspecialchars($error) ?>
        </div>
    <?php endif; ?>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <?php if (empty($products)): ?>
            <div class="col-span-full text-center p-12 text-slate-500 italic bg-slate-950/40 border border-slate-900 rounded-2xl">
                Belum ada produk kosmetik yang cocok atau terdaftar dalam katalog.
            </div>
        <?php else: ?>
            <?php foreach ($products as $prod): ?>
                <div class="p-5 bg-slate-950/30 border border-slate-900 rounded-2xl flex flex-col justify-between hover:border-slate-800 transition duration-300">
                    <div>
                        <div class="flex items-start gap-4 mb-4">
                            <!-- Image container with fallback -->
                            <div class="w-14 h-14 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <?php if (!empty($prod['image'])): ?>
                                    <img src="<?= htmlspecialchars($prod['image']) ?>" alt="" class="object-cover w-full h-full" referrerPolicy="no-referrer">
                                <?php else: ?>
                                    <span class="text-[10px] text-slate-600 font-mono">NO BOX</span>
                                <?php endif; ?>
                            </div>
                            
                            <div class="overflow-hidden">
                                <span class="bg-cyan-950/40 text-cyan-400 px-2.5 py-0.5 rounded text-[8px] uppercase font-mono font-bold border border-cyan-800/30 leading-none inline-block">
                                    <?= htmlspecialchars($prod['brand']) ?>
                                </span>
                                <h4 class="font-extrabold text-xs text-slate-100 truncate mt-1.5 leading-tight"><?= htmlspecialchars($prod['name']) ?></h4>
                                <span class="text-[9px] text-slate-500 font-mono block mt-0.5"><?= htmlspecialchars($prod['category_name']) ?></span>
                            </div>
                        </div>

                        <p class="text-[11px] text-slate-400 leading-relaxed font-light mb-4 text-justify"><?= htmlspecialchars($prod['description'] ?? 'Tidak ada keterangan.') ?></p>
                        
                        <!-- Variants nested query -->
                        <div class="p-3 bg-slate-950/60 border border-slate-900/50 rounded-xl space-y-1.5">
                            <span class="text-[8px] font-mono font-bold text-slate-500 block uppercase tracking-wider">DAFTAR VARIASI SKU (<?= $prod['variant_count'] ?>):</span>
                            <?php
                            $vStmt = $db->prepare("SELECT sku, name, retail_price FROM product_variants WHERE product_id = :id");
                            $vStmt->execute(['id' => $prod['id']]);
                            $vars = $vStmt->fetchAll();
                            
                            if (empty($vars)):
                            ?>
                                <span class="text-[10px] text-slate-650 italic block">Tidak ada variasi terpasang.</span>
                            <?php else: ?>
                                <?php foreach ($vars as $v): ?>
                                    <div class="flex justify-between items-center text-[10px] font-mono pb-1 border-b border-slate-900/40">
                                        <span class="text-slate-400 truncate max-w-[130px]" title="<?= htmlspecialchars($v['name']) ?>"><?= htmlspecialchars($v['name']) ?></span>
                                        <span class="text-cyan-400 font-bold">Rp <?= number_format($v['retail_price'], 0, ',', '.') ?></span>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>

                    <div class="flex gap-2 mt-5">
                        <button onclick="openAddVariantModal(<?= $prod['id'] ?>, '<?= htmlspecialchars(addslashes($prod['name'])) ?>')" class="w-full py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/60 active:scale-[98%] transition cursor-pointer">
                            + Tambah Varian SKU & Harga
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<!-- MODAL 1: ADD PRODUCT (INDUK SKU) -->
<div id="addProductModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop overlay -->
    <div onclick="toggleModal('addProductModal', false)" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
    <!-- Modal panel -->
    <div class="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10">
        <div class="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
            <h3 class="text-xs font-mono font-bold uppercase text-cyan-400">➕ Daftarkan Katalog Induk SKU Baru</h3>
            <button onclick="toggleModal('addProductModal', false)" class="text-slate-400 hover:text-slate-200 font-bold text-sm">✕</button>
        </div>
        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="add_product">
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">BRAND / MERK KOSMETIK</label>
                <input type="text" name="brand" required placeholder="Contoh: Skintific, Somethinc" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
            </div>
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">NAMA PRODUK INDUK</label>
                <input type="text" name="name" required placeholder="Contoh: 5X Ceramide Moisture Gel" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
            </div>
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">KATEGORI</label>
                <select name="category_id" required class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                    <option value="">-- PILIH KATEGORI --</option>
                    <?php foreach ($categories as $cat): ?>
                        <option value="<?= $cat['id'] ?>"><?= htmlspecialchars($cat['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">IMAGE URL (OPSIONAL)</label>
                <input type="url" name="image" placeholder="https://images.unsplash.com/..." class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
            </div>
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">DESKRIPSI FORMULASI</label>
                <textarea name="description" rows="3" placeholder="Kandungan dan khasiat utama kosmetik..." class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80"></textarea>
            </div>
            <div class="flex gap-2 pt-2">
                <button type="button" onclick="toggleModal('addProductModal', false)" class="w-full py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 transition cursor-pointer">
                    Batal
                </button>
                <button type="submit" class="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl text-xs font-bold text-white hover:brightness-110 transition cursor-pointer">
                    Kirim Induk SKU
                </button>
            </div>
        </form>
    </div>
</div>

<!-- MODAL 2: ADD VARIANT SKU & MULTI-TIER PRICING -->
<div id="addVariantModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop overlay -->
    <div onclick="toggleModal('addVariantModal', false)" class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
    <!-- Modal panel -->
    <div class="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto w-11/12 md:w-full">
        <div class="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
            <div>
                <h3 class="text-xs font-mono font-bold uppercase text-cyan-400">🏷️ Tambah Varian SKU & Multi-Tier</h3>
                <span id="variantProductLabel" class="text-[10px] text-slate-400 block font-sans"></span>
            </div>
            <button onclick="toggleModal('addVariantModal', false)" class="text-slate-400 hover:text-slate-200 font-bold text-sm">✕</button>
        </div>
        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="add_variant">
            <input type="hidden" name="product_id" id="variant_product_id" value="">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">VARIANT SKU CODE</label>
                    <input type="text" name="sku" required placeholder="Contoh: SKT-MOIST-30G" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                </div>
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">EXPLICIT BARCODE (EAN-13)</label>
                    <input type="text" name="barcode" required placeholder="Contoh: 8991234500018" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="col-span-1">
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">NAMA VARIAN</label>
                    <input type="text" name="name" required placeholder="Gel Pelembab" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                </div>
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">UKURAN (SIZE)</label>
                    <input type="text" name="size" required placeholder="30g / 50ml" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                </div>
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">SHADE (OPSIONAL)</label>
                    <input type="text" name="shade" placeholder="No.01 Light" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                </div>
            </div>

            <!-- Pricing Tier Configurations -->
            <div class="p-4 bg-slate-950/40 border border-slate-850/70 rounded-2xl relative space-y-4">
                <span class="text-[8px] font-mono font-bold text-cyan-400 block tracking-wider">💰 SKEMA STRATEGI MULTI-TIER HARGA (DECIMAL RAWS)</span>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="text-[9px] text-slate-450 font-mono block mb-1">HARGA MODAL (VENDOR / SUPPLIER)</label>
                        <input type="number" min="0" name="supplier_price" required placeholder="Rp" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                    </div>
                    <div>
                        <label class="text-[9px] text-cyan-400 font-mono block mb-1 font-bold">HARGA RITEL (B2C STANDARD)</label>
                        <input type="number" min="0" name="retail_price" required placeholder="Rp" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="text-[9px] text-purple-400 font-mono block mb-1 font-bold">HARGA RESELLER (MITRA DROPSHIP)</label>
                        <input type="number" min="0" name="reseller_price" required placeholder="Rp" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                    </div>
                    <div>
                        <label class="text-[9px] text-indigo-400 font-mono block mb-1 font-bold">HARGA GROSIR (B2B WHOLESALE PARTAI)</label>
                        <input type="number" min="0" name="wholesale_price" required placeholder="Rp" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1">
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1">AMBANG MINIMUM ALARM STOK (SAFETY STOCK THRESHOLD)</label>
                    <input type="number" min="1" value="10" name="min_stock_threshold" required class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80">
                </div>
            </div>

            <div class="flex gap-2 pt-2">
                <button type="button" onclick="toggleModal('addVariantModal', false)" class="w-full py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 transition cursor-pointer">
                    Batal
                </button>
                <button type="submit" class="w-full py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl text-xs font-bold text-white hover:brightness-110 transition cursor-pointer">
                    Simpan Variasi SKU
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    function toggleModal(modalId, isVisible) {
        const modal = document.getElementById(modalId);
        if (isVisible) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    function openAddVariantModal(productId, productName) {
        document.getElementById('variant_product_id').value = productId;
        document.getElementById('variantProductLabel').innerText = "Produk induk: " + productName;
        toggleModal('addVariantModal', true);
    }
</script>
<?php
$content = ob_get_clean();
render_layout('Katalog Produk', $content, 'products');
?>
