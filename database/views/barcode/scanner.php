<?php
// views/barcode/scanner.php

require_once __DIR__ . '/../../core/Database.php';
require_once __DIR__ . '/../../core/Middleware.php';
require_once __DIR__ . '/../../views/layouts/app.php';
require_once __DIR__ . '/../../core/AuditLog.php';

Middleware::auth();

$db = Database::connect();
$success = '';
$error = '';

// Ambil semua variasi produk kosmetik dengan data harga ritel
$stmt = $db->query("
    SELECT pv.id, pv.sku, pv.barcode, pv.name as variant_name, pv.retail_price, p.name as product_name, p.brand, p.image
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    ORDER BY pv.id ASC
");
$variants = $stmt->fetchAll();

// Cek apakah cetak di-spool
$printedFormat = 'EAN13';
$printedVariantId = 0;
$printedCopies = 1;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $variantId = (int)($_POST['variant_id'] ?? 0);
    $copies = (int)($_POST['copies'] ?? 1);
    $format = $_POST['format'] ?? 'EAN13';

    if ($variantId > 0) {
        $stmtSearch = $db->prepare("
            SELECT pv.*, p.name as product_name, p.brand 
            FROM product_variants pv 
            JOIN products p ON pv.product_id = p.id 
            WHERE pv.id = :id LIMIT 1
        ");
        $stmtSearch->execute(['id' => $variantId]);
        $item = $stmtSearch->fetch();
        if ($item) {
            $printedVariantId = $variantId;
            $printedCopies = $copies;
            $printedFormat = $format;
            $success = "🖨️ Thermal Spooler Terkirim: Berhasil mencetak " . $copies . " salinan stiker label " . $format . " untuk [" . htmlspecialchars($item['sku']) . "] ke antrean XPrinter/TSC USB Desktop.";
            AuditLog::write('Cetak Barcode', 'Mencetak ' . $copies . ' lbr stiker label barcode ' . $format . ' untuk varian ' . $item['sku'] . ' (Harga: Rp ' . number_format($item['retail_price'], 0, ',', '.') . ')');
        } else {
            $error = 'Varian SKU tidak ditemukan!';
        }
    } else {
        $error = 'Pilih SKU produk yang sah sebelum mencetak!';
    }
}

// Cek apakah ada barcode yang dipindai via query param
$scannedItem = null;
$scannedSku = $_GET['scan_barcode'] ?? '';
if (!empty($scannedSku)) {
    $searchStmt = $db->prepare("
        SELECT pv.*, p.name as product_name, p.brand, p.image
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.barcode = :barcode OR pv.sku = :sku LIMIT 1
    ");
    $searchStmt->execute(['barcode' => $scannedSku, 'sku' => $scannedSku]);
    $scannedItem = $searchStmt->fetch();
}

ob_start();
?>
<!-- Include JsBarcode Library securely from standard CDN -->
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>

<div class="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
    
    <!-- LEFT PANEL: Laser Scanner Simulator -->
    <div class="glass-panel p-6 rounded-3xl xl:col-span-6 flex flex-col justify-between">
        <div>
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    ⚡ Simulator Pemindai Optik Sinar Laser POS
                </h3>
                <span class="text-[9px] bg-cyan-950 text-cyan-400 font-mono font-bold uppercase rounded border border-cyan-800/40 px-2 py-0.5 leading-none">
                    Hardware Mode
                </span>
            </div>
            
            <p class="text-[11px] text-slate-400 mb-6 font-light leading-normal">
                Peralatan virtual simulasi pembaca kode batang. Ketik barcode secara manual di kolom input atau klik langsung pintasan SKU bawaan untuk memicu sorotan sinar laser optis POS. No Barcode EAN-13 bawaan adalah 13 digit angka yang merender grafis scannable.
            </p>

            <!-- Manual input simulation trigger -->
            <form method="GET" action="index.php" class="flex gap-2 mb-5">
                <input type="hidden" name="route" value="barcode">
                <div class="relative flex-1">
                    <span class="absolute inset-y-0 left-3 flex items-center pr-1 text-slate-500 text-xs">
                        🔍
                    </span>
                    <input type="text" 
                           name="scan_barcode" 
                           placeholder="Masukkan Barcode / SKU (contoh: 8991234500018 / SKT-MOIST-30G)" 
                           class="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition"
                           value="<?= htmlspecialchars($scannedSku) ?>">
                </div>
                <button type="submit" class="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-400 text-xs font-extrabold text-slate-350 rounded-xl transition duration-200 cursor-pointer">
                    Picu Laser
                </button>
            </form>

            <!-- The Interactive Hologram sight box of scanner emulation -->
            <div class="relative h-48 rounded-2xl bg-slate-950 border border-slate-850 flex flex-col items-center justify-center overflow-hidden mb-6 shadow-2xl">
                <!-- Laser line bounce animation -->
                <div class="absolute left-0 w-full h-[2px] bg-red-500 shadow-[0_0_12px_#ef4444] animate-bounce z-10"></div>
                
                <!-- Scanner Ambient Screen Glow Grid -->
                <div class="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.45)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                <?php if ($scannedItem): ?>
                    <!-- Physical visual sticker rendered inside active scan chamber (Uses Canvas for 100% Sandbox/IFrame Display stability) -->
                    <div class="z-10 bg-white p-3.5 rounded-xl border-2 border-dashed border-cyan-500/30 flex flex-col items-center justify-center shadow-2xl animate-[scale_0.2s_ease-out]">
                        <span class="text-[8px] font-extrabold text-slate-400 font-mono tracking-wider block mb-1 uppercase">
                            <?= htmlspecialchars($scannedItem['brand']) ?> - <?= htmlspecialchars($scannedItem['sku']) ?>
                        </span>
                        
                        <!-- Visual Laser Code Bars Canvas -->
                        <canvas id="visual_scanned_barcode_canvas" class="mx-auto block"></canvas>
                        
                        <span class="text-[9px] font-bold text-cyan-600 mt-1 font-mono uppercase bg-cyan-50 px-2 py-0.5 rounded leading-none">
                            Success Verified
                        </span>
                    </div>
                <?php else: ?>
                    <!-- Standby State with faded template barcode canvas -->
                    <div class="z-10 text-center flex flex-col items-center justify-center opacity-50 hover:opacity-75 transition duration-300">
                        <canvas id="standby_barcode_canvas" class="mx-auto block filter grayscale brightness-90 mb-2"></canvas>
                        <span class="text-[9px] font-mono tracking-widest text-slate-300 uppercase font-bold">Menunggu Input Pembaca Sinar...</span>
                        <span class="text-[9px] font-mono text-slate-500 block mt-0.5">SILAKAN KLIK PINTASAN SKU DI BAWAH</span>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Instant barcode shortcut trigger buttons grid -->
            <div class="flex items-center justify-between mb-2">
                <p class="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">⚡ PINTASAN INSTAN SKU KOSMETIK GUDANG:</p>
                <span class="text-[9px] text-slate-500 font-mono">Daftar SKU Aktif</span>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-900 pr-2">
                <?php foreach ($variants as $v): ?>
                    <a href="index.php?route=barcode&scan_barcode=<?= urlencode($v['barcode']) ?>" 
                       class="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-850/80 hover:border-cyan-500/50 hover:text-cyan-400 text-slate-350 text-left text-[10px] truncate transition cursor-pointer flex items-center justify-between <?= ($scannedSku === $v['barcode'] || $scannedSku === $v['sku']) ? 'border-cyan-500 bg-cyan-500/5 text-cyan-300 font-bold' : '' ?>">
                        <span class="truncate">📦 <?= htmlspecialchars($v['sku']) ?></span>
                        <span class="text-[8px] font-mono opacity-50 px-1 py-0.5 bg-slate-950 rounded border border-slate-800 ml-1">EAN</span>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- Scan result metadata board -->
        <?php if ($scannedItem): ?>
            <div class="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl mt-5 flex gap-4 animate-[fade-in_0.3s_ease]">
                <div class="w-16 h-16 rounded-xl bg-slate-950 border border-slate-850 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    <?php if (!empty($scannedItem['image'])): ?>
                        <img src="<?= htmlspecialchars($scannedItem['image']) ?>" alt="" class="object-cover w-full h-full" referrerPolicy="no-referrer">
                    <?php else: ?>
                        <span class="text-[9px] text-slate-600 font-mono text-center">NO IMAGE</span>
                    <?php endif; ?>
                </div>
                <div class="text-xs space-y-1 overflow-hidden flex-1">
                    <div class="flex items-center justify-between">
                        <span class="text-[8px] font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-bold leading-none inline-block">
                            <?= htmlspecialchars($scannedItem['brand']) ?>
                        </span>
                        <span class="text-[8px] font-mono text-slate-500">DATABASE RECORD MATCH</span>
                    </div>
                    
                    <h4 class="font-extrabold text-slate-100 truncate text-xs"><?= htmlspecialchars($scannedItem['product_name']) ?></h4>
                    <p class="text-[10px] text-slate-400 flex justify-between pr-2 border-b border-slate-900 pb-1">
                        <span>Variasi: <?= htmlspecialchars($scannedItem['name']) ?> (<?= htmlspecialchars($scannedItem['size']) ?>)</span>
                        <strong class="font-mono text-cyan-400">Rp <?= number_format($scannedItem['retail_price'], 0, ',', '.') ?></strong>
                    </p>
                    <div class="flex items-center justify-between pt-1">
                        <span class="text-[9px] font-mono text-slate-500">KODE BARCODE: <?= htmlspecialchars($scannedItem['barcode']) ?></span>
                        <a href="index.php?route=products&search=<?= urlencode($scannedItem['sku']) ?>" class="text-[9px] text-cyan-400 hover:underline font-bold">Sunting Stok &rarr;</a>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>

    <!-- RIGHT PANEL: Sticker Label Thermal Roll printer -->
    <div class="glass-panel p-6 rounded-3xl xl:col-span-6 flex flex-col justify-between">
        <div>
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-1.5">
                    🖨️ Desain Pelabelan & Label Stiker Harga Thermal
                </h3>
                <span class="text-[9px] bg-emerald-950 text-emerald-400 font-mono font-bold uppercase rounded border border-emerald-800/40 px-2 py-0.5 leading-none font-bold">
                    Spooler: Ready
                </span>
            </div>
            
            <p class="text-[11px] text-slate-400 mb-6 font-light leading-normal">
                Buat dan cetak stiker penamaan boks skincare/makeup sesuai dimensi thermal roll standar (58mm x 40mm). Sistem akan merender visual barcode scannable yang bisa di-scan oleh kamera hp maupun laser kasir fisik.
            </p>

            <?php if ($success): ?>
                <div class="mb-4 p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-emerald-400 text-xs text-center font-medium leading-normal animate-fade-in">
                    <?= htmlspecialchars($success) ?>
                </div>
            <?php endif; ?>

            <?php if ($error): ?>
                <div class="mb-4 p-3.5 rounded-xl bg-red-950/25 border border-red-500/25 text-red-500 text-xs text-center font-medium leading-normal animate-fade-in">
                    <?= htmlspecialchars($error) ?>
                </div>
            <?php endif; ?>

            <form id="barcodePrintForm" method="POST" action="" class="space-y-4">
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1.5 font-bold uppercase">PILIH VARIASI PRODUK KOSMETIK (SKU)</label>
                    <select id="variant_selector" name="variant_id" required class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/80 transition" onchange="updateThermalPreview()">
                        <option value="">-- SILAKAN PILIH SKU BARANG --</option>
                        <?php foreach ($variants as $v): ?>
                            <option value="<?= $v['id'] ?>" <?= ($printedVariantId === $v['id'] || (isset($_GET['autopick']) && $_GET['autopick'] == $v['id'])) ? 'selected' : '' ?>>
                                [<?= htmlspecialchars($v['sku']) ?>] - <?= htmlspecialchars($v['brand']) ?> <?= htmlspecialchars($v['product_name']) ?> (<?= htmlspecialchars($v['variant_name']) ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[9px] text-slate-400 font-mono block mb-1.5 font-bold uppercase">SALINAN CETAK (QTY)</label>
                        <input type="number" min="1" max="100" name="copies" id="print_copies_input" value="<?= $printedCopies ?>" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/80 transition">
                    </div>
                    <div>
                        <label class="text-[9px] text-slate-400 font-mono block mb-1.5 font-bold uppercase">STANDARD FORMAT KODE</label>
                        <select name="format" id="barcode_format_select" class="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/80 transition" onchange="updateThermalPreview()">
                            <option value="EAN13" <?= $printedFormat === 'EAN13' ? 'selected' : '' ?>>EAN-13 (Ritel Nasional)</option>
                            <option value="CODE128" <?= $printedFormat === 'CODE128' ? 'selected' : '' ?>>CODE-128 (Logistik Bebas)</option>
                        </select>
                    </div>
                </div>

                <!-- LIVE THERMAL STICKER GENERATOR TICKET (High Fidelity Preview) -->
                <div>
                     <span class="text-[9px] text-slate-400 font-mono block mb-2 font-bold uppercase">👁️ PRATINJAU DESAIN STIKER FISIK (REAL-TIME THERMAL):</span>
                     
                     <div class="relative bg-slate-950/40 p-6 rounded-2xl border border-slate-900 flex justify-center items-center overflow-hidden">
                         
                         <!-- Behind Printer Paper Outlet Simulator Container -->
                         <div id="printer_outlet_slot" class="w-full max-w-xs bg-slate-950 border-b-4 border-slate-800 rounded-lg py-1 px-3 shadow-inner text-center text-[8px] font-mono text-slate-600 uppercase mb-4 absolute top-0 z-20">
                             Slot Keluar Kertas Thermal 
                         </div>

                         <!-- Simulated Thermal Sticker Paper Roll -->
                         <div id="sticker_preview_paper" class="w-full max-w-[200px] bg-white text-slate-950 rounded shadow-2xl p-4 transition-all duration-300 transform scale-100 border border-slate-300 mt-2 z-10 select-none">
                             
                             <div class="border-b border-dashed border-slate-300 pb-1.5 text-center">
                                 <span id="label_brand" class="text-[10px] font-bold font-mono tracking-widest text-cyan-850 block uppercase">BRAND</span>
                                 <h4 id="label_name" class="text-[11px] font-bold text-slate-900 leading-tight truncate">Nama Kategori Produk</h4>
                                 <p id="label_variant" class="text-[8px] text-slate-500 leading-none mt-0.5">Varian: -</p>
                             </div>

                             <!-- Clean High Contrast Barcode Render Area -->
                             <div class="py-2.5 flex items-center justify-center bg-white min-h-[75px]">
                                 <canvas id="sticker_barcode_canvas" class="mx-auto block"></canvas>
                             </div>

                             <div class="border-t border-dashed border-slate-300 pt-1.5 flex justify-between items-center text-[10px]">
                                 <div class="text-left">
                                     <span class="text-[6.5px] font-bold text-slate-400 block tracking-none font-sans uppercase">SKU IDENTIFIER</span>
                                     <span id="label_sku" class="font-mono font-bold text-slate-700 text-[8px]">SKU-CODE</span>
                                 </div>
                                 <div class="text-right">
                                     <span class="text-[6.5px] font-bold text-slate-400 block tracking-none font-sans uppercase">HARGA RITEL</span>
                                     <span id="label_price" class="font-sans font-extrabold text-slate-950 text-[10px]">Rp 0</span>
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>
                
                <button type="submit" class="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 duration-150 font-extrabold text-xs text-white rounded-xl transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5 ">
                    🖨️ Kirim & Cetak ke Printer Thermal USB
                </button>
            </form>
        </div>

        <div class="mt-6 pt-5 border-t border-slate-900 flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>SPOOLER ID: XPRINTER-USB-01</span>
            <span class="text-cyan-400 font-bold uppercase">Online & Spooled</span>
        </div>
    </div>
</div>

<script>
    // Pass the server-side generated variants array directly to client JS
    const databaseVariants = <?= json_encode($variants) ?>;

    /**
     * Renders Standby Barcode automatically in the laser simulator panel via Canvas
     */
    function renderStandbyBarcode() {
        const standbyCanvas = document.getElementById('standby_barcode_canvas');
        if (standbyCanvas) {
            try {
                JsBarcode("#standby_barcode_canvas", "STANDBY-01", {
                    format: "CODE128",
                    lineColor: "#475569", // slate-600
                    width: 1.5,
                    height: 35,
                    displayValue: false,
                    background: "transparent",
                    margin: 2
                });
            } catch (e) {
                console.error("Standby barcode render failed:", e);
            }
        }
    }

    /**
     * Renders Active scanned barcode if the server PHP matched any item via laser scanner
     */
    function renderScannedBarcode() {
        const scannedCanvas = document.getElementById('visual_scanned_barcode_canvas');
        if (scannedCanvas) {
            const rawCode = "<?= $scannedItem['barcode'] ?? '' ?>";
            if (!rawCode) return;
            
            const standardSelect = rawCode.length === 13 ? "EAN13" : "CODE128";
            
            try {
                JsBarcode("#visual_scanned_barcode_canvas", rawCode, {
                    format: standardSelect,
                    lineColor: "#0f172a", // slate-900
                    width: 1.8,
                    height: 50,
                    displayValue: true,
                    font: "monospace",
                    fontSize: 10,
                    margin: 4,
                    background: "#ffffff"
                });
            } catch (err) {
                // Fallback to code 128 if EAN format has bad checksum constraint
                try {
                    JsBarcode("#visual_scanned_barcode_canvas", rawCode, {
                        format: "CODE128",
                        lineColor: "#0f172a",
                        width: 1.8,
                        height: 50,
                        displayValue: true,
                        font: "monospace",
                        fontSize: 10,
                        margin: 4,
                        background: "#ffffff"
                    });
                } catch (fallbackErr) {
                    console.error("All barcode render options failed:", fallbackErr);
                }
            }
        }
    }

    /**
     * Live Updates the simulated paper sticker based on selected option
     */
    function updateThermalPreview() {
        const selector = document.getElementById('variant_selector');
        const chosenId = parseInt(selector.value);
        const formatSelect = document.getElementById('barcode_format_select').value;
        const paper = document.getElementById('sticker_preview_paper');

        if (!chosenId) {
            // Set empty standby preview values
            document.getElementById('label_brand').innerText = "BRAND";
            document.getElementById('label_name').innerText = "Silakan Pilih SKU Kosmetik";
            document.getElementById('label_variant').innerText = "Varian: -";
            document.getElementById('label_sku').innerText = "SKU-CODE";
            document.getElementById('label_price').innerText = "Rp 0";
            
            // Render placeholder barcode
            try {
                JsBarcode("#sticker_barcode_canvas", "CHOOSE-SKU-NOW", {
                    format: "CODE128",
                    lineColor: "#cbd5e1", // slate-300
                    width: 1.5,
                    height: 45,
                    displayValue: false,
                    background: "transparent",
                    margin: 0
                });
            } catch(e){}
            
            paper.style.opacity = "0.45";
            return;
        }

        // Find the matched object
        const itemObj = databaseVariants.find(item => parseInt(item.id) === chosenId);
        if (itemObj) {
            paper.style.opacity = "1";
            
            // Fill thermal sticker texts
            document.getElementById('label_brand').innerText = itemObj.brand.toUpperCase();
            document.getElementById('label_name').innerText = itemObj.product_name;
            document.getElementById('label_variant').innerText = "Spek: " + itemObj.variant_name;
            document.getElementById('label_sku').innerText = itemObj.sku;
            
            // Format IDR Price currency helper
            const priceVal = parseInt(itemObj.retail_price);
            const formattedPrice = "Rp " + priceVal.toLocaleString('id-ID');
            document.getElementById('label_price').innerText = formattedPrice;

            // Generate live high contrast barcode inside thermal preview Canvas
            const barcodeString = itemObj.barcode;
            
            try {
                JsBarcode("#sticker_barcode_canvas", barcodeString, {
                    format: formatSelect,
                    lineColor: "#000000",
                    width: 1.4,
                    height: 44,
                    displayValue: true,
                    font: "sans-serif",
                    fontSize: 8,
                    background: "#ffffff",
                    margin: 2
                });
            } catch(ecc) {
                // Fallback to CODE-128 is clean for validation bypass
                try {
                    JsBarcode("#sticker_barcode_canvas", barcodeString, {
                        format: "CODE128",
                        lineColor: "#000000",
                        width: 1.4,
                        height: 44,
                        displayValue: true,
                        font: "sans-serif",
                        fontSize: 8,
                        background: "#ffffff",
                        margin: 2
                    });
                } catch(ecc2) {
                    console.error("Barcode formulation failed render:", ecc2);
                }
            }
            
            // Feed-out micro-animation simulation triggers
            paper.classList.remove('animate-[slide-down_0.4s_ease-out]');
            void paper.offsetWidth; // trigger reflow
            paper.classList.add('animate-[slide-down_0.4s_ease-out]');
        }
    }

    // Initialize triggers on page load
    document.addEventListener("DOMContentLoaded", function() {
        renderStandbyBarcode();
        renderScannedBarcode();
        updateThermalPreview();
    });
</script>

<style>
    /* CSS slide-down paper ejection frame effects */
    @keyframes slide-down {
        0% {
            transform: translateY(-25px) scale(0.95);
            opacity: 0.3;
        }
        100% {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
    }
</style>

<?php
$content = ob_get_clean();
render_layout('Barcode & Thermal Spooler', $content, 'barcode');
?>
