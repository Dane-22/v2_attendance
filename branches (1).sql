-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 27, 2026 at 06:06 AM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `attendance-system`
--

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
CREATE TABLE IF NOT EXISTS `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `branch_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `contact_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `branch_code` (`branch_code`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `branch_code`, `branch_name`, `address`, `contact_number`, `status`, `created_at`, `updated_at`) VALUES
(1, 'A', 'Sto. Rosario', NULL, NULL, 'Active', '2026-04-14 06:09:01', '2026-04-14 06:09:01'),
(2, 'B', 'BCDA', NULL, NULL, 'Active', '2026-04-14 06:09:01', '2026-04-14 06:09:01'),
(3, 'C', 'Sundara', NULL, NULL, 'Active', '2026-04-14 06:09:01', '2026-04-14 06:09:01'),
(4, 'D', 'Panicsican', NULL, NULL, 'Active', '2026-04-14 06:09:01', '2026-04-14 06:09:01'),
(5, 'E', 'Main Office', NULL, NULL, 'Active', '2026-04-14 06:09:01', '2026-04-14 06:09:01'),
(6, 'F', 'Capitol', NULL, NULL, 'Active', '2026-04-14 06:09:01', '2026-04-14 06:09:01'),
(8, 'H', 'Testing Branch', 'This is a test branch', '09885456232', 'Active', '2026-04-17 04:23:23', '2026-04-17 04:23:23');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
