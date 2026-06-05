<?php
// views/warehouses/index.php

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

    if ($action === 'create_transfer') {
        $fromWh = (int)($_POST['from_warehouse_id'] ?? 0);
        $toWh = (int)($_POST['to_warehouse_id'] ?? 0);
        $variantId = (int)($_POST['variant_id'] ?? 0);
        $batchId = (int)($_POST['batch_id'] ?? 0);
        $qty = (int)($_POST['quantity'] ?? 0);
        $notes = trim($_POST['notes'] ?? '');

        if ($fromWh === $toWh) {
            $error = 'Gudang asal (kirim) dan tujuan (alokasi) tidak boleh sama!';
        } elseif ($qty <= 0) {
            $error = 'Jumlah unit transfer harus di atas nol!';
        } elseif (!$variantId || !$batchId) {
            $error = 'Silakan pilih variasi SKU produk dan batch lot terlebih dahulu!';
        } else {
            // Check source stock
            $checkStmt = $db->prepare("SELECT quantity FROM batch_stock WHERE warehouse_id = :wh AND variant_id = :var AND batch_id = :batch");
            $checkStmt->execute(['wh' => $fromWh, 'var' => $variantId, 'batch' => $batchId]);
            $sourceQty = (int)($checkStmt->fetchColumn() ?: 0);

            if ($sourceQty < $qty) {
                $error = 'Stok tidak mencukupi di gudang asal! Sisa stok saat ini: ' . $sourceQty . ' Pcs.';
            } else {
                try {
                    $db->beginTransaction();

                    $transferNumber = 'TF-' . date('Ymd') . '-' . sprintf('%04d', rand(1, 9999));
                    $performedBy = $_SESSION['user_fullname'] ?? 'Agustinov Freeze';

                    // Insert transfers
                    $stmtTx = $db->prepare("INSERT INTO transfers (transfer_number, from_warehouse_id, to_warehouse_id, status, notes, performed_by) VALUES (:num, :from, :to, 'In Transit', :notes, :by)");
                    $stmtTx->execute([
                        'num' => $transferNumber,
                        'from' => $fromWh,
                        'to' => $toWh,
                        'notes' => $notes,
                        'by' => $performedBy
                    ]);
                    $transferId = $db->lastInsertId();

                    // Insert transfer items
                    $stmtItem = $db->prepare("INSERT INTO transfer_items (transfer_id, variant_id, batch_id, quantity) VALUES (:tx_id, :var_id, :batch_id, :qty)");
                    $stmtItem->execute([
                        'tx_id' => $transferId,
                        'var_id' => $variantId,
                        'batch_id' => $batchId,
                        'qty' => $qty
                    ]);

                    // Deduct source stock
                    $stmtDeduct = $db->prepare("UPDATE batch_stock SET quantity = quantity - :qty WHERE warehouse_id = :wh AND variant_id = :var AND batch_id = :batch");
                    $stmtDeduct->execute(['qty' => $qty, 'wh' => $fromWh, 'var' => $variantId, 'batch' => $batchId]);

                    // Stock movement for source
                    $stmtMv = $db->prepare("INSERT INTO stock_movements (variant_id, batch_id, warehouse_id, type, quantity, notes, performed_by) VALUES (:var, :batch, :wh, 'Transfer', :qty, :notes, :by)");
                    $stmtMv->execute([
                        'var' => $variantId,
                        'batch' => $batchId,
                        'wh' => $fromWh,
                        'qty' => -$qty,
                        'notes' => 'Dikirim ke transfer: ' . $transferNumber,
                        'by' => $performedBy
                    ]);

                    $db->commit();
                    $success = 'Surat jalan "' . $transferNumber . '" berhasil diterbitkan! Status: In Transit.';
                    AuditLog::write('Buat Transfer Stok', 'Membuat transfer antar-gudang ' . $transferNumber);
                } catch (Exception $e) {
                    $db->rollBack();
                    $error = 'Gagal menyimpan transaksi transfer: ' . $e->getMessage();
                }
            }
        }
    } elseif ($action === 'receive_transfer') {
        $transferId = (int)($_POST['transfer_id'] ?? 0);
        try {
            $db->beginTransaction();

            $stmtFetch = $db->prepare("SELECT * FROM transfers WHERE id = :id AND status = 'In Transit' LIMIT 1");
            $stmtFetch->execute(['id' => $transferId]);
            $tx = $stmtFetch->fetch();

            if ($tx) {
                $stmtItems = $db->prepare("SELECT * FROM transfer_items WHERE transfer_id = :id");
                $stmtItems->execute(['id' => $transferId]);
                $items = $stmtItems->fetchAll();

                foreach ($items as $item) {
                    $stmtCheckDest = $db->prepare("SELECT id FROM batch_stock WHERE warehouse_id = :wh AND variant_id = :var AND batch_id = :batch");
                    $stmtCheckDest->execute(['wh' => $tx['to_warehouse_id'], 'var' => $item['variant_id'], 'batch' => $item['batch_id']]);
                    $exists = $stmtCheckDest->fetch();

                    if ($exists) {
                        $stmtUpdateDest = $db->prepare("UPDATE batch_stock SET quantity = quantity + :qty WHERE id = :id");
                        $stmtUpdateDest->execute(['qty' => $item['quantity'], 'id' => $exists['id']]);
                    } else {
                        $stmtInsertDest = $db->prepare("INSERT INTO batch_stock (warehouse_id, variant_id, batch_id, quantity) VALUES (:wh, :var, :batch, :qty)");
                        $stmtInsertDest->execute(['wh' => $tx['to_warehouse_id'], 'var' => $item['variant_id'], 'batch' => $item['batch_id'], 'qty' => $item['quantity']]);
                    }

                    // Stock movement for destination receipt
                    $stmtMvDest = $db->prepare("INSERT INTO stock_movements (variant_id, batch_id, warehouse_id, type, quantity, notes, performed_by) VALUES (:var, :batch, :wh, 'Transfer', :qty, :notes, :by)");
                    $stmtMvDest->execute([
                        'var' => $item['variant_id'],
                        'batch' => $item['batch_id'],
                        'wh' => $tx['to_warehouse_id'],
                        'qty' => $item['quantity'],
                        'notes' => 'Diterima dari transfer: ' . $tx['transfer_number'],
                        'by' => $_SESSION['user_fullname'] ?? 'Agustinov Freeze'
                    ]);
                }

                $stmtUpdateStatus = $db->prepare("UPDATE transfers SET status = 'Received' WHERE id = :id");
                $stmtUpdateStatus->execute(['id' => $transferId]);

                $db->commit();
                $success = 'Penerimaan stok dari surat jalan "' . $tx['transfer_number'] . '" sukses dibukukan!';
                AuditLog::write('Penerimaan Transfer', 'Menerima dan membukukan transfer ' . $tx['transfer_number']);
            } else {
                $db->rollBack();
                $error = 'Transaksi transfer tidak aktif atau sudah pernah diterima sebelumnya!';
            }
        } catch (Exception $e) {
            $db->rollBack();
            $error = 'Gagal membukukan penerimaan: ' . $e->getMessage();
        }
    }
}

