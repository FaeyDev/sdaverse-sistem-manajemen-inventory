<?php
// index.php - Main Entry Point & Route Dispatcher

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/core/Session.php';
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Auth.php';
require_once __DIR__ . '/core/Router.php';

Session::start();

// Dapatkan rute dari URL query, default adalah dashboard
$route = $_GET['route'] ?? 'dashboard';

// Pengecualian halaman yang tidak membutuhkan autentikasi
$publicRoutes = ['login'];

if (!Auth::check() && !in_array($route, $publicRoutes)) {
    header('Location: index.php?route=login');
    exit;
}

// Redirect ke dashboard jika user yang sudah login mencoba mengakses halaman login
if (Auth::check() && $route === 'login') {
    header('Location: index.php?route=dashboard');
    exit;
}

// Jalankan sistem routing
Router::handle($route);
