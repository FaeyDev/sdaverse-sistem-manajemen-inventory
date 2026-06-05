<?php
// views/layouts/app.php

function render_layout($title, $content, $activeRoute = 'dashboard') {
    $user = Auth::user();
    $username = $user['username'] ?? 'guest';
    $fullname = $user['fullname'] ?? 'Agustinov Freeze';
    $role = $user['role'] ?? 'Admin';
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($title) ?> | SDAVerse Beauty ERP</title>
    <!-- Tailwind CSS Engine -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Custom Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <!-- ChartJS library for dashboards -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #020617;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        .glass-panel {
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(51, 65, 85, 0.2);
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #020617;
        }
        ::-webkit-scrollbar-thumb {
            background: #1e293b;
            border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #06b6d4;
        }
    </style>
</head>
<body class="text-slate-200 min-h-screen relative overflow-x-hidden">
    <!-- Glowing Top Accent Line -->
    <div class="h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-indigo-600 w-full fixed top-0 left-0 z-50"></div>

    <!-- Mobile Sidebar Backdrop Overlay -->
    <div id="sidebarOverlay" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 hidden lg:hidden transition-all duration-300 opacity-0"></div>

    <div class="flex min-h-screen">
        
        <!-- SIDEBAR NAVIGATION MENU (Fully responsive with smooth transition) -->
        <aside id="sidebar" class="w-64 border-r border-slate-900/60 bg-slate-950/95 p-6 flex flex-col justify-between fixed h-full z-40 transition-transform duration-300 ease-out -translate-x-full lg:translate-x-0">
            <div>
                <!-- Brand logo area -->
                <div class="flex items-center justify-between gap-2 mb-8">
                    <div class="flex items-center gap-3">
                        <!-- Tiny Vector SVG Logo inside sidebar -->
                        <div class="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg relative overflow-hidden group">
                            <div class="absolute -inset-1 bg-gradient-to-tr from-cyan-500 to-purple-600 opacity-30 group-hover:opacity-60 transition duration-300"></div>
                            <svg class="w-5 h-5 z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="40" stroke="url(#sideGlow)" stroke-width="6" stroke-dasharray="10 5" />
                                <path d="M 30 35 C 20 35, 20 60, 30 65 M 50 35 L 50 65 C 65 65, 70 55, 70 45 L 50 35 M 70 30 L 80 65 L 90 25" stroke="url(#sideGradient)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
                                <defs>
                                    <linearGradient id="sideGradient" x1="0" y1="0" x2="100" y2="100">
                                        <stop offset="0%" stop-color="#22d3ee" />
                                        <stop offset="100%" stop-color="#a855f7" />
                                    </linearGradient>
                                    <linearGradient id="sideGlow" x1="0" y1="0" x2="100" y2="100">
                                        <stop offset="0%" stop-color="#06b6d4" />
                                        <stop offset="100%" stop-color="#4f46e5" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div>
                            <h1 class="font-extrabold tracking-tight text-sm text-slate-100 font-mono">SDAVerse</h1>
                            <span class="text-[9px] uppercase font-bold text-cyan-400 tracking-wider font-mono block">COSMETICS ERP</span>
                        </div>
                    </div>
                    
                    <!-- Close button for mobile and tech drawers -->
                    <button id="sidebarClose" class="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 active:scale-95 transition">
                        <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Navigation menu -->
                <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2.5 font-mono">CORE UTILITIES</p>
                <nav class="space-y-1">
                    <a href="index.php?route=dashboard" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'dashboard' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        📊 Dashboard Utama
                    </a>
                    <a href="index.php?route=products" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'products' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        💄 Katalog Produk
                    </a>
                    <a href="index.php?route=categories" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'categories' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        📂 Hierarki Kategori
                    </a>
                </nav>

                <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-5 mb-2.5 font-mono">LOGISTICS & INVENTORY</p>
                <nav class="space-y-1">
                    <a href="index.php?route=batches" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'batches' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        📅 Batch Produksi FEFO
                    </a>
                    <a href="index.php?route=warehouses" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'warehouses' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        🚛 Transfer Stok Gudang
                    </a>
                    <a href="index.php?route=suppliers" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'suppliers' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        🏢 Direktori Supplier
                    </a>
                    <a href="index.php?route=returns" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'returns' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        🔄 Retur & Adjust Stok
                    </a>
                </nav>

                <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-5 mb-2.5 font-mono">SIMULATION SOLUTIONS</p>
                <nav class="space-y-1">
                    <a href="index.php?route=pricing" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'pricing' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        🏷️ Simulator Harga FEFO
                    </a>
                    <a href="index.php?route=barcode" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'barcode' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        ⚡ Simulator Laser Barcode
                    </a>
                    <a href="index.php?route=audit" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition <?= $activeRoute === 'audit' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60' ?>">
                        🛡️ Log Audit Server
                    </a>
                </nav>
            </div>

            <!-- Profile and Logout triggers -->
            <div class="pt-5 border-t border-slate-900/80">
                <a href="index.php?route=profile" class="flex items-center gap-3 mb-4 p-2 rounded-xl bg-slate-900/20 hover:bg-cyan-500/5 border border-transparent hover:border-cyan-500/20 transition duration-200 group cursor-pointer block">
                    <div class="flex items-center gap-3">
                        <div class="h-9 w-9 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-cyan-400 font-mono text-xs uppercase shadow-inner group-hover:border-cyan-500/30 transition-colors">
                            <?php if (!empty($user['avatar'])): ?>
                                <img src="<?= $user['avatar'] ?>" alt="" class="w-full h-full object-cover" referrerPolicy="no-referrer">
                            <?php else: ?>
                                <?= substr(htmlspecialchars($fullname), 0, 2) ?>
                            <?php endif; ?>
                        </div>
                        <div class="overflow-hidden">
                            <span class="block font-bold text-xs text-slate-200 truncate leading-tight group-hover:text-cyan-400 transition-colors"><?= htmlspecialchars($fullname) ?></span>
                            <span class="text-[9px] uppercase font-mono text-cyan-400 leading-none font-semibold block mt-0.5 group-hover:text-cyan-300 transition-colors"><?= htmlspecialchars($role) ?></span>
                        </div>
                    </div>
                </a>
                <a href="index.php?route=logout" class="block w-full text-center py-2 bg-slate-950 hover:bg-cyan-500 hover:text-black border border-slate-850 hover:border-cyan-400 text-xs text-slate-400 font-extrabold rounded-xl transition duration-200">
                    Selesaikan Sesi (Logout)
                </a>
            </div>
        </aside>

        <!-- CORE MAIN VIEW CONTENT -->
        <main class="flex-1 ml-0 lg:ml-64 p-4 sm:p-8 min-h-screen flex flex-col justify-between transition-all duration-300">
            <div>
                <!-- Topbar metadata header with Burger Trigger and Global Search -->
                <header class="flex flex-col md:flex-row gap-4 md:justify-between md:items-center pb-6 mb-8 border-b border-slate-900/60">
                    <div class="flex items-center gap-3">
                        <!-- Sidebar Burger Menu trigger (Visually hidden on large screen desktops) -->
                        <button id="sidebarToggle" class="lg:hidden p-2 bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-400 rounded-xl transition cursor-pointer flex items-center justify-center">
                            <svg class="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <h2 class="text-lg sm:text-xl font-bold tracking-tight text-white mb-0.5 font-sans"><?= htmlspecialchars($title) ?></h2>
                            <span class="text-[10px] text-slate-500 font-mono block">SDAVerse Desk ERP | Tanggal Simulasi: 2026-06-05</span>
                        </div>
                    </div>

                    <!-- Global ERP Search Filter Form -->
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <form method="GET" action="index.php" class="relative flex-1 sm:max-w-xs md:max-w-md">
                            <input type="hidden" name="route" value="products">
                            <div class="relative">
                                <span class="absolute inset-y-0 left-3 flex items-center text-slate-500 text-xs pointer-events-none">
                                    🔍
                                </span>
                                <input type="text" 
                                       name="search" 
                                       value="<?= htmlspecialchars($_GET['search'] ?? '') ?>"
                                       placeholder="Cari SKU / Brand / Produk..." 
                                       class="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 transition duration-200">
                                <?php if (!empty($_GET['search'])): ?>
                                    <a href="index.php?route=products" class="absolute inset-y-0 right-2.5 flex items-center text-slate-500 hover:text-slate-300 text-[10px]">
                                        ✕
                                    </a>
                                <?php endif; ?>
                            </div>
                        </form>

                        <!-- DB Connection Signal Indicators -->
                        <div class="flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-900/60 border border-slate-850 rounded-xl text-[10px] font-mono">
                            <div class="flex items-center gap-1.5">
                                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span class="text-slate-400">PDO-MYSQL:</span>
                                <span class="text-emerald-400 font-medium whitespace-nowrap">READY</span>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Page core content area -->
                <div class="animate-fadeIn">
                    <?= $content ?>
                </div>
            </div>

            <!-- ERP Footer brand credits -->
            <footer class="mt-12 pt-6 border-t border-slate-900/60 flex flex-col sm:flex-row gap-4 justify-between items-center text-[10px] text-slate-500">
                <p>&copy; 2026 SDAVerse. Terprogram untuk manajemen inventori kosmetik.</p>
                <div class="flex items-center gap-3 font-mono text-[9px]">
                    <span>PHP 8.x (Apache)</span>
                    <span>•</span>
                    <span>MySQL (Active PDO)</span>
                </div>
            </footer>
        </main>
    </div>

    <!-- Client JS for Mobile Toggle Menu -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.getElementById('sidebarToggle');
            const close = document.getElementById('sidebarClose');
            const overlay = document.getElementById('sidebarOverlay');

            function toggleSidebar() {
                const isHidden = sidebar.classList.contains('-translate-x-full');
                if (isHidden) {
                    sidebar.classList.remove('-translate-x-full');
                    overlay.classList.remove('hidden');
                    overlay.offsetWidth; // Force Layout Repaint
                    overlay.classList.remove('opacity-0');
                    overlay.classList.add('opacity-100');
                    document.body.style.overflow = 'hidden';
                } else {
                    sidebar.classList.add('-translate-x-full');
                    overlay.classList.remove('opacity-100');
                    overlay.classList.add('opacity-0');
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                    }, 300);
                    document.body.style.overflow = '';
                }
            }

            if (toggle) toggle.addEventListener('click', toggleSidebar);
            if (close) close.addEventListener('click', toggleSidebar);
            if (overlay) overlay.addEventListener('click', toggleSidebar);
        });
    </script>
</body>
</html>
<?php
}
?>
