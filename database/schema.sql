-- -------------------------------------------------------------
-- SISTEM MANAJEMEN INVENTORI SKINCARE & MAKEUP
-- Production Database Schema (MySQL 8.0+)
-- -------------------------------------------------------------

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `system_notifications`;
DROP TABLE IF EXISTS `pricing_rules`;
DROP TABLE IF EXISTS `return_items`;
DROP TABLE IF EXISTS `returns`;
DROP TABLE IF EXISTS `transfer_items`;
DROP TABLE IF EXISTS `transfers`;
DROP TABLE IF EXISTS `supplier_products`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `stock_opnames`;
DROP TABLE IF EXISTS `stock_movements`;
DROP TABLE IF EXISTS `batch_stock`;
DROP TABLE IF EXISTS `batches`;
DROP TABLE IF EXISTS `warehouses`;
DROP TABLE IF EXISTS `product_variants`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS TABLE
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `fullname` VARCHAR(100) NOT NULL,
  `role` ENUM('Admin', 'Warehouse Staff', 'Cashier') NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. CATEGORIES TABLE (Self-Referenced Parent-Child Hierarchy)
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `parent_id` INT DEFAULT NULL,
  `description` TEXT,
  FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. PRODUCTS TABLE
CREATE TABLE `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `category_id` INT NOT NULL,
  `brand` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `image` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. PRODUCT VARIANTS TABLE (Prices mapped to shade/size variants)
CREATE TABLE `product_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `barcode` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `size` VARCHAR(50) NOT NULL,
  `shade` VARCHAR(50) DEFAULT NULL,
  `retail_price` DECIMAL(12,2) NOT NULL,
  `reseller_price` DECIMAL(12,2) NOT NULL,
  `wholesale_price` DECIMAL(12,2) NOT NULL,
  `supplier_price` DECIMAL(12,2) NOT NULL,
  `min_stock_threshold` INT NOT NULL DEFAULT 10,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. BATCH PRODUCTION TABLE
CREATE TABLE `batches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `batch_number` VARCHAR(100) NOT NULL UNIQUE,
  `production_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `is_locked` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. WAREHOUSES TABLE
CREATE TABLE `warehouses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. BATCH STOCK PER SITE LEVEL TAB
CREATE TABLE `batch_stock` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `batch_id` INT NOT NULL,
  `variant_id` INT NOT NULL,
  `warehouse_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  UNIQUE KEY `idx_batch_variant_wh` (`batch_id`, `variant_id`, `warehouse_id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. STOCK MOVEMENTS TABLE (Audit trails card of actual ins/outs)
CREATE TABLE `stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `variant_id` INT NOT NULL,
  `batch_id` INT NOT NULL,
  `warehouse_id` INT NOT NULL,
  `type` ENUM('Stok Masuk', 'Stok Keluar', 'Penjualan', 'Rusak', 'Tester', 'Adjustment', 'Transfer') NOT NULL,
  `quantity` INT NOT NULL,
  `notes` VARCHAR(255),
  `performed_by` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`),
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. STOCK OPNAMES TABLE (Reconciliation takes)
CREATE TABLE `stock_opnames` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `warehouse_id` INT NOT NULL,
  `variant_id` INT NOT NULL,
  `batch_id` INT NOT NULL,
  `system_quantity` INT NOT NULL,
  `physical_quantity` INT NOT NULL,
  `difference` INT NOT NULL,
  `notes` TEXT,
  `status` ENUM('Selesai') DEFAULT 'Selesai',
  `performed_by` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`),
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. SUPPLIERS TABLE
CREATE TABLE `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `contact_person` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20),
  `email` VARCHAR(100),
  `address` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. SHIPPED TRANSFERS LOGISTIK TABLE
CREATE TABLE `transfers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transfer_number` VARCHAR(50) NOT NULL UNIQUE,
  `from_warehouse_id` INT NOT NULL,
  `to_warehouse_id` INT NOT NULL,
  `status` ENUM('Pending', 'In Transit', 'Received') DEFAULT 'Pending',
  `notes` TEXT,
  `performed_by` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses`(`id`),
  FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `transfer_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transfer_id` INT NOT NULL,
  `variant_id` INT NOT NULL,
  `batch_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  FOREIGN KEY (`transfer_id`) REFERENCES `transfers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. RETURNS DISPATCH TABLE