// Ambil gudang-gudang aktif
$warehouses = $db->query("SELECT * FROM warehouses")->fetchAll();

// Ambil riwayat transfer logistik dengan nama gudang relasional dan detail item
$stmtTransfers = $db->query("
    SELECT t.*, w1.name as from_warehouse_name, w2.name as to_warehouse_name,
           pv.sku, b.batch_number, ti.quantity as transfer_qty
    FROM transfers t
    JOIN warehouses w1 ON t.from_warehouse_id = w1.id
    JOIN warehouses w2 ON t.to_warehouse_id = w2.id
    LEFT JOIN transfer_items ti ON t.id = ti.transfer_id
    LEFT JOIN product_variants pv ON ti.variant_id = pv.id
    LEFT JOIN batches b ON ti.batch_id = b.id
    ORDER BY t.created_at DESC
");
$transfers = $stmtTransfers->fetchAll();

// Fetch variants list for dropdown
$variantsList = $db->query("
    SELECT pv.id, pv.sku, p.name as product_name, pv.name as variant_name
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    ORDER BY p.name ASC
")->fetchAll();

// Fetch batches list for dropdown
$batchesList = $db->query("SELECT id, batch_number FROM batches ORDER BY expiry_date ASC")->fetchAll();

ob_start();
?>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
    <!-- LEFT: Site list and transfers record -->
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-7">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3">
            🏢 Direktori Cabang & Pusat Distribusi
        </h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <?php foreach ($warehouses as $wh): ?>
                <div class="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl relative">
                    <span class="text-[9px] font-mono tracking-wider text-amber-500 font-bold block mb-1"><?= htmlspecialchars($wh['code']) ?></span>
                    <h4 class="text-xs font-bold text-slate-100"><?= htmlspecialchars($wh['name']) ?></h4>
                    <span class="text-[10px] text-slate-550 block mt-1"><?= htmlspecialchars($wh['location']) ?></span>
                </div>
            <?php endforeach; ?>
        </div>

        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3">
            🚛 Lembar Pengiriman Logistik (Shipments)
        </h3>
        
        <div class="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            <?php if (empty($transfers)): ?>
                <div class="text-center p-8 text-slate-500 italic bg-slate-900/20 border border-slate-850 rounded-2xl text-xs">
                    Belum ada riwayat surat jalan transfer antar gudang.
                </div>
            <?php else: ?>
                <?php foreach ($transfers as $t): ?>
                    <div class="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl relative overflow-hidden">
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                            <div>
                                <span class="font-mono text-xs font-bold text-amber-500 block"><?= htmlspecialchars($t['transfer_number']) ?></span>
                                <span class="text-[9px] text-slate-500 font-mono">Pengirim: <?= htmlspecialchars($t['performed_by']) ?></span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold <?= $t['status'] === 'Received' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15' : 'bg-amber-500/10 text-amber-400 border border-amber-500/15' ?>">
                                    <?= htmlspecialchars($t['status']) ?>
                                </span>
                                <?php if ($t['status'] === 'In Transit'): ?>
                                    <form method="POST" action="" class="inline-block">
                                        <input type="hidden" name="action" value="receive_transfer">
                                        <input type="hidden" name="transfer_id" value="<?= $t['id'] ?>">
                                        <button type="submit" class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-black border border-emerald-500/30 transition cursor-pointer">
                                            ☑️ Tandai Diterima
                                        </button>
                                    </form>
                                <?php endif; ?>
                            </div>
                        </div>
                        <p class="text-[11px] text-slate-400 font-light text-xs">
                            Rute/Alokasi: <strong class="text-slate-200"><?= htmlspecialchars($t['from_warehouse_name']) ?></strong> ➡️ <strong class="text-slate-200"><?= htmlspecialchars($t['to_warehouse_name']) ?></strong>
                        </p>
                        <?php if (!empty($t['sku'])): ?>
                            <div class="mt-2 text-[10px] font-mono bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                                📦 Item: <span class="text-amber-500 font-bold"><?= htmlspecialchars($t['sku']) ?></span> (Batch: <?= htmlspecialchars($t['batch_number']) ?>) - <span class="text-slate-100 font-bold"><?= $t['transfer_qty'] ?> Pcs</span>
                            </div>
                        <?php endif; ?>
                        <?php if (!empty($t['notes'])): ?>
                            <p class="mt-2 text-[10px] text-slate-500 italic font-sans leading-normal">Catatan mutasi: "<?= htmlspecialchars($t['notes']) ?>"</p>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <!-- RIGHT: Dispatch Transfer builder -->
    <div class="glass-panel p-6 rounded-3xl lg:col-span-12 xl:col-span-5 h-fit">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-4 border-b border-slate-900 pb-3 text-amber-500">
            🚚 Buat Transfer Stok (Surat Jalan)
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

        <form method="POST" action="" class="space-y-4">
            <input type="hidden" name="action" value="create_transfer">
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">GUDANG ASAL (DEDUCT STOCK)</label>
                <select name="from_warehouse_id" required class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                    <?php foreach ($warehouses as $wh): ?>
                        <option value="<?= $wh['id'] ?>"><?= htmlspecialchars($wh['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">GUDANG TUJUAN (ALOKASI BARU)</label>
                <select name="to_warehouse_id" required class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                    <?php foreach (array_reverse($warehouses) as $wh): ?>
                        <option value="<?= $wh['id'] ?>"><?= htmlspecialchars($wh['name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <!-- Selecting items and batches -->
            <div class="p-3 bg-slate-950/35 border border-slate-850 rounded-2xl space-y-3">
                <span class="text-[8px] font-mono font-bold text-amber-500 block">📦 PILIH VARIANT & BATCH KOLI</span>
                <div>
                    <label class="text-[9px] text-slate-450 font-mono block mb-1">VARIASI PRODUK SKU</label>
                    <select name="variant_id" required class="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-[11px] text-slate-200 focus:outline-none focus:border-amber-500">
                        <option value="">-- PILIH SKU --</option>
                        <?php foreach($variantsList as $vl): ?>
                            <option value="<?= $vl['id'] ?>"><?= htmlspecialchars($vl['sku']) ?> - <?= htmlspecialchars($vl['product_name']) ?> (<?= htmlspecialchars($vl['variant_name']) ?>)</option>
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
                        <label class="text-[9px] text-slate-450 font-mono block mb-1">QTY (PIECES)</label>
                        <input type="number" min="1" name="quantity" required placeholder="Contoh: 50" class="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                    </div>
                </div>
            </div>

            <div>
                <label class="text-[9px] text-slate-400 font-mono block mb-1">CATATAN EKSPEDISI / MUTASI</label>
                <textarea name="notes" rows="2" placeholder="Mutasi batch kosmetik untuk pengimbangan sebaran..." class="w-full px-3 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"></textarea>
            </div>
            <button type="submit" class="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-xs text-black rounded-xl hover:brightness-110 transition cursor-pointer">
                Kirim Stok (In Transit)
            </button>
        </form>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Surat Jalan & Transfer Antar Gudang', $content, 'warehouses');
?>
