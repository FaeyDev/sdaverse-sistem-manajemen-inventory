<?php
// views/audit/index.php

require_once __DIR__ . '/../../core/Database.php';
require_once __DIR__ . '/../../core/Middleware.php';
require_once __DIR__ . '/../../views/layouts/app.php';

Middleware::auth();

$db = Database::connect();

// Ambil log audit dengan detail user dan rolenya
$stmt = $db->query("
    SELECT al.*, u.fullname, u.role
    FROM audit_logs al
    JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
");
$logs = $stmt->fetchAll();

ob_start();
?>
<div class="glass-panel p-6 rounded-3xl animate-fade-in mb-8">
    <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5 border-b border-slate-900 pb-3">
        🛡️ Log Otorisasi Transaksi & Sesi Masuk Server
    </h3>
    <p class="text-[11px] text-slate-400 mb-6 leading-relaxed font-light text-justify">
        Jejak audit permanen (audit trail) merekam seluruh aktivitas sensitif seperti otorisasi login, modifikasi level stok manual, pengiriman mutasi antar cabang, hingga diskon penuaan FEFO demi menjamin keterlacakan akuntansi audit internal.
    </p>

    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs font-mono">
            <thead>
                <tr class="border-b border-slate-900 text-slate-450 uppercase text-[9px] font-bold">
                    <th class="p-4">Tanggal & Waktu</th>
                    <th class="p-4">Nama Operator</th>
                    <th class="p-4">Role Akses</th>
                    <th class="p-4">Aktivitas</th>
                    <th class="p-4 font-sans">Keterangan Detail Sesi</th>
                    <th class="p-4">IP Address</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/30">
                <?php if (empty($logs)): ?>
                    <tr>
                        <td colspan="6" class="p-4 text-center text-slate-500 italic font-sans text-xs animate-none">Belum ada riwayat terekam di database.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($logs as $log): ?>
                        <tr class="hover:bg-slate-900/10">
                            <td class="p-4 text-slate-500"><?= htmlspecialchars($log['created_at']) ?></td>
                            <td class="p-4 text-slate-200 font-sans font-semibold"><?= htmlspecialchars($log['fullname']) ?></td>
                            <td class="p-4">
                                <span class="px-2 py-0.5 rounded text-[8px] font-bold uppercase font-sans border <?= $log['role'] === 'Admin' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/15' : 'bg-slate-800 text-slate-400 border-slate-750' ?>">
                                    <?= htmlspecialchars($log['role']) ?>
                                </span>
                            </td>
                            <td class="p-4 font-bold text-cyan-400 uppercase text-[9px]"><?= htmlspecialchars($log['action']) ?></td>
                            <td class="p-4 text-slate-400 font-light font-sans max-w-xs truncate"><?= htmlspecialchars($log['details'] ?? '-') ?></td>
                            <td class="p-4 text-slate-500"><?= htmlspecialchars($log['ip_address']) ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
<?php
$content = ob_get_clean();
render_layout('Sistem Audit Trail Keamanan', $content, 'audit');
?>
