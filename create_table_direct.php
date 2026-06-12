<?php
// Simple PHP script to create backup_records table
// Run this in your browser: http://localhost/v2-attendance/create_table_direct.php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "attendance-system";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = "CREATE TABLE IF NOT EXISTS backup_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        type ENUM('DATABASE', 'FILES', 'FULL') DEFAULT 'DATABASE',
        size BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT NOT NULL,
        description TEXT,
        is_auto BOOLEAN DEFAULT FALSE,
        status ENUM('COMPLETED', 'FAILED', 'PENDING', 'IN_PROGRESS') DEFAULT 'COMPLETED',
        cloud_url VARCHAR(500),
        cloud_provider VARCHAR(50),
        download_count INT DEFAULT 0,
        last_downloaded TIMESTAMP NULL,
        
        INDEX idx_backup_created (created_at),
        INDEX idx_backup_type (type),
        INDEX idx_backup_status (status),
        INDEX idx_backup_auto (is_auto),
        INDEX idx_backup_creator (created_by),
        INDEX idx_backup_created_type (created_at, type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $conn->exec($sql);
    echo "✅ backup_records table created successfully!";
    
} catch(PDOException $e) {
    echo "❌ Error creating table: " . $e->getMessage();
}

$conn = null;
?>
