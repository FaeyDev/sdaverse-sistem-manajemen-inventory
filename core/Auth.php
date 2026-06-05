<?php
// core/Auth.php

require_once __DIR__ . '/Session.php';
require_once __DIR__ . '/Database.php';

class Auth {
    public static function attempt($username, $password) {
        $db = Database::connect();
        $stmt = $db->prepare("SELECT * FROM users WHERE username = :username LIMIT 1");
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            Session::set('user_id', $user['id']);
            Session::set('user_username', $user['username']);
            Session::set('user_fullname', $user['fullname']);
            Session::set('user_role', $user['role']);
            return $user;
        }
        return false;
    }

    public static function check() {
        return Session::has('user_id');
    }

    public static function user() {
        if (!self::check()) return null;
        try {
            $db = Database::connect();
            
            // Auto migrate users table for avatar field if not exists
            static $migrated = false;
            if (!$migrated) {
                try {
                    $stmtCol = $db->query("SHOW COLUMNS FROM users LIKE 'avatar'");
                    if (!$stmtCol->fetch()) {
                        $db->exec("ALTER TABLE users ADD COLUMN avatar LONGTEXT DEFAULT NULL");
                    }
                } catch (Exception $colEx) {
                    // Ignore column check error
                }
                $migrated = true;
            }

            $stmt = $db->prepare("SELECT id, username, email, fullname, role, avatar FROM users WHERE id = :id LIMIT 1");
            $stmt->execute(['id' => Session::get('user_id')]);
            $user = $stmt->fetch();
            if ($user) {
                return $user;
            }
        } catch (Exception $e) {
            // fallback
        }
        return [
            'id' => Session::get('user_id'),
            'username' => Session::get('user_username'),
            'fullname' => Session::get('user_fullname'),
            'role' => Session::get('user_role'),
            'email' => '',
            'avatar' => null
        ];
    }

    public static function logout() {
        Session::destroy();
    }
}
