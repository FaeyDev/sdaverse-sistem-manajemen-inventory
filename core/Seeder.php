<?php
// core/Seeder.php

class Seeder {
    public static function seedIfEmpty($db) {
        try {
            // Check if product_variants is already populated with 200+ items
            $stmtCount = $db->query("SELECT COUNT(*) FROM product_variants");
            $count = $stmtCount->fetchColumn();
            
            if ($count >= 200) {
                return; // Already populated
            }

            // Begin Transaction to speed up inserts and ensure atomicity
            $db->beginTransaction();

            $brands = [
                'Skintific', 'Somethinc', 'Cosrx', 'Wardah', 'Laneige', 'Innisfree', 
                'Avoskin', 'NPURE', 'The Originote', 'Dear Me Beauty', 'Azarine', 
                'Maybelline', 'Make Over', 'Emina', 'Kahf', 'Scarlett Whitening', 
                'Garnier', 'Hada Labo', 'Safi', 'Glad2Glow'
            ];

            $categories = [
                'Toner' => 2,
                'Serum' => 3,
                'Lip Tint' => 5,
                'Cleanser' => 6,
                'Moisturizer' => 7,
                'Sunscreen' => 8,
                'Face Mist' => 9,
                'Eye Cream' => 10
            ];

            $types = [
                'Toner' => [
                    'names' => ['AHA BHA Clarifying Toner', 'Ceramide Hydrate Essence', 'Mugwort Calming Essence', 'Brightening Glow Toner', 'Centella Soothing Liquid'],
                    'sizes' => ['80ml', '100ml', '150ml'],
                    'base_price' => 75000
                ],
                'Serum' => [
                    'names' => ['10% Niacinamide Sabi Bright', 'Retinol Renewal Activator', 'Salicylic Acid BHA Acne Serum', 'Vitamin C Brightening Shield', 'Hyaluronic Moisture Booster'],
                    'sizes' => ['20ml', '30ml', '50ml'],
                    'base_price' => 99000
                ],
                'Lip Tint' => [
                    'names' => ['Juicy Gloss Lip Tint', 'Plumping Sheer Lip Balm', 'Matte Velvet Lip Cream', 'Hydrating Berry Lip Oil', 'Satin Glossy Stain'],
                    'sizes' => ['4g', '6g', '8g'],
                    'base_price' => 45000
                ],
                'Cleanser' => [
                    'names' => ['Gentle Low pH Jelly Foam', 'Amino Acid Soft Cleanser', 'Salicylic Face Wash', 'Hydrating Aloe Facial Whip', 'Deep Pore Cleansing Wash'],
                    'sizes' => ['100ml', '120ml', '150ml'],
                    'base_price' => 38000
                ],
                'Moisturizer' => [
                    'names' => ['5X Ceramide Soothing Gel', 'Snail Mucin Moisture Cream', 'Bakuchiol Repair Gel-Cream', 'Pomegranate Glow Moisturizer', 'Hyalucera Overnight Balm'],
                    'sizes' => ['30g', '50g', '80g'],
                    'base_price' => 89000
                ],
                'Sunscreen' => [
                    'names' => ['Hydrasoothe Sunscreen SPF45', 'UV Protection Shield Ultra', 'Airy Matte Sun Screen SPF50', 'Aqua Jelly Sun Milk', 'Physical Broad Spectrum SPF50'],
                    'sizes' => ['40ml', '50ml', '60ml'],
                    'base_price' => 62000
                ],
                'Face Mist' => [
                    'names' => ['Flawless Priming Water Mist', 'Rose Water Glow Spritz', 'Cica Soothing Face Mist', 'Saffron Brightening Mist'],
                    'sizes' => ['100ml', '150ml'],
                    'base_price' => 55000
                ],
                'Eye Cream' => [
                    'names' => ['Game Changer Peptide Cream', 'Retinol Circle Eye Treatment', 'Caffeine Anti Fatigue Serum', 'Hydra Gel Eye Nourisher'],
                    'sizes' => ['15ml', '20ml'],
                    'base_price' => 125000
                ]
            ];

            $productCount = 0;
            $variantCount = $count;

            // Loop to generate products and variations until we have at least 220 items in total
            while ($variantCount < 210) {
                $brand = $brands[array_rand($brands)];
                $catName = array_rand($categories);
                $catId = $categories[$catName];
                
                $typeData = $types[$catName];
                $prodBaseName = $typeData['names'][array_rand($typeData['names'])];
                $prodFullName = "$brand $prodBaseName";
                
                // Keep product name realistic
                $description = "Formula premium persembahan $brand untuk kategorial $catName. Mengandung nutrisi esensial yang teruji secara klinis memperbaiki tekstur kulit, mencerahkan bintik hitam, dan memperkokoh skin barrier.";
                $placeholder_images = [
                    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=200',
                    'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=200',
                    'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=200',
                    'https://images.unsplash.com/photo-1556229174-5e42a09e45af?auto=format&fit=crop&q=80&w=200',
                    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=200',
                    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=200'
                ];
                $img = $placeholder_images[array_rand($placeholder_images)];

                // Insert Product Induk
                $stmtProd = $db->prepare("INSERT INTO products (name, category_id, brand, description, image) VALUES (:name, :category_id, :brand, :description, :image)");
                $stmtProd->execute([
                    'name' => $prodFullName,
                    'category_id' => $catId,
                    'brand' => $brand,
                    'description' => $description,
                    'image' => $img
                ]);
                
                $productId = $db->lastInsertId();
                $productCount++;

                // Add 2 or 3 variants for this product
                $numVariants = rand(2, 3);
                $sizes = $typeData['sizes'];
                shuffle($sizes);
                
                for ($i = 0; $i < $numVariants; $i++) {
                    if (empty($sizes)) break;
                    $size = array_pop($sizes);
                    
                    // Build acronym
                    $brandAcronym = strtoupper(substr($brand, 0, 3));
                    $catAcronym = strtoupper(substr($catName, 0, 4));
                    $sizeClean = strtoupper(str_replace('ml', '', str_replace('g', '', $size)));
                    
                    $sku = "SDA-$brandAcronym-$catAcronym-$sizeClean-" . rand(100, 999);
                    
                    // EAN13 dynamic barcode simulation
                    $barcode = "899" . rand(100000, 999999) . str_pad($variantCount, 3, '0', STR_PAD_LEFT);

                    $basePrice = $typeData['base_price'];
                    $variationMultiplier = rand(90, 140) / 100;
                    
                    $retailPrice = round(($basePrice * $variationMultiplier) / 1000) * 1000;
                    $resellerPrice = round(($retailPrice * 0.90) / 1000) * 1000;
                    $wholesalePrice = round(($retailPrice * 0.85) / 1000) * 1000;
                    $supplierPrice = round(($retailPrice * 0.70) / 1000) * 1000;
                    
                    $minThreshold = rand(10, 20);
                    $variantName = "Tipe Varian " . ($i + 1);

                    // Insert Variant SKU
                    $stmtVar = $db->prepare("INSERT INTO product_variants (product_id, sku, barcode, name, size, retail_price, reseller_price, wholesale_price, supplier_price, min_stock_threshold) VALUES (:product_id, :sku, :barcode, :name, :size, :retail_price, :reseller_price, :wholesale_price, :supplier_price, :min_stock_threshold)");
                    $stmtVar->execute([
                        'product_id' => $productId,
                        'sku' => $sku,
                        'barcode' => $barcode,
                        'name' => $variantName,
                        'size' => $size,
                        'retail_price' => $retailPrice,
                        'reseller_price' => $resellerPrice,
                        'wholesale_price' => $wholesalePrice,
                        'supplier_price' => $supplierPrice,
                        'min_stock_threshold' => $minThreshold
                    ]);

                    $variantId = $db->lastInsertId();
                    $variantCount++;

                    // Distribute random stocks across 3 warehouses (Jakarta + Surabaya + Damage)
                    // Jakarta Warehouse ID 1
                    // Surabaya Warehouse ID 2
                    // Damage Warehouse ID 3
                    $stmtBatchStock = $db->prepare("INSERT INTO batch_stock (batch_id, variant_id, warehouse_id, quantity) VALUES (:batch_id, :variant_id, :warehouse_id, :quantity)");
                    
                    // Batch randomly selected
                    $batchId = rand(1, 5);
                    $qtyMain = rand(60, 200);
                    $qtyHub = rand(20, 80);

                    $stmtBatchStock->execute([
                        'batch_id' => $batchId,
                        'variant_id' => $variantId,
                        'warehouse_id' => 1,
                        'quantity' => $qtyMain
                    ]);

                    $stmtBatchStock->execute([
                        'batch_id' => $batchId,
                        'variant_id' => $variantId,
                        'warehouse_id' => 2,
                        'quantity' => $qtyHub
                    ]);
                    
                    // Insert movement log
                    $stmtMov = $db->prepare("INSERT INTO stock_movements (variant_id, batch_id, warehouse_id, type, quantity, notes, performed_by) VALUES (:variant_id, :batch_id, :warehouse_id, :type, :quantity, :notes, :performed_by)");
                    $stmtMov->execute([
                        'variant_id' => $variantId,
                        'batch_id' => $batchId,
                        'warehouse_id' => 1,
                        'type' => 'Stok Masuk',
                        'quantity' => $qtyMain,
                        'notes' => 'Pemuatan batch log awal via AUTO-SEEDER SDAVerse ERP',
                        'performed_by' => 'Agustinov Freeze'
                    ]);
                }
            }

            $db->commit();
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            // Silent error or log
            error_log("Seeder execution aborted: " . $e->getMessage());
        }
    }
}
