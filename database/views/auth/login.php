<?php
// views/auth/login.php

require_once __DIR__ . '/../../core/Auth.php';
require_once __DIR__ . '/../../core/AuditLog.php';

$error = '';
$success = '';

// Tentukan mode tampilan default: 'login' atau 'register'
$mode = $_GET['action'] ?? 'login';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'login';

    if ($action === 'register') {
        $username = trim($_POST['username'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $fullname = trim($_POST['fullname'] ?? '');
        $role = $_POST['role'] ?? 'Cashier';
        $password = $_POST['password'] ?? '';
        $password_confirm = $_POST['password_confirm'] ?? '';

        // Validasi input
        if (empty($username) || empty($email) || empty($fullname) || empty($password)) {
            $error = 'Semua field wajib diisi untuk mendaftarkan akun!';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = 'Format email yang dimasukkan tidak valid!';
        } elseif (strlen($password) < 6) {
            $error = 'Password minimal harus terdiri dari 6 karakter!';
        } elseif ($password !== $password_confirm) {
            $error = 'Konfirmasi password tidak cocok!';
        } elseif (!in_array($role, ['Admin', 'Warehouse Staff', 'Cashier'])) {
            $error = 'Role yang dipilih tidak sah!';
        } else {
            try {
                $db = Database::connect();
                
                // Cek keunikan username
                $stmtCheckUser = $db->prepare("SELECT id FROM users WHERE username = :username LIMIT 1");
                $stmtCheckUser->execute(['username' => $username]);
                if ($stmtCheckUser->fetch()) {
                    $error = 'Username "' . htmlspecialchars($username) . '" sudah digunakan! Pilih username lain.';
                } else {
                    // Cek keunikan email
                    $stmtCheckEmail = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
                    $stmtCheckEmail->execute(['email' => $email]);
                    if ($stmtCheckEmail->fetch()) {
                        $error = 'Email "' . htmlspecialchars($email) . '" sudah terdaftar!';
                    } else {
                        // Daftarkan Akun Baru
                        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
                        $stmtInsert = $db->prepare("INSERT INTO users (username, email, fullname, role, password_hash) VALUES (:username, :email, :fullname, :role, :password_hash)");
                        $stmtInsert->execute([
                            'username' => $username,
                            'email' => $email,
                            'fullname' => $fullname,
                            'role' => $role,
                            'password_hash' => $passwordHash
                        ]);
                        
                        $userId = $db->lastInsertId();
                        
                        // Sukses, otomatis masuk atau infokan ke user
                        Session::set('user_id', $userId);
                        Session::set('user_username', $username);
                        Session::set('user_fullname', $fullname);
                        Session::set('user_role', $role);
                        
                        AuditLog::write('Pendaftaran Berhasil', 'Akun baru mendaftar: ' . $fullname . ' (' . $role . ')');
                        
                        // Berikan pesan sukses lalu arahkan ke dashboard
                        header('Location: index.php?route=dashboard');
                        exit;
                    }
                }
            } catch (Exception $e) {
                $error = 'Gagal menyimpan akun baru: ' . $e->getMessage();
            }
        }
    } else {
        // Alur Login Standard
        $username = trim($_POST['username'] ?? '');
        $password = trim($_POST['password'] ?? '');

        if (empty($username) || empty($password)) {
            $error = 'Username dan password wajib diisi!';
        } else {
            $db = Database::connect();
            $stmt = $db->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
            $stmt->execute(['username' => $username]);
            $user = $stmt->fetch();

            if ($user) {
                // Verifikasi password asli bcrypt ATAU password default 'admin123'
                if (password_verify($password, $user['password_hash']) || $password === 'admin123') {
                    Session::set('user_id', $user['id']);
                    Session::set('user_username', $user['username']);
                    Session::set('user_fullname', $user['fullname']);
                    Session::set('user_role', $user['role']);
                    
                    AuditLog::write('Login Berhasil', 'User ' . $user['fullname'] . ' masuk ke sistem.');
                    
                    header('Location: index.php?route=dashboard');
                    exit;
                } else {
                    $error = 'Password salah! (Gunakan password default "admin123" untuk akun bawaan)';
                }
            } else {
                $error = 'Username tidak ditemukan!';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $mode === 'register' ? 'Daftar Akun Baru' : 'Login' ?> | SDAVerse Beauty ERP</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;850&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #020617;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen text-slate-100 p-4 relative overflow-hidden">
    <!-- Glowing Top Line -->
    <div class="h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 w-full fixed top-0 left-0 z-50"></div>

    <div class="w-full max-w-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        <!-- Decorative Cosmic Glow Blur Ambient Circles -->
        <div class="absolute -top-16 -left-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-16 -right-16 w-36 h-36 bg-purple-600/10 rounded-full blur-3xl"></div>

        <div class="text-center mb-6">
            <!-- SDAVerse Galactic Custom High-Fidelity SVG Logo in Login Card -->
            <div class="mb-4 flex justify-center">
                <svg class="h-16 w-auto drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]" viewBox="0 0 500 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Neon cyan / violet planetary orbital ring -->
                    <ellipse cx="250" cy="110" rx="140" ry="50" stroke="url(#ringGrad)" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 5" />
                    
                    <!-- Stylized SDV / SDAVerse font letters in the center -->
                    <g transform="translate(140, 60)">
                        <!-- S -->
                        <path d="M 40 25 C 20 25, 20 50, 40 55 C 65 60, 65 90, 40 95 C 20 95, 15 85, 15 80" stroke="url(#brandGrad)" stroke-width="17" stroke-linecap="round" fill="none" />
                        <!-- D -->
                        <path d="M 85 25 L 85 95 C 115 95, 131 80, 131 60 C 131 40, 115 25, 85 25 Z" stroke="url(#brandGrad)" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                        <!-- V -->
                        <path d="M 152 25 L 180 95 L 210 15" stroke="url(#brandGrad)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                        <path d="M 200 35 L 225 0 L 220 55 Z" fill="#22d3ee" opacity="0.8" />
                    </g>
                    
                    <!-- Sparkles / Star particles -->
                    <path d="M 390 40 L 393 45 L 398 46 L 393 47 L 390 52 L 387 47 L 382 46 L 387 45 Z" fill="#22d3ee" />
                    <path d="M 110 160 L 112 163 L 116 164 L 112 165 L 110 168 L 108 165 L 104 164 L 108 163 Z" fill="#a855f7" />

                    <!-- SDAVerse typography -->
                    <text x="250" y="215" text-anchor="middle" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-size="34" letter-spacing="3">GDAVerse</text>
                    <text x="250" y="238" text-anchor="middle" fill="#06b6d4" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="12" letter-spacing="4" opacity="0.95">BEAUTY ERP ENGINE</text>

                    <!-- Gradients definitions -->
                    <defs>
                        <linearGradient id="brandGrad" x1="0" y1="0" x2="220" y2="100" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="#22d3ee" />
                            <stop offset="100%" stop-color="#a855f7" />
                        </linearGradient>
                        <linearGradient id="ringGrad" x1="120" y1="60" x2="380" y2="160" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.9" />
                            <stop offset="100%" stop-color="#a855f7" stop-opacity="0.9" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            <span class="text-[10px] font-mono tracking-widest uppercase bg-slate-950/80 text-cyan-400 border border-slate-850 px-3 py-1 rounded-full font-bold">
                SDAVerse CORE ENGINE v1.0
            </span>
            <h2 class="text-xl font-extrabold mt-3 tracking-tight text-white">
                <?= $mode === 'register' ? 'Pendaftaran Akun Baru' : 'Masuk ke Konsol ERP' ?>
            </h2>
            <p class="text-xs text-slate-400 mt-1">Multi-Warehouse & FEFO Batch Engine</p>
        </div>

        <?php if ($error): ?>
            <div class="mb-5 p-3 rounded-xl bg-red-950/35 border border-red-500/20 text-red-400 text-xs text-center font-medium leading-relaxed">
                <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <?php if ($mode === 'register'): ?>
            <!-- FORM_REGISTRASI -->
            <form method="POST" action="" class="space-y-4">
                <input type="hidden" name="action" value="register">
                
                <div>
                    <label class="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-bold">Nama Lengkap</label>
                    <input type="text" name="fullname" required placeholder="Contoh: Budi Santoso" class="w-full px-4 py-2 bg-slate-950/65 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60 transition" value="<?= htmlspecialchars($_POST['fullname'] ?? '') ?>">
                </div>

                <div>
                    <label class="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-bold">Email Aktif</label>
                    <input type="email" name="email" required placeholder="budi@example.com" class="w-full px-4 py-2 bg-slate-950/65 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60 transition" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-bold">Username</label>
                        <input type="text" name="username" required placeholder="budi_s" class="w-full px-4 py-2 bg-slate-950/65 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60 transition" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>">
                    </div>
                    <div>
                        <label class="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-bold">Jabatan Peran</label>
                        <select name="role" required class="w-full px-4 py-2 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60 transition">
                            <option value="Cashier" <?= isset($_POST['role']) && $_POST['role'] === 'Cashier' ? 'selected' : '' ?>>Kasir / Front Desk</option>
                            <option value="Warehouse Staff" <?= isset($_POST['role']) && $_POST['role'] === 'Warehouse Staff' ? 'selected' : '' ?>>Staf Gudang</option>
                            <option value="Admin" <?= isset($_POST['role']) && $_POST['role'] === 'Admin' ? 'selected' : '' ?>>Administrator</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-bold">Password Baru</label>
                    <input type="password" name="password" required placeholder="Minimal 6 karakter" class="w-full px-4 py-2 bg-slate-950/65 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60 transition">
                </div>

                <div>
                    <label class="text-[10px] font-mono uppercase text-slate-400 block mb-1 font-bold">Ulangi Password</label>
                    <input type="password" name="password_confirm" required placeholder="Masukkan ulang password" class="w-full px-4 py-2 bg-slate-950/65 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60 transition">
                </div>

                <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-extrabold text-xs text-white transition shadow-lg hover:brightness-110 cursor-pointer">
                    Daftar Akun Baru & Masuk
                </button>
                
                <div class="text-center mt-4">
                    <p class="text-xs text-slate-400">Sudah memiliki akun? 
                        <a href="index.php?route=login&action=login" class="text-cyan-400 font-bold hover:underline">Masuk Sini</a>
                    </p>
                </div>
            </form>

        <?php else: ?>
            <!-- FORM_LOGIN -->
            <form method="POST" action="" class="space-y-4">
                <input type="hidden" name="action" value="login">
                
                <div>
                    <label class="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 font-bold">Username</label>
                    <input type="text" name="username" required placeholder="admin atau staff_iqbal" class="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60 transition" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>">
                </div>

                <div>
                    <label class="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 font-bold">Password</label>
                    <input type="password" name="password" required placeholder="admin123" class="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60 transition">
                </div>

                <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-extrabold text-xs text-white transition shadow-lg hover:brightness-110 cursor-pointer">
                    Verifikasi Sesi ERP & Masuk
                </button>
                
                <div class="text-center mt-4">
                    <p class="text-xs text-slate-400">Belum memiliki akun? 
                        <a href="index.php?route=login&action=register" class="text-cyan-400 font-bold hover:underline">Daftar Sekarang</a>
                    </p>
                </div>
            </form>

            <div class="mt-6 pt-5 border-t border-slate-850/80 text-[10px] text-slate-450">
                <p class="font-mono text-center text-slate-500 mb-2.5 font-bold uppercase">AKUN PENGUJIAN DEFAULT:</p>
                <div class="grid grid-cols-3 gap-2 text-center text-[9px] font-mono text-slate-400 bg-slate-950/80 p-2 rounded-xl border border-slate-850">
                    <div>
                        <span class="text-cyan-400 block font-bold">Admin</span>
                        <code>admin</code>
                        <span class="text-slate-600 block mt-0.5">admin123</span>
                    </div>
                    <div>
                        <span class="text-indigo-400 block font-bold">Staff Gudang</span>
                        <code>staff_iqbal</code>
                        <span class="text-slate-600 block mt-0.5">admin123</span>
                    </div>
                    <div>
                        <span class="text-purple-400 block font-bold">Kasir</span>
                        <code>cashier_siti</code>
                        <span class="text-slate-600 block mt-0.5">admin123</span>
                    </div>
                </div>
            </div>
        <?php endif; ?>

    </div>
</body>
</html>
