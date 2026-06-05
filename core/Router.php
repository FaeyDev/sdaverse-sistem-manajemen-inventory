<?php
// core/Router.php

class Router {
    public static function handle($route) {
        switch ($route) {
            case 'login':
                require_once __DIR__ . '/../views/auth/login.php';
                break;
            case 'logout':
                require_once __DIR__ . '/Auth.php';
                Auth::logout();
                header('Location: index.php?route=login');
                break;
            case 'dashboard':
                require_once __DIR__ . '/../views/dashboard/index.php';
                break;
            case 'products':
                require_once __DIR__ . '/../views/products/index.php';
                break;
            case 'categories':
                require_once __DIR__ . '/../views/categories/index.php';
                break;
            case 'batches':
                require_once __DIR__ . '/../views/batches/index.php';
                break;
            case 'warehouses':
                require_once __DIR__ . '/../views/warehouses/index.php';
                break;
            case 'suppliers':
                require_once __DIR__ . '/../views/suppliers/index.php';
                break;
            case 'returns':
                require_once __DIR__ . '/../views/returns/customer.php';
                break;
            case 'pricing':
                require_once __DIR__ . '/../views/pricing/index.php';
                break;
            case 'audit':
                require_once __DIR__ . '/../views/audit/index.php';
                break;
            case 'barcode':
                require_once __DIR__ . '/../views/barcode/scanner.php';
                break;
            case 'profile':
                require_once __DIR__ . '/../views/auth/profile.php';
                break;
            default:
                header('Location: index.php?route=dashboard');
                break;
        }
    }
}
