<?php
// views/auth/profile.php

require_once __DIR__ . '/../../core/Database.php';
require_once __DIR__ . '/../../core/Middleware.php';
require_once __DIR__ . '/../../views/layouts/app.php';
require_once __DIR__ . '/../../core/AuditLog.php';

Middleware::auth();

$db = Database::connect();
$currentUser = Auth::user();
$userId = $currentUser['id'];

$success = '';
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullname = trim($_POST['fullname'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $avatarData = $_POST['avatar_data'] ?? '';

    if (empty($fullname) || empty($email) || empty($username)) {
        $error = 'Nama Lengkap, Email, dan Username wajib diisi!';
    } else {
        try {
            $db->beginTransaction();

            // Cek keunikan username untuk user lain
            $stmtCheck = $db->prepare("SELECT id FROM users WHERE username = :username AND id != :id LIMIT 1");
            $stmtCheck->execute(['username' => $username, 'id' => $userId]);
            if ($stmtCheck->fetch()) {
                throw new Exception('Username "' . htmlspecialchars($username) . '" sudah digunakan oleh pihak lain!');
            }

            // Cek keunikan email untuk user lain
            $stmtCheckEmail = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :id LIMIT 1");
            $stmtCheckEmail->execute(['email' => $email, 'id' => $userId]);
            if ($stmtCheckEmail->fetch()) {
                throw new Exception('Email "' . htmlspecialchars($email) . '" sudah terdaftar pada pengguna lain!');
            }

            // Prepare update query
            if (!empty($password)) {
                if (strlen($password) < 6) {
                    throw new Exception('Password baru minimal harus terdiri dari 6 karakter!');
                }
                $passwordHash = password_hash($password, PASSWORD_BCRYPT);
                $stmtUpdate = $db->prepare("
                    UPDATE users 
                    SET fullname = :fullname, email = :email, username = :username, password_hash = :password_hash, avatar = :avatar 
                    WHERE id = :id
                ");
                $stmtUpdate->execute([
                    'fullname' => $fullname,
                    'email' => $email,
                    'username' => $username,
                    'password_hash' => $passwordHash,
                    'avatar' => !empty($avatarData) ? $avatarData : null,
                    'id' => $userId
                ]);
            } else {
                $stmtUpdate = $db->prepare("
                    UPDATE users 
                    SET fullname = :fullname, email = :email, username = :username, avatar = :avatar 
                    WHERE id = :id
                ");
                $stmtUpdate->execute([
                    'fullname' => $fullname,
                    'email' => $email,
                    'username' => $username,
                    'avatar' => !empty($avatarData) ? $avatarData : null,
                    'id' => $userId
                ]);
            }

            // Update session values so Layout header updates instantly
            Session::set('user_username', $username);
            Session::set('user_fullname', $fullname);

            $db->commit();
            $success = 'Profil Anda berhasil diperbarui!';
            AuditLog::write('Ubah Profil', 'Pengguna ' . $fullname . ' memperbarui info profil pribadinya.');
            
            // Refresh user details
            $currentUser = Auth::user();
        } catch (Exception $e) {
            $db->rollBack();
            $error = 'Gagal menyimpan profil: ' . $e->getMessage();
        }
    }
}

// Built-in cool gradient avatars presets (for convenient quick setting)
$presets = [
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Gold/Amber
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Royal Blue
    'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald Green
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Cosme Pink
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Deep Purple
    'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', // Neon Ruby
];

ob_start();
?>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
    
    <!-- LEFT: Profile Photo & Presets Panel -->
    <div class="glass-panel p-8 rounded-3xl lg:col-span-4 flex flex-col items-center justify-between h-fit text-center relative overflow-hidden">
        <div class="absolute -top-10 -left-10 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
        <div class="absolute -bottom-10 -right-10 w-24 h-24 bg-amber-600/5 rounded-full blur-2xl"></div>

        <div class="w-full">
            <h3 class="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider mb-6 border-b border-slate-900 pb-3 text-amber-500">
                👤 Gambar Profil Anda
            </h3>

            <!-- Real-time Interactive Avatar Preview -->
            <div class="relative w-32 h-32 mx-auto mb-6 group">
                <div id="avatar_preview_container" class="w-full h-full rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 flex items-center justify-center font-bold text-amber-500 shadow-2xl relative transition duration-300 group-hover:border-amber-500/40">
                    <?php if (!empty($currentUser['avatar'])): ?>
                        <?php if (strpos($currentUser['avatar'], 'linear-gradient') === 0): ?>
                            <div id="preview_gradient" class="w-full h-full flex items-center justify-center text-4xl uppercase font-mono text-white" style="background: <?= $currentUser['avatar'] ?>;">
                                <?= substr(htmlspecialchars($currentUser['fullname']), 0, 2) ?>
                            </div>
                        <?php else: ?>
                            <img id="preview_image" src="<?= $currentUser['avatar'] ?>" alt="" class="w-full h-full object-cover" referrerPolicy="no-referrer">
                        <?php endif; ?>
                    <?php else: ?>
                        <div id="preview_fallback" class="text-4xl uppercase font-mono text-amber-500">
                            <?= substr(htmlspecialchars($currentUser['fullname']), 0, 2) ?>
                        </div>
                    <?php endif; ?>
                </div>

                <label for="avatar_file" class="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 duration-200 w-9 h-9 text-slate-950 rounded-xl flex items-center justify-center shadow-lg cursor-pointer border border-amber-400/20">
                    📸
                </label>
                <!-- Hidden Real File Input -->
                <input type="file" id="avatar_file" accept="image/*" class="hidden" onchange="optimizeAndLoadImage(event)">
            </div>

            <!-- Clear Photo Button -->
            <button type="button" onclick="clearAvatarToDefault()" class="px-3 py-1 bg-slate-950 border border-slate-850 hover:border-red-500/30 hover:text-red-400 text-[10px] text-slate-400 font-mono rounded-lg transition duration-150 mb-6 cursor-pointer">
                🗑️ Atur ke Inisial Bawaan
            </button>

            <!-- Dynamic Picker Presets -->
            <div class="mt-4 pt-4 border-t border-slate-900/60">
                <span class="text-[9px] font-mono font-bold text-slate-400 block mb-3 uppercase">Pilih Gradien Estetis Cepat:</span>
                <div class="grid grid-cols-6 gap-2 justify-center">
                    <?php foreach ($presets as $idx => $gradient): ?>
                        <button type="button" 
                                onclick="pickPresetGradient('<?= addslashes($gradient) ?>')" 
                                class="w-8 h-8 rounded-lg cursor-pointer transition transform hover:scale-110 active:scale-95 shadow border border-slate-950 hover:border-white" 
                                style="background: <?= $gradient ?>;"
                                title="Preset Gradien <?= $idx + 1 ?>">
                        </button>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <div class="mt-8 text-[11px] font-mono text-slate-500 bg-slate-950/25 p-3 rounded-xl border border-slate-900/60 w-full text-justify">
            💡 <strong class="text-amber-500">Fakta Kinerja:</strong> Gambar profil Anda akan otomatis dicompress menjadi resolusi retina optimal (150x150) guna menghemat log transmisi database tanpa memperlambat loading.
        </div>
    </div>

    <!-- RIGHT: Profile Details Edit Form -->
    <div class="glass-panel p-8 rounded-3xl lg:col-span-8 relative">
        <h3 class="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider mb-2 text-amber-500 pb-3 border-b border-slate-900">
            📝 Formulir Sunting Informasi Kunci
        </h3>
        <p class="text-[11px] text-slate-400 mb-6 leading-relaxed font-light">
            Gunakan panel ini untuk mengganti nama pendaftaran, email notifikasi, kredensial log masuk, maupun kata kunci pengaman sistem yang sah.
        </p>

        <?php if ($success): ?>
            <div class="mb-5 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs text-center font-medium">
                ✅ <?= htmlspecialchars($success) ?>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="mb-5 p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-500 text-xs text-center font-medium">
                ⚠️ <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <form id="profileForm" method="POST" action="" class="space-y-5">
            <!-- Hidden Input reflecting raw Avatar Base64 or gradient string -->
            <input type="hidden" name="avatar_data" id="avatar_data_field" value="<?= htmlspecialchars($currentUser['avatar'] ?? '') ?>">

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1.5 font-bold uppercase">Nama Lengkap</label>
                    <input type="text" name="fullname" required placeholder="Contoh: Agustinov Freeze" class="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500" value="<?= htmlspecialchars($currentUser['fullname']) ?>">
                </div>

                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1.5 font-bold uppercase">Email Aktif</label>
                    <input type="email" name="email" required placeholder="name@sdadiverse.com" class="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500" value="<?= htmlspecialchars($currentUser['email'] ?? ($currentUser['username'] . '@example.com')) ?>">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1.5 font-bold uppercase">Username Unik</label>
                    <input type="text" name="username" required placeholder="user_aesthetic" class="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500" value="<?= htmlspecialchars($currentUser['username']) ?>">
                </div>

                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1.5 font-bold uppercase">Otoritas Peran (Role)</label>
                    <div class="w-full px-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-amber-500/80 font-mono select-none flex items-center justify-between border-slate-850">
                        <span>🛡️ <?= htmlspecialchars($currentUser['role']) ?></span>
                        <span class="text-[8px] bg-slate-900 px-2 py-0.5 rounded text-slate-500 border border-slate-850">ID#<?= $userId ?></span>
                    </div>
                    <span class="text-[8px] text-slate-500 block mt-1 font-mono italic">Otoritas peran diatur oleh Administrator pusat dan tidak dapat diubah secara sepihak.</span>
                </div>
            </div>

            <div class="pt-4 border-t border-slate-900/60">
                <span class="text-[9px] font-mono font-bold text-amber-500/80 block mb-3 uppercase">⚙️ Pengaman Kata Sandi (Opsional)</span>
                <div>
                    <label class="text-[9px] text-slate-400 font-mono block mb-1.5 font-bold uppercase">Password Baru (Biarkan kosong jika tidak diganti)</label>
                    <input type="password" name="password" placeholder="Rekomendasi min. 6 karakter alfanumerik" class="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                </div>
            </div>

            <button type="submit" class="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 font-extrabold text-xs text-black rounded-xl hover:brightness-110 transition shadow-lg mt-4 cursor-pointer">
                Simpan Perubahan Akun
            </button>
        </form>
    </div>

</div>

<!-- Client-side performance optimizing scripts of Avatar image uploads -->
<script>
    // Selected fallback letter initials template from the dynamic fullname
    const defaultInitials = "<?= substr(htmlspecialchars($currentUser['fullname']), 0, 2) ?>";

    function optimizeAndLoadImage(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Image file size sanity check
        if (file.size > 8 * 1024 * 1024) {
            alert("Ukuran gambar asli terlalu besar! Sistem merekomendasikan di bawah 8MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Initialize modern canvas sizing for optimization
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Crop and scale to high quality 150x150 square
                const targetSize = 150;
                canvas.width = targetSize;
                canvas.height = targetSize;

                // Center coordinates calculating
                let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
                if (img.width > img.height) {
                    srcWidth = img.height;
                    srcX = (img.width - img.height) / 2;
                } else if (img.height > img.width) {
                    srcHeight = img.width;
                    srcY = (img.height - img.width) / 2;
                }

                // Draw the optimal cropped square to canvas
                ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, targetSize, targetSize);
                
                // Extract lightweight optimized base64
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                
                // Update hidden form input
                document.getElementById('avatar_data_field').value = dataUrl;
                
                // Update live DOM visual preview instantly
                const previewContainer = document.getElementById('avatar_preview_container');
                previewContainer.innerHTML = `<img id="preview_image" src="${dataUrl}" class="w-full h-full object-cover" referrerPolicy="no-referrer">`;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function pickPresetGradient(gradient) {
        // Save preset string to hidden field
        document.getElementById('avatar_data_field').value = gradient;
        
        // Render beautiful visual container
        const previewContainer = document.getElementById('avatar_preview_container');
        previewContainer.innerHTML = `
            <div id="preview_gradient" class="w-full h-full flex items-center justify-center text-4xl uppercase font-mono text-white" style="background: ${gradient};">
                ${defaultInitials}
            </div>
        `;
    }

    function clearAvatarToDefault() {
        // Clear value
        document.getElementById('avatar_data_field').value = '';
        
        // Re-render empty initial card
        const previewContainer = document.getElementById('avatar_preview_container');
        previewContainer.innerHTML = `
            <div id="preview_fallback" class="text-4xl uppercase font-mono text-amber-500">
                ${defaultInitials}
            </div>
        `;
        
        // Clear standard file input selection
        document.getElementById('avatar_file').value = '';
    }
</script>
<?php
$content = ob_get_clean();
render_layout('Profil Saya & Kelola Akun', $content, 'profile');
