<?php
// views/returns/customer.php

require_once __DIR__ . '/../../core/Database.php';
require_once __DIR__ . '/../../core/Middleware.php';
require_once __DIR__ . '/../../views/layouts/app.php';
require_once __DIR__ . '/../../core/AuditLog.php';

Middleware::auth();

$db = Database::connect();
$success = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $type = $_POST['type'] ?? 'Customer';
    $customerName = trim($_POST['customer_name'] ?? '');
    $supplierId = !empty($_POST['supplier_id']) ? (int)$_POST['supplier_id'] : null;
    $warehouseId = (int)($_POST['warehouse_id'] ?? 0);
    $variantId = (int)($_POST['variant_id'] ?? 0);
    $batchId = (int)($_POST['batch_id'] ?? 0);
    $quantity = (int)($_POST['quantity'] ?? 0);
    $condition = $_POST['condition'] ?? 'Segel (Stok Jual)';
    $notes = trim($_POST['notes'] ?? '');

    if (empty($warehouseId) || empty($variantId) || empty($batchId) || $quantity <= 0) {
        $error = 'Gudang, variant SKU, batch lot, dan kuantitas wajib diisi dengan benar!';
    } else {
        try {
            $db->beginTransaction();

            $returnNumber = 'RET-' . date('Ymd') . '-' . sprintf('%04d', rand(1, 9999));

            // Insert into returns
            $stmtRet = $db->prepare("INSERT INTO returns (return_number, type, supplier_id, customer_name, warehouse_id, status, notes) VALUES (:num, :type, :supplier_id, :cust_name, :wh_id, 'Selesai', :notes)");
            $stmtRet->execute([
                'num' => $returnNumber,
                'type' => $type,
                'supplier_id' => $type === 'Supplier' ? $supplierId : null,
                'cust_name' => $type === 'Customer' ? $customerName : null,
                'wh_id' => $warehouseId,
                'notes' => $notes
            ]);
            $returnId = $db->lastInsertId();

            // Insert into return_items
            $stmtItem = $db->prepare("INSERT INTO return_items (return_id, variant_id, batch_id, quantity, `condition`) VALUES (:return_id, :variant_id, :batch_id, :qty, :cond)");
            $stmtItem->execute([
                'return_id' => $returnId,
                'variant_id' => $variantId,
                'batch_id' => $batchId,
                'qty' => $quantity,
                'cond' => $condition
            ]);

            // Adjust Stock based on type and condition
            if ($type === 'Customer') {
                if ($condition === 'Segel (Stok Jual)') {
                    // Restock: ADD stock back to warehouse
                    $stmtCheck = $db->prepare("SELECT id FROM batch_stock WHERE warehouse_id = :wh AND variant_id = :var AND batch_id = :batch");
                    $stmtCheck->execute(['wh' => $warehouseId, 'var' => $variantId, 'batch' => $batchId]);
                    $exists = $stmtCheck->fetch();

                    if ($exists) {
                        $stmtUpdate = $db->prepare("UPDATE batch_stock SET quantity = quantity + :qty WHERE id = :id");
                        $stmtUpdate->execute(['qty' => $quantity, 'id' => $exists['id']]);
                    } else {
                        $stmtInsert = $db->prepare("INSERT INTO batch_stock (warehouse_id, variant_id, batch_id, quantity) VALUES (:wh, :var, :batch, :qty)");
                        $stmtInsert->execute(['wh' => $warehouseId, 'var' => $variantId, 'batch' => $batchId, 'qty' => $quantity]);
                    }
                    
                    // Stock movement
                    $stmtMv = $db->prepare("INSERT INTO stock_movements (variant_id, batch_id, warehouse_id, type, quantity, notes, performed_by) VALUES (:var, :batch, :wh, 'Return', :qty, :notes, :by)");
                    $stmtMv->execute([
                        'var' => $variantId,
                        'batch' => $batchId,
                        'wh' => $warehouseId,
                        'qty' => $quantity,
                        'notes' => 'Klaim Retur Customer ' . $returnNumber . ' (Stok Segel)',
                        'by' => $_SESSION['user_fullname'] ?? 'Agustinov Freeze'
                    ]);
                }
            } elseif ($type === 'Supplier') {
                // Deduct from our warehouse stock as we send back to vendor!
                $stmtCheck = $db->prepare("SELECT id, quantity FROM batch_stock WHERE warehouse_id = :wh AND variant_id = :var AND batch_id = :batch");
                $stmtCheck->execute(['wh' => $warehouseId, 'var' => $variantId, 'batch' => $batchId]);
                $exists = $stmtCheck->fetch();

                if ($exists) {
                    $newQty = max(0, $exists['quantity'] - $quantity);
                    $stmtUpdate = $db->prepare("UPDATE batch_stock SET quantity = :qty WHERE id = :id");
                    $stmtUpdate->execute(['qty' => $newQty, 'id' => $exists['id']]);

                    // Stock movement
                    $stmtMv = $db->prepare("INSERT INTO stock_movements (variant_id, batch_id, warehouse_id, type, quantity, notes, performed_by) VALUES (:var, :batch, :wh, 'Return', :qty, :notes, :by)");
                    $stmtMv->execute([
                        'var' => $variantId,
                        'batch' => $batchId,
                        'wh' => $warehouseId,
                        'qty' => -$quantity,
                        'notes' => 'Retur Balik ke Vendor ' . $returnNumber,
                        'by' => $_SESSION['user_fullname'] ?? 'Agustinov Freeze'
                    ]);
                }
            }

            $db->commit();
            $success = 'Klaim retur nomor "' . $returnNumber . '" berhasil dibukukan!';
            AuditLog::write('Input Retur Barang', 'Menyimpan retur logistik ' . $returnNumber);
        } catch (Exception $e) {
            $db->rollBack();
            $error = 'Gagal menyimpan retur: ' . $e->getMessage();
        }
    }
}

