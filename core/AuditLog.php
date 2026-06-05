<?php
// core/AuditLog.php

require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Session.php';

class AuditLog {
    public static function write($action, $details = null) {
        $db = Database::connect();
        $userId = Session::get('user_id');
        
        if (!$userId) {
            // Jika pencatatan dilakukan saat login atau logout, gunakan ID 1 atau null
            $userId = 1; // Default ke Admin ID 1
        }

        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

        try {
            $stmt = $db->prepare("INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (:user_id, :action, :details, :ip_address)");
            $stmt->execute([
                'user_id' => $userId,
                'action' => $action,
                'details' => $details,
                'ip_address' => $ipAddress
            ]);
        } catch (PDOException $e) {
            // Abaikan kegagalan log agar tidak memecah fungsionalitas utama aplikasi
        }
    }
}
