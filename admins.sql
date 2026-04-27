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
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `branch_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `permissions_enabled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`, `name`, `email`, `role`, `created_at`, `updated_at`, `branch_code`, `permissions`, `permissions_enabled`) VALUES
(17, 'admin', '$2a$10$FSiyTYX1NnNRCgyKHprIyObllECvLofAnAZvnf6lENSqhflN9zXNi', 'System Administrator', 'admin@jajr.com', 'super_admin', '2026-04-23 19:37:05', '2026-04-24 03:58:23', NULL, NULL, 0),
(23, 'branch-e', '$2a$10$enrddCarmiatjXbYTj1FxOzYmjPmXzMMixoWVr2VTUO6aEmtwdRmG', 'Branch E Admin', 'branch-e@jajr.com', 'admin', '2026-04-23 19:37:05', '2026-04-23 19:37:05', 'E', NULL, 0),
(22, 'branch-d', '$2a$10$enrddCarmiatjXbYTj1FxOzYmjPmXzMMixoWVr2VTUO6aEmtwdRmG', 'Branch D Admin', 'branch-d@jajr.com', 'admin', '2026-04-23 19:37:05', '2026-04-23 19:37:05', 'D', NULL, 0),
(21, 'branch-c', '$2a$10$enrddCarmiatjXbYTj1FxOzYmjPmXzMMixoWVr2VTUO6aEmtwdRmG', 'Branch C Admin', 'branch-c@jajr.com', 'admin', '2026-04-23 19:37:05', '2026-04-23 19:37:05', 'C', NULL, 0),
(25, 'branch-g', '$2a$10$enrddCarmiatjXbYTj1FxOzYmjPmXzMMixoWVr2VTUO6aEmtwdRmG', 'Branch G Admin', 'branch-g@jajr.com', 'admin', '2026-04-23 19:37:05', '2026-04-23 19:37:05', 'G', NULL, 0),
(20, 'branch-b', '$2a$10$enrddCarmiatjXbYTj1FxOzYmjPmXzMMixoWVr2VTUO6aEmtwdRmG', 'Branch B Admin', 'branch-b@jajr.com', 'admin', '2026-04-23 19:37:05', '2026-04-23 19:37:05', 'B', NULL, 0),
(19, 'branch-a', '$2a$10$enrddCarmiatjXbYTj1FxOzYmjPmXzMMixoWVr2VTUO6aEmtwdRmG', 'Branch A Admin', 'branch-a@jajr.com', 'admin', '2026-04-23 19:37:05', '2026-04-23 19:37:05', 'A', NULL, 0),
(24, 'branch-f', '$2a$10$enrddCarmiatjXbYTj1FxOzYmjPmXzMMixoWVr2VTUO6aEmtwdRmG', 'Branch F Admin', 'branch-f@jajr.com', 'admin', '2026-04-23 19:37:05', '2026-04-23 19:37:05', 'F', NULL, 0),
(26, 'branch-h', '$2a$10$enrddCarmiatjXbYTj1FxOzYmjPmXzMMixoWVr2VTUO6aEmtwdRmG', 'Branch H Admin', 'branch-h@jajr.com', 'admin', '2026-04-23 19:37:05', '2026-04-23 19:37:05', 'H', NULL, 0),
(18, 'superadmin', '$2a$10$enrddCarmiatjXbYTj1FxOzYmjPmXzMMixoWVr2VTUO6aEmtwdRmG', 'Super Admin', 'superadmin@jajr.com', 'super_admin', '2026-04-23 19:37:05', '2026-04-23 19:37:05', NULL, NULL, 0),
(27, 'testlangmet', '$2a$10$dPqZoaJ8CdX92S6aoOyfm.TKt9l8Vovgq0dkit1OfrAcBDqtehMF.', 'Teslang', 'tew@gmail.com', 'admin', '2026-04-26 21:49:22', '2026-04-26 21:49:22', NULL, '[\"attendance\", \"attendance-audit\", \"finance\", \"settings\", \"dashboard\", \"finance/payroll\"]', 1);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