// Ambil semua data retur aktif beserta nama gudang
$returns = $db->query("
    SELECT r.*, w.name as warehouse_name, pv.sku, ri.quantity, ri.condition
    FROM returns r
    JOIN warehouses w ON r.warehouse_id = w.id
    LEFT JOIN return_items ri ON r.id = ri.return_id
    LEFT JOIN product_variants pv ON ri.variant_id = pv.id
    ORDER BY r.created_at DESC
")->fetchAll();

// Fetch auxiliary lists
$whList = $db->query("SELECT * FROM warehouses")->fetchAll();
$variantsList = $db->query("
    SELECT pv.id, pv.sku, p.name as product_name, pv.name as variant_name
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    ORDER BY p.name ASC
")->fetchAll();
$batchesList = $db->query("SELECT id, batch_number FROM batches ORDER BY expiry_date ASC")->fetchAll();
$suppliersList = $db->query("SELECT id, name FROM suppliers ORDER BY name ASC")->fetchAll();

ob_start();
?>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
    <!-- LEFT: Returns list -->
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-8">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3">
            🔄 Alur Claim & Penerimaan Retur Barang
        </h3>
        
        <div class="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            <?php if (empty($returns)): ?>
                <div class="text-center p-8 text-slate-500 italic bg-slate-900/20 border border-slate-850 rounded-2xl text-xs">
                    Belum ada pencatatan klaim retur kosmetik (Cacat/Segel kembali).
                </div>
            <?php else: ?>
                <?php foreach ($returns as $ret): ?>
                    <div class="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <span class="font-mono text-xs font-bold text-amber-500 block"><?= htmlspecialchars($ret['return_number']) ?></span>
                                <span class="text-[9px] text-slate-500 font-mono">Status: <span class="text-emerald-400 font-bold"><?= htmlspecialchars($ret['status']) ?></span></span>
                            </div>
                            <span class="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-750">
                                ASAL: <?= htmlspecialchars($ret['type']) ?> (<?= htmlspecialchars($ret['customer_name'] ?: 'Vendor') ?>)
                            </span>
                        </div>
                        <p class="text-[11px] text-slate-400 font-light text-xs">
                            Keterangan: <strong class="text-slate-200"><?= htmlspecialchars($ret['notes'] ?? 'Tanpa penjelasan tambahan.') ?></strong>
                        </p>
                        <?php if (!empty($ret['sku'])): ?>
                            <div class="mt-2 text-[10px] font-mono bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                                📦 Item: <span class="text-amber-500 font-bold"><?= htmlspecialchars($ret['sku']) ?></span> (<?= $ret['quantity'] ?> Pcs) - Kondisi: <span class="<?= $ret['condition'] === 'Segel (Stok Jual)' ? 'text-emerald-400' : 'text-red-400' ?> font-bold"><?= htmlspecialchars($ret['condition']) ?></span>
                            </div>
                        <?php endif; ?>
                        <span class="text-[9px] text-slate-500 block mt-2 font-mono">Alokasi Fisik: <?= htmlspecialchars($ret['warehouse_name']) ?> | Tanggal: <?= htmlspecialchars($ret['created_at']) ?></span>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <!-- RIGHT: Add Return form -->
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-4 h-fit">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3 text-amber-500">
            🔄 Catat Retur Baru (Claim)
        </h3>
        <p class="text-[11px] text-slate-400 mb-4 leading-relaxed font-light text-justify">
            Gunakan panel ini saat menerima barang cacat kembali dari pembeli (Customer) atau saat menyortir boks rusak untuk dikirim balik ke Pemasok (Supplier).
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
                <label class="text-[9px] text-slate-400 font-mono block mb-1">TIPE RETUR</label>
                <select name="type" id="return_type" onchange="toggleParticipants()" required class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                    <option value="Customer">RETUR PELANGGAN (CUSTOMER)</option>
                    <option value="Supplier">RETUR KEMBALI KE VENDOR (SUPPLIER)</option>
                </select>
            </div>
            
            <div id="customer_input_block">
                <label class="text-[9px] text-slate-400 font-mono block mb-1">PENGIRIM (NAMA PELANGGAN)</label>
                <input type="text" name="customer_name" placeholder="Nama pelanggan atau No order" class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
            </div>

            <div id="supplier_select_block" class="hidden">
                <label class="text-[9px] text-slate-400 font-mono block mb-1">VENDOR (SUPPLIER PENERIMA)</label>
                <select name="supplier_id" class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                    <option value="">-- PILIH VENDOR --</option>
                    <?php foreach ($suppliersList as $sl): ?>
                        <option value="<?= $sl['id'] ?>"><?= htmlspecialchars($sl['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">TUJUAN ALOKASI FISIK GUDANG</label>
                <select name="warehouse_id" required class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                    <option value="">-- PILIH GUDANG --</option>
                    <?php foreach ($whList as $w): ?>
                        <option value="<?= $w['id'] ?>"><?= htmlspecialchars($w['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <!-- Selecting items and batches -->
            <div class="p-3 bg-slate-950/35 border border-slate-850 rounded-2xl space-y-3">
                <span class="text-[8px] font-mono font-bold text-amber-500 block">📦 PILIH DETAIL ITEM KOSMETIK</span>
                <div>
                    <label class="text-[9px] text-slate-450 font-mono block mb-1">VARIASI PRODUK SKU</label>
                    <select name="variant_id" required class="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-amber-500">
                        <option value="">-- PILIH SKU --</option>
                        <?php foreach($variantsList as $vl): ?>
                            <option value="<?= $vl['id'] ?>"><?= htmlspecialchars($vl['sku']) ?> - <?= htmlspecialchars($vl['product_name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[9px] text-slate-450 font-mono block mb-1">BATCH LOT KOLI</label>
                        <select name="batch_id" required class="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-[11px] text-slate-350 focus:outline-none focus:border-amber-500">
                            <option value="">-- PILIH LOT --</option>
                            <?php foreach($batchesList as $bl): ?>
                                <option value="<?= $bl['id'] ?>"><?= htmlspecialchars($bl['batch_number']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="text-[9px] text-slate-450 font-mono block mb-1">QTY PIECES</label>
                        <input type="number" min="1" name="quantity" required placeholder="QTY" class="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                    </div>
                </div>
            </div>

            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">KONDISI FISIK SEKARANG</label>
                <select name="condition" required class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                    <option value="Segel (Stok Jual)">Segel (Stok Jual) - Kembalikan Ke Stok Aktif</option>
                    <option value="Cacat (Gudang Rusak)">Cacat (Gudang Rusak) - Karantina Kamar Rusak</option>
                </select>
            </div>

            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">ALASAN DETAIL KELUHAN / KONDISI</label>
                <textarea name="notes" rows="2" placeholder="Botol retak, segel terbuka, warna salah..." class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"></textarea>
            </div>
            
            <button type="submit" class="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-xs text-black rounded-xl hover:brightness-110 transition cursor-pointer">
                Simpan Transaksi Retur
            </button>
        </form>
    </div>
</div>

<script>
    function toggleParticipants() {
        const type = document.getElementById('return_type').value;
        const customerBlock = document.getElementById('customer_input_block');
        const supplierBlock = document.getElementById('supplier_select_block');
        
        if (type === 'Customer') {
            customerBlock.classList.remove('hidden');
            supplierBlock.classList.add('hidden');
        } else {
            customerBlock.classList.add('hidden');
            supplierBlock.classList.remove('hidden');
        }
    }
</script>
<?php
$content = ob_get_clean();
render_layout('Retur & Claim Logistik', $content, 'returns');
?>
