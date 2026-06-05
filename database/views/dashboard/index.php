<?php
// views/dashboard/index.php

require_once __DIR__ . '/../../core/Database.php';
require_once __DIR__ . '/../../core/Middleware.php';
require_once __DIR__ . '/../../views/layouts/app.php';

Middleware::auth();

$db = Database::connect();

// 1. Ambil data agregat metrik utama
$totalProducts = $db->query("SELECT COUNT(*) FROM products")->fetchColumn();
$totalStock = $db->query("SELECT COALESCE(SUM(quantity), 0) FROM batch_stock")->fetchColumn();
$totalBatches = $db->query("SELECT COUNT(*) FROM batches")->fetchColumn();
$totalSuppliers = $db->query("SELECT COUNT(*) FROM suppliers")->fetchColumn();

// 2. Ambil barang-barang yang stoknya kritis (di bawah threshold)
$lowStockStmt = $db->query("
    SELECT pv.sku, p.name as product_name, pv.name as variant_name, COALESCE(SUM(bs.quantity), 0) as total_qty, pv.min_stock_threshold
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    LEFT JOIN batch_stock bs ON pv.id = bs.variant_id
    GROUP BY pv.id
    HAVING total_qty < pv.min_stock_threshold
    ORDER BY total_qty ASC
    LIMIT 5
");
$lowStockItems = $lowStockStmt->fetchAll();

// 3. Ambil log audit sesi terbaru
$auditStmt = $db->query("
    SELECT al.*, u.fullname 
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 5
");
$recentAudits = $auditStmt->fetchAll();

// 4. Sebaran stok per cabang gudang untuk bagan batangan
$whStockStmt = $db->query("
    SELECT w.name as warehouse_name, COALESCE(SUM(bs.quantity), 0) as stock_qty
    FROM warehouses w
    LEFT JOIN batch_stock bs ON w.id = bs.warehouse_id
    GROUP BY w.id
");
$whStockData = $whStockStmt->fetchAll();

$whNames = [];
$whStocks = [];
foreach ($whStockData as $row) {
    $whNames[] = $row['warehouse_name'];
    $whStocks[] = (int)$row['stock_qty'];
}

// Mulai menangkap output view ke buffer pengiriman
ob_start();
?>
<!-- METRIC STATS GRID -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in">
    
    <!-- CARD 1 -->
    <div class="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-5 text-cyan-500">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
        <span class="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Total SKU Kosmetik</span>
        <h3 class="text-3xl font-extrabold text-slate-100 mt-2 font-mono"><?= $totalProducts ?> <span class="text-xs text-cyan-400 font-sans font-bold">Produk</span></h3>
        <p class="text-[11px] text-slate-500 mt-1.5">Terdaftar secara unik di ERP catalog</p>
    </div>

    <!-- CARD 2 -->
    <div class="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-5 text-cyan-500">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/></svg>
        </div>
        <span class="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Jumlah Fisik Stok (Pieces)</span>
        <h3 class="text-3xl font-extrabold text-cyan-400 mt-2 font-mono"><?= number_format($totalStock, 0, ',', '.') ?></h3>
        <p class="text-[11px] text-slate-500 mt-1.5">Tersebar aman di seluruh site multi-gudang</p>
    </div>

    <!-- CARD 3 -->
    <div class="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-5 text-cyan-500">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
        </div>
        <span class="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Batch Produksi Aktif</span>
        <h3 class="text-3xl font-extrabold text-slate-100 mt-2 font-mono"><?= $totalBatches ?> <span class="text-xs text-cyan-400 font-sans font-bold">Koli</span></h3>
        <p class="text-[11px] text-slate-500 mt-1.5">Terpantau tanggal kedaluarsa & FEFO rules</p>
    </div>

    <!-- CARD 4 -->
    <div class="glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-5 text-cyan-500">
            <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
        </div>
        <span class="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Mitra Pemasok (Supplier)</span>
        <h3 class="text-3xl font-extrabold text-slate-100 mt-2 font-mono"><?= $totalSuppliers ?> <span class="text-xs text-cyan-400 font-sans font-bold">PT</span></h3>
        <p class="text-[11px] text-slate-500 mt-1.5">Kontak penyuplai impor & manufaktur lokal</p>
    </div>

</div>

<!-- DETAILED CHARTS & ALERTS GRID -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
    
    <!-- LEFT: Stock distribution per Warehouse -->
    <div class="glass-panel rounded-3xl p-6 lg:col-span-7">
        <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
            🌍 Sebaran Density Stok per Cabang Gudang
        </h3>
        <div class="h-64 flex items-center justify-center">
            <canvas id="whStockChart"></canvas>
        </div>
    </div>

    <!-- RIGHT: Low Stock alerts & system log -->
    <div class="glass-panel rounded-3xl p-6 lg:col-span-5 flex flex-col justify-between">
        <div>
            <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono text-cyan-400">
                ⚠️ Alarm Stok di Bawah Minimum Threshold
            </h3>

            <!-- Low stock cards list -->
            <div class="space-y-3">
                <?php if (empty($lowStockItems)): ?>
                    <div class="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs text-slate-400 font-medium text-center">
                        ✅ Seluruh variasi produk kosmetik berada dalam batas aman stok.
                    </div>
                <?php else: ?>
                    <?php foreach ($lowStockItems as $item): ?>
                        <div class="p-3 bg-red-950/20 border border-red-500/15 rounded-2xl flex justify-between items-center">
                            <div>
                                <span class="text-[9px] font-mono text-red-400 block font-bold"><?= htmlspecialchars($item['sku']) ?></span>
                                <span class="text-xs font-bold text-slate-200 block truncate max-w-[200px]"><?= htmlspecialchars($item['product_name']) ?></span>
                                <span class="text-[10px] text-slate-500 block truncate max-w-[200px]"><?= htmlspecialchars($item['variant_name']) ?></span>
                            </div>
                            <div class="text-right font-mono">
                                <span class="text-xs text-red-400 font-extrabold block"><?= $item['total_qty'] ?> Unit</span>
                                <span class="text-[9px] text-slate-500 block">Min: <?= $item['min_stock_threshold'] ?></span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <div class="mt-6 pt-5 border-t border-slate-900">
            <p class="text-[10px] text-slate-400 font-mono font-bold uppercase mb-2">💡 Navigasi Cepat Panel:</p>
            <div class="grid grid-cols-2 gap-2">
                <a href="index.php?route=products" class="p-2.5 bg-slate-950/60 border border-slate-850 rounded-xl text-center text-[10px] font-bold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/60 transition">💄 Tambah Produk</a>
                <a href="index.php?route=warehouses" class="p-2.5 bg-slate-950/60 border border-slate-850 rounded-xl text-center text-[10px] font-bold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/60 transition">🚛 Kirim Transfer</a>
            </div>
        </div>

    </div>

</div>

<!-- FULL WIDTH: LOG RECENT ACTIVITIES -->
<div class="glass-panel rounded-3xl p-6 mb-4">
    <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-mono">
        🛡️ Sesi Masuk & Otorisasi Terbaru (Log Audit)
    </h3>
    
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
            <thead>
                <tr class="border-b border-slate-900 text-slate-400 font-mono uppercase text-[9px] font-bold">
                    <th class="p-3">User Operator</th>
                    <th class="p-3">Aktivitas Otorisasi</th>
                    <th class="p-3">Keterangan Sesi</th>
                    <th class="p-3">Stempel Tanggal</th>
                    <th class="p-3">IP Address</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/30">
                <?php if (empty($recentAudits)): ?>
                    <tr>
                        <td colspan="5" class="p-4 text-center text-slate-500 italic">Belum ada aktivitas terekam di database.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($recentAudits as $audit): ?>
                        <tr>
                            <td class="p-3 font-semibold text-slate-200"><?= htmlspecialchars($audit['fullname']) ?></td>
                            <td class="p-3">
                                <span class="px-2 py-0.5 rounded font-mono text-[9px] font-bold bg-cyan-500/10 text-cyan-450 border border-cyan-500/15">
                                    <?= htmlspecialchars($audit['action']) ?>
                                </span>
                            </td>
                            <td class="p-3 text-slate-400 font-light"><?= htmlspecialchars($audit['details']) ?></td>
                            <td class="p-3 text-slate-500 font-mono"><?= htmlspecialchars($audit['created_at']) ?></td>
                            <td class="p-3 text-slate-500 font-mono"><?= htmlspecialchars($audit['ip_address']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- CHART SCRIPT ENGINE -->
<script>
    document.addEventListener("DOMContentLoaded", function() {
        const ctx = document.getElementById('whStockChart').getContext('2d');
        const whNames = <?= json_encode($whNames) ?>;
        const whStocks = <?= json_encode($whStocks) ?>;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: whNames,
                datasets: [{
                    label: 'Pcs Stok Kosmetik',
                    data: whStocks,
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderColor: 'rgba(245, 158, 11, 0.9)',
                    borderWidth: 1.5,
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(51, 65, 85, 0.08)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 10,
                                family: 'JetBrains Mono'
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(51, 65, 85, 0.08)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 10,
                                family: 'JetBrains Mono'
                            }
                        }
                    }
                }
            }
        });
    });
</script>
<?php
$content = ob_get_clean();
render_layout('Dashboard Utama', $content, 'dashboard');
?>
