<?php
// core/Middleware.php

require_once __DIR__ . '/Session.php';

class Middleware {
    public static function auth() {
        Session::start();
        if (!Session::has('user_id')) {
            header('Location: index.php?route=login');
            exit;
        }
    }

    public static function role($allowedRoles) {
        self::auth();
        $userRole = Session::get('user_role');
        
        if (is_array($allowedRoles)) {
            if (!in_array($userRole, $allowedRoles)) {
                self::unauthorized();
            }
        } else {
            if ($userRole !== $allowedRoles) {
                self::unauthorized();
            }
        }
    }

    private static function unauthorized() {
        http_response_code(403);
        echo "<div style='font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f1f5f9; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;'>";
        echo "<h1 style='color: #f59e0b; margin-bottom: 10px;'>Akses Terbatas</h1>";
        echo "<p style='color: #94a3b8; max-width: 450px; margin-bottom: 20px;'>Peran (Role) Anda saat ini tidak diizinkan untuk melihat/mengelola fitur ini sesuai aturan otorisasi sistem.</p>";
        echo "<a href='index.php?route=dashboard' style='background: #f59e0b; color: #000; font-weight: bold; padding: 10px 20px; border-radius: 8px; text-decoration: none;'>Kembali ke Dashboard</a>";
        echo "</div>";
        exit;
    }
}
