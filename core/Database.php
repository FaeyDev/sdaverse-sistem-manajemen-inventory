<?php
// core/Database.php

class Database {
    private static $pdo = null;

    public static function connect() {
        if (self::$pdo === null) {
            $config = require __DIR__ . '/../config/database.php';
            try {
                $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['dbname']};charset={$config['charset']}";
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                self::$pdo = new PDO($dsn, $config['username'], $config['password'], $options);
                require_once __DIR__ . '/Seeder.php';
                Seeder::seedIfEmpty(self::$pdo);
            } catch (PDOException $e) {
                // Tampilkan pesan panduan mempermudah troubleshooting user di localhost
                echo "<div style='font-family: sans-serif; padding: 25px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; max-width: 600px; margin: 50px auto; color: #c53030;'>";
                echo "<h3 style='margin-top: 0;'>Galat Koneksi Database</h3>";
                echo "<p>Gagal terhubung ke MySQL: <strong>" . htmlspecialchars($e->getMessage()) . "</strong></p>";
                echo "<h4>Langkah Penyelesaian:</h4>";
                echo "<ol style='line-height: 1.6;'>";
                echo "<li>Pastikan service <strong>Apache</strong> dan <strong>MySQL</strong> di panel control XAMPP Anda sudah aktif (kondisi running).</li>";
                echo "<li>Buka <strong>http://localhost/phpmyadmin</strong> di browser Anda.</li>";
                echo "<li>Buat database baru bernama <code>" . htmlspecialchars($config['dbname']) . "</code>.</li>";
                echo "<li>Pilih database tersebut, masuk ke tab <strong>Import</strong>, lalu pilih file <code>database/schema.sql</code> dari proyek ini dan klik Go/Kirim.</li>";
                echo "<li>Jika Anda menggunakan password untuk user root, edit baris password di file <code>config/database.php</code>.</li>";
                echo "</ol>";
                echo "</div>";
                exit;
            }
        }
        return self::$pdo;
    }
}