CREATE TABLE `returns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `return_number` VARCHAR(50) NOT NULL UNIQUE,
  `type` ENUM('Customer', 'Supplier') NOT NULL,
  `supplier_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(100) DEFAULT NULL,
  `warehouse_id` INT NOT NULL,
  `status` ENUM('Selesai') DEFAULT 'Selesai',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `return_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `return_id` INT NOT NULL,
  `variant_id` INT NOT NULL,
  `batch_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `condition` ENUM('Cacat (Gudang Rusak)', 'Segel (Stok Jual)') NOT NULL,
  FOREIGN KEY (`return_id`) REFERENCES `returns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`),
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. PRICING RULES CONFIGS
CREATE TABLE `pricing_rules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('Clearance (Near-Expiry)', 'Tier-Customer') NOT NULL,
  `near_expiry_months` INT DEFAULT NULL,
  `discount_percent` DECIMAL(5,2) DEFAULT NULL,
  `description` TEXT,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. AUDIT TRAILING TIME LOCK TABLE
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `ip_address` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- INITIAL INVENTORI SEED DATA
-- -------------------------------------------------------------

-- Seed default user profiles (Password hashes mapped to 'bcrypt...')
INSERT INTO `users` (`username`, `email`, `fullname`, `role`, `password_hash`) VALUES
('admin', 'admin@beauty.co.id', 'Agustinov Freeze', 'Admin', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQGDIVFlYg7B77UdFm'),
('staff_iqbal', 'iqbal@beauty.co.id', 'Muhammad Iqbal', 'Warehouse Staff', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQGDIVFlYg7B77UdFm'),
('cashier_siti', 'siti@beauty.co.id', 'Siti Rahma', 'Cashier', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQGDIVFlYg7B77UdFm');

-- Seed target cosmetic warehouses
INSERT INTO `warehouses` (`name`, `location`, `code`) VALUES
('Gudang Utama Jakarta', 'Kuningan, Jakarta Selatan', 'JKT-UTAMA'),
('Cabang Surabaya Hub', 'Rungkut, Surabaya', 'SBY-HUB'),
('Hub Rusak & Retur', 'Cakung, Jakarta Timur', 'BAD-STOK');

-- Seed categories
INSERT INTO `categories` (`id`, `name`, `parent_id`, `description`) VALUES
(1, 'Skincare', NULL, 'Perawatan kulit wajah dan tubuh'),
(2, 'Toner', 1, 'Penyegar hidrasi wajah'),
(3, 'Serum', 1, 'Konsentrat nutrisi aktif'),
(4, 'Makeup', NULL, 'Kosmetik dekoratif kecantikan'),
(5, 'Lip Tint', 4, 'Pewarna bibir alami'),
(6, 'Cleanser', 1, 'Sabun pembersih wajah mikroba kulit kotoran'),
(7, 'Moisturizer', 1, 'Krim pelembab pengunci hidrasi barrier'),
(8, 'Sunscreen', 1, 'Perlindungan tabir surya anti-UV'),
(9, 'Face Mist', 1, 'Penyegar dan hidrasi instan semprotan halus'),
(10, 'Eye Cream', 1, 'Nutrisi lingkar mata lelah cerah kencang');

-- Seed suppliers
INSERT INTO `suppliers` (`id`, `name`, `contact_person`, `phone`, `email`, `address`) VALUES
(1, 'PT Beauty Global Indonesia', 'Hendra Wijaya', '081234567890', 'sales@beautyglobal.co.id', 'Kawasan Industri Jababeka, Bekasi'),
(2, 'CV Kosmetik Lokal Sejahtera', 'Amalia Safitri', '082211223344', 'admin@kosmetiklokal.com', 'Sentul Industrial Estate, Bogor'),
(3, 'Sina Cosmetics Wholesaler', 'Jimmy Chang', '089988776655', 'import@sinacosmetics.com', 'Gangnam-gu, Seoul, South Korea');

-- Seed products (Exactly 20 skincare products)
INSERT INTO `products` (`id`, `name`, `category_id`, `brand`, `description`, `image`) VALUES
(1, '5X Ceramide Barrier Moisture Gel', 7, 'Skintific', 'Pelembab wajah dengan kandungan 5 jenis Ceramide untuk merawat dan melindungi skin barrier.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200'),
(2, 'Niacinamide + Sabi Beet Brightening Serum', 3, 'Somethinc', 'Serum pencerah kulit wajah dengan kandungan Niacinamide dan Sabi White.', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=200'),
(3, 'Advanced Snail 96 Mucin Power Essence', 3, 'Cosrx', 'Essence yang diformulasikan dengan 96.3% Snail Secretion Filtrate untuk kelembutan ekstra.', 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=200'),
(4, 'Perfect UV Sunscreen Mild Milk SPF 50+', 8, 'Anessa', 'Sunscreen hypoallergenic bertekstur lembut dan cair untuk tipe kulit sensitif.', 'https://images.unsplash.com/photo-1556229174-5e42a09e45af?auto=format&fit=crop&q=80&w=200'),
(5, 'Lightening Whip Facial Foam', 6, 'Wardah', 'Sabun pembersih wajah bertekstur whip cream busa melimpah, mencerahkan kusam.', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=200'),
(6, 'Water Sleeping Mask EX', 7, 'Laneige', 'Masker tidur pelembab intensif yang bekerja semalaman untuk hidrasi maksimal.', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=200'),
(7, 'Green Tea Seed Serum', 3, 'Innisfree', 'Serum hidrasi konsentrat tinggi dari ekstrak daun teh hijau murni pulau Jeju.', 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=200'),
(8, 'Mugwort Anti Pores Acne Clay Mask', 1, 'Skintific', 'Masker lumpur mugwort untuk membantu menenangkan jerawat dan membersihkan pori mendalam.', 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?auto=format&fit=crop&q=80&w=200'),
(9, 'Low PH Gentle Jelly Cleanser', 6, 'Somethinc', 'Pembersih wajah bertekstur jelly dengan pH seimbang aman untuk skin barrier sensitif.', 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=200'),
(10, 'AHA/BHA Clarifying Treatment Toner', 2, 'Cosrx', 'Toner exfoliating ringan harian untuk mengangkat sel kulit mati dan komedo lembut.', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=200'),
(11, 'Miraculous Refining Toner', 2, 'Avoskin', 'Toner eksfoliasi dengan kandungan AHA, BHA, PHA, Niacinamide, dan Tea Tree.', 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&q=80&w=200'),
(12, 'Brightening Facial Serum', 3, 'Whitelab', 'Serum pencerah kulit wajah dengan kandungan utama Niacinamide 10% dan Collagen.', 'https://images.unsplash.com/photo-1620917670397-dc7bc43ae98a?auto=format&fit=crop&q=80&w=200'),
(13, 'Flawless Priming Water', 9, 'Studio Tropik', 'Face mist penyegar sekaligus primer makeup untuk efek kulit dewy glowing berembun.', 'https://images.unsplash.com/photo-1616683515099-2775fba18ef1?auto=format&fit=crop&q=80&w=200'),
(14, 'Centella Asiatica Face Toner', 2, 'NPURE', 'Toner wajah dengan daun pegagan asli (cica leaf) di dalamnya untuk kulit berjerawat.', 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&q=80&w=200'),
(15, 'Centella Allantoin Soothing Gel Moisturizer', 7, 'Glad2Glow', 'Moisturizer gel lidah buaya merawat kulit kemerahan dan jerawat aktif bertekstur watery.', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=200'),
(16, 'Hyalucera Moist Gel', 7, 'The Originote', 'Pelembab gel viral untuk menenangkan barrier kulit dengan Hyaluronic Acid dan Ceramide.', 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=200'),
(17, 'Retinol Barrier Cream', 7, 'Dear Me Beauty', 'Krim malam anti-aging dengan encapsulated retinol yang mengencangkan sel kulit wajah.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200'),
(18, 'Hydrasoothe Sunscreen Gel SPF45', 8, 'Azarine', 'Tabir surya bertekstur gel air yang sangat ringan, bebas alkohol dan silikon.', 'https://images.unsplash.com/photo-1556229174-5e42a09e45af?auto=format&fit=crop&q=80&w=200'),
(19, 'Game Changer Tripeptide Eye Cream', 10, 'Somethinc', 'Gel perawatan lingkar mata lelah dengan 3 jenis peptide dan aplikator keramik dingin.', 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=200'),
(20, 'Lip Therapy Rosy Lips', 1, 'Vaseline', 'Pelembab bibir beraroma mawar lembut untuk melembutkan bibir pecah-pecah kusam.', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=80&w=200');

-- Seed product_variants for the 20 products
INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `barcode`, `name`, `size`, `shade`, `retail_price`, `reseller_price`, `wholesale_price`, `supplier_price`, `min_stock_threshold`) VALUES
(1, 1, 'SKT-MOIST-30G', '8991234500018', 'Gel Pelembab Barrier', '30g', NULL, 99000.00, 89000.00, 84000.00, 75000.00, 15),
(2, 1, 'SKT-MOIST-80G', '8991234500025', 'Gel Pelembab Barrier Jumbo', '80g', NULL, 189000.00, 170000.00, 160000.00, 140000.00, 10),
(3, 2, 'SMT-NIAC-20ML', '8991234500032', 'Niacinamide Sabi Beet Serum', '20ml', NULL, 89000.00, 80000.00, 75000.00, 65000.00, 20),
(4, 2, 'SMT-NIAC-40ML', '8991234500049', 'Niacinamide Sabi Beet Serum Extra', '40ml', NULL, 149000.00, 134000.00, 125000.00, 110000.00, 15),
(5, 3, 'CSX-SNAIL-100', '8809489610116', 'Snail Mucin Power Essence', '100ml', NULL, 210000.00, 190000.00, 180000.00, 155000.00, 12),
(6, 4, 'ANS-SUN-60ML', '4909978132549', 'Perfect UV Sunscreen Milk', '60ml', NULL, 385000.00, 350000.00, 330000.00, 290000.00, 8),
(7, 5, 'WRD-WHIP-100', '8991234500056', 'Lightening Whip Facial Foam', '100ml', NULL, 35000.00, 31000.00, 29000.00, 24500.00, 25),
(8, 6, 'LNG-WSM-70ML', '8809643066368', 'Water Sleeping Mask', '70ml', NULL, 390000.00, 355000.00, 335000.00, 295000.00, 6),
(9, 7, 'INF-GTSS-80ML', '8809612852268', 'Green Tea Seed Serum', '80ml', NULL, 340000.00, 310000.00, 295000.00, 250000.00, 8),
(10, 8, 'SKT-MUGW-55G', '8991234500063', 'Mugwort Anti Pores Clay Mask', '55g', NULL, 89000.00, 80000.00, 75000.00, 65000.00, 15),
(11, 9, 'SMT-JELLY-100', '8991234500070', 'Low PH Gentle Jelly Cleanser', '100ml', NULL, 99000.00, 89000.00, 84000.00, 74000.00, 20),
(12, 10, 'CSX-AHABHA-150', '8809489610123', 'AHA/BHA Clarifying Treatment Toner', '150ml', NULL, 165000.00, 148000.00, 139000.00, 120000.00, 15),
(13, 11, 'AVS-MRT-100ML', '8991234500087', 'Miraculous Refining Toner', '100ml', NULL, 189000.00, 170000.00, 160000.00, 140000.00, 10),
(14, 12, 'WHI-BRIGHT-20', '8991234500094', 'Brightening Facial Serum', '20ml', NULL, 79000.00, 71000.00, 67000.00, 58000.00, 15),
(15, 13, 'SDT-FLW-150ML', '8991234500100', 'Flawless Priming Water Mist', '150ml', NULL, 99000.00, 89000.00, 84000.00, 75000.00, 18),
(16, 14, 'NPR-CICA-150M', '8991234500117', 'Centella Asiatica Face Toner', '150ml', NULL, 100000.00, 90000.00, 85000.00, 75000.00, 15),
(17, 15, 'G2G-CICA-30G', '8991234500124', 'Centella Soothing Gel Moisturizer', '30g', NULL, 45000.00, 40500.00, 38000.00, 32000.00, 30),
(18, 16, 'TON-HYAL-50ML', '8991234500131', 'Hyalucera Moist Gel Pelembab', '50ml', NULL, 42000.00, 37800.00, 35000.00, 30000.00, 35),
(19, 17, 'DMB-RET-30G', '8991234500148', 'Retinol Barrier Cream Anti Aging', '30g', NULL, 149000.00, 134000.00, 126000.00, 110000.00, 10),
(20, 18, 'AZR-SUN-50ML', '8991234500155', 'Hydrasoothe Sunscreen Gel', '50ml', NULL, 65000.00, 58500.00, 55000.00, 48000.00, 40),
(21, 19, 'SMT-EYE-20ML', '8991234500162', 'Game Changer Eye Cream Gel', '20ml', NULL, 145000.00, 130000.00, 122000.00, 105000.00, 12),
(22, 20, 'VSL-ROSY-7G', '8991234500179', 'Lip Therapy Rosy Lips Balm', '7g', NULL, 39000.00, 35000.00, 33000.00, 28000.00, 50);

-- Seed production batches (FEFO Tracking)
INSERT INTO `batches` (`id`, `batch_number`, `production_date`, `expiry_date`, `is_locked`) VALUES
(1, 'LOT-SKT-001', '2026-01-10', '2028-01-10', 0),
(2, 'LOT-SMT-002', '2026-02-15', '2028-02-15', 0),
(3, 'LOT-CSX-003', '2026-03-01', '2026-09-01', 0), -- Mengalami penuaan di September 2026!
(4, 'LOT-ANS-004', '2025-12-01', '2027-12-01', 0),
(5, 'LOT-GENERAL', '2026-04-01', '2028-04-01', 0);

-- Seed stock densities across multi-warehouses
INSERT INTO `batch_stock` (`batch_id`, `variant_id`, `warehouse_id`, `quantity`) VALUES
(1, 1, 1, 120),  -- SKT-MOIST-30G di JKT
(1, 1, 2, 45),   -- SKT-MOIST-30G di SBY
(1, 2, 1, 80),   -- SKT-MOIST-80G di JKT
(2, 3, 1, 95),   -- SMT-NIAC-20ML di JKT
(2, 3, 2, 60),   -- SMT-NIAC-20ML di SBY
(2, 4, 1, 40),   -- SMT-NIAC-40ML di JKT
(3, 5, 1, 150),  -- CSX-SNAIL-100 di JKT
(4, 6, 1, 5),    -- ANS-SUN-60ML di JKT -> Low Stock (di bawah threshold minimum 8)
(5, 7, 1, 200),  -- WRD-WHIP-100 di JKT
(5, 7, 2, 150),  -- WRD-WHIP-100 di SBY
(5, 8, 1, 4),    -- LNG-WSM-70ML di JKT -> Low stock (di bawah threshold minimum 6)
(5, 9, 2, 50),   -- Green Tea Seed Serum di SBY
(5, 10, 1, 12),  -- Mugwort di JKT -> Low stock (di bawah threshold minimum 15)
(5, 11, 1, 85),  -- Low PH Gentle Jelly Cleanser di JKT
(5, 12, 1, 90),  -- AHA/BHA di JKT
(5, 13, 1, 75),  -- Avoskin di JKT
(5, 14, 1, 130), -- Whitelab Serum di JKT
(5, 15, 1, 40),  -- Studio Tropik di JKT
(5, 16, 2, 80),  -- NPURE Toner di SBY
(5, 17, 1, 18),  -- Glad2Glow di JKT -> Low stock (di bawah threshold minimum 30)
(5, 18, 1, 125), -- The Originote di JKT
(5, 19, 1, 65),  -- Dear Me Retinol di JKT
(5, 20, 1, 120), -- Azarine Sunscreen di JKT
(5, 21, 1, 8),   -- Somethinc Eye Cream di JKT -> Low stock (di bawah threshold minimum 12)
(5, 22, 1, 400); -- Lip Balm di JKT

-- Seed clearance pricing rules
INSERT INTO `pricing_rules` (`name`, `type`, `near_expiry_months`, `discount_percent`, `description`) VALUES
('Diskon FEFO 3 Bulan', 'Clearance (Near-Expiry)', 3, 15.00, 'Diskon otomatis 15% untuk produk 3 bulan sebelum masa kadaluarsa.'),
('Diskon FEFO Ekstrim 1 Bulan', 'Clearance (Near-Expiry)', 1, 40.00, 'Cuci gudang diskon 40% otomatis untuk barang yang kadaluarsa dalam 30 hari.');

-- Seed warehouse transfer log records
INSERT INTO `transfers` (`id`, `transfer_number`, `from_warehouse_id`, `to_warehouse_id`, `status`, `notes`, `performed_by`) VALUES
(1, 'TF-2026-0001', 1, 2, 'Received', 'Pengiriman penyeimbang stok untuk moisturizer Skintific dan serum Somethinc.', 'Muhammad Iqbal'),
(2, 'TF-2026-0002', 1, 2, 'In Transit', 'Pengiriman tambahan tabir surya Anessa untuk cabang Surabaya.', 'Muhammad Iqbal');

INSERT INTO `transfer_items` (`transfer_id`, `variant_id`, `batch_id`, `quantity`) VALUES
(1, 1, 1, 20),
(1, 3, 2, 15),
(2, 6, 4, 10);

-- Seed stock movements histories
INSERT INTO `stock_movements` (`variant_id`, `batch_id`, `warehouse_id`, `type`, `quantity`, `notes`, `performed_by`) VALUES
(1, 1, 1, 'Stok Masuk', 140, 'Inisialisasi stok awal gudang JKT', 'Agustinov Freeze'),
(1, 1, 1, 'Transfer', -20, 'Alokasi kirim penyeimbangan ke Surabaya HUB', 'Muhammad Iqbal'),
(1, 1, 2, 'Stok Masuk', 25, 'Penerimaan mutasi logistik dari JKT', 'Muhammad Iqbal'),
(3, 2, 1, 'Stok Masuk', 110, 'Inisialisasi stok awal produk Somethinc dari CV Kosmetik Sejahtera', 'Agustinov Freeze');

-- Seed some sample audit logs
INSERT INTO `audit_logs` (`user_id`, `action`, `details`, `ip_address`) VALUES
(1, 'LOGIN_SUCCESS', 'Berhasil melakukan login ke sistem manajemen inventori utama.', '127.0.0.1'),
(1, 'DB_INIT', 'Berhasil melakukan inisialisasi catalog data awal dengan 20 item produk skin care premium.', '127.0.0.1'),
(2, 'STOCK_UPDATE', 'Menerima dan menyortir pengimbangan stok batch moisturizer Skintific di SBY.', '127.0.0.1');