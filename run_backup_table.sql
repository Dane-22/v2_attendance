mysql -u root -p attendance-system -e "
CREATE TABLE IF NOT EXISTS backup_records (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"
