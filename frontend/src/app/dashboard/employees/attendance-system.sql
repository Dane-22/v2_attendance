-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Apr 20, 2026 at 01:54 AM
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`, `name`, `email`, `role`, `created_at`, `updated_at`, `branch_code`) VALUES
(1, 'admin', '$2y$10$vmPwtKtbjf5fKta5Ve6YWOW7CtW82qvUgbN5jynSKSoSM315./kb2', 'Super Administrator', 'admin@jajr.com', 'super_admin', '2026-04-14 03:02:42', '2026-04-14 03:12:08', NULL),
(14, 'branch-e', '$2y$10$3ytjyW/KOW/muKN3yUXB9edeoZrtRqVIpHpHk8/JTXADvnT9wRzcC', 'Branch E Device - Main Office', 'branch-e@jajr.local', '', '2026-04-14 08:14:43', '2026-04-14 08:14:43', 'E'),
(13, 'branch-d', '$2y$10$3ytjyW/KOW/muKN3yUXB9edeoZrtRqVIpHpHk8/JTXADvnT9wRzcC', 'Branch D Device - Panicsican', 'branch-d@jajr.local', '', '2026-04-14 08:14:43', '2026-04-14 08:14:43', 'D'),
(12, 'branch-c', '$2y$10$3ytjyW/KOW/muKN3yUXB9edeoZrtRqVIpHpHk8/JTXADvnT9wRzcC', 'Branch C Device - Sundara', 'branch-c@jajr.local', '', '2026-04-14 08:14:43', '2026-04-14 08:14:43', 'C'),
(11, 'branch-b', '$2y$10$3ytjyW/KOW/muKN3yUXB9edeoZrtRqVIpHpHk8/JTXADvnT9wRzcC', 'Branch B Device - BCDA', 'branch-b@jajr.local', '', '2026-04-14 08:14:43', '2026-04-14 08:14:43', 'B'),
(10, 'branch-a', '$2y$10$3ytjyW/KOW/muKN3yUXB9edeoZrtRqVIpHpHk8/JTXADvnT9wRzcC', 'Branch A Device - Sto. Rosario', 'branch-a@jajr.local', '', '2026-04-14 08:14:43', '2026-04-14 08:14:43', 'A'),
(15, 'branch-f', '$2y$10$3ytjyW/KOW/muKN3yUXB9edeoZrtRqVIpHpHk8/JTXADvnT9wRzcC', 'Branch F Device - Capitol', 'branch-f@jajr.local', '', '2026-04-14 08:14:43', '2026-04-14 08:14:43', 'F'),
(16, 'branch-h', '$2y$10$u8Sg7it/ARTuqRGOGI.U0.CHNUrpkJMqJ4XzZGEy3sLcv2NlR3L96', 'Branch Device - Testing Branch', 'branch-h@jajr.local', '', '2026-04-17 04:23:23', '2026-04-17 04:23:23', 'H');

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `branch_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `status` enum('present','absent','late','half_day','leave') COLLATE utf8mb4_unicode_ci DEFAULT 'present',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `employee_id`, `branch_code`, `date`, `check_in`, `check_out`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(2, 2, 'B', '2026-04-16', '00:11:28', NULL, 'present', 'Marked via site attendance', '2026-04-16 00:11:28', '2026-04-16 00:11:28'),
(3, 4, 'B', '2026-04-16', '00:11:33', NULL, 'present', 'Marked via site attendance', '2026-04-16 00:11:30', '2026-04-16 00:11:33'),
(4, 5, 'B', '2026-04-16', '00:12:17', NULL, 'present', 'Marked via site attendance', '2026-04-16 00:12:17', '2026-04-16 00:12:17'),
(5, 6, 'B', '2026-04-16', '00:13:33', NULL, 'present', 'Marked via site attendance', '2026-04-16 00:13:33', '2026-04-16 00:13:33'),
(6, 3, 'B', '2026-04-16', '08:14:55', NULL, 'present', 'Marked via site attendance', '2026-04-16 00:14:55', '2026-04-16 00:14:55'),
(31, 8, 'A', '2026-04-17', '02:57:33', '02:58:24', 'present', 'QR Scan at A', '2026-04-17 02:57:33', '2026-04-17 02:58:24'),
(30, 9, 'A', '2026-04-17', '02:57:02', '02:57:06', 'present', 'QR Scan at A', '2026-04-17 02:57:02', '2026-04-17 02:57:06'),
(29, 5, 'B', '2026-04-17', '10:46:16', '10:46:19', 'present', 'Marked via site attendance', '2026-04-17 02:46:16', '2026-04-17 02:46:19'),
(28, 7, 'B', '2026-04-17', '10:46:12', '10:46:14', 'present', 'Marked via site attendance', '2026-04-17 02:46:12', '2026-04-17 02:46:14'),
(32, 9, 'A', '2026-04-17', '03:13:21', '03:13:26', 'present', 'QR Scan at A', '2026-04-17 03:13:21', '2026-04-17 03:13:26'),
(33, 9, 'B', '2026-04-17', '03:14:00', '03:14:06', 'present', 'QR Scan at B', '2026-04-17 03:14:00', '2026-04-17 03:14:06'),
(34, 9, 'B', '2026-04-17', '03:14:22', '03:17:25', 'present', 'QR Scan at B', '2026-04-17 03:14:22', '2026-04-17 03:17:25'),
(35, 9, 'B', '2026-04-17', '03:17:31', '14:54:24', 'present', 'QR Scan at B', '2026-04-17 03:17:31', '2026-04-17 06:54:24'),
(36, 8, 'A', '2026-04-17', '03:38:44', '03:38:59', 'present', 'QR Scan at A', '2026-04-17 03:38:44', '2026-04-17 03:38:59'),
(37, 10, 'A', '2026-04-17', '11:42:16', '14:54:26', 'present', 'QR Scan at A', '2026-04-17 03:42:16', '2026-04-17 06:54:26'),
(38, 12, 'H', '2026-04-17', '12:25:08', '14:54:28', 'present', 'QR Scan at H', '2026-04-17 04:25:08', '2026-04-17 06:54:28'),
(39, 11, 'B', '2026-04-17', '12:44:48', '12:45:09', 'present', 'Manual entry at B', '2026-04-17 04:44:48', '2026-04-17 04:45:09'),
(40, 8, 'F', '2026-04-17', '12:44:53', '14:54:23', 'present', 'Manual entry at F', '2026-04-17 04:44:53', '2026-04-17 06:54:23'),
(41, 5, 'E', '2026-04-17', '12:44:57', '14:54:21', 'present', 'Manual entry at E', '2026-04-17 04:44:57', '2026-04-17 06:54:21'),
(42, 13, 'D', '2026-04-17', '12:45:01', '14:54:29', 'present', 'Manual entry at D', '2026-04-17 04:45:01', '2026-04-17 06:54:29'),
(43, 14, 'A', '2026-04-17', '12:45:04', '14:54:30', 'present', 'Manual entry at A', '2026-04-17 04:45:04', '2026-04-17 06:54:30'),
(44, 15, 'H', '2026-04-17', '12:45:07', '14:54:31', 'present', 'Manual entry at H', '2026-04-17 04:45:07', '2026-04-17 06:54:31'),
(45, 11, 'H', '2026-04-17', '12:45:11', '14:54:27', 'present', 'Manual entry at H', '2026-04-17 04:45:11', '2026-04-17 06:54:27'),
(46, 24, 'A', '2026-04-17', '13:07:01', '13:07:08', 'present', 'QR Scan at A', '2026-04-17 05:07:01', '2026-04-17 05:07:08'),
(47, 25, 'A', '2026-04-17', '13:07:21', NULL, 'present', 'QR Scan at A', '2026-04-17 05:07:21', '2026-04-17 05:07:21'),
(48, 28, 'A', '2026-04-17', '13:07:37', '13:07:44', 'present', 'QR Scan at A', '2026-04-17 05:07:37', '2026-04-17 05:07:44'),
(49, 34, 'A', '2026-04-17', '13:08:07', NULL, 'present', 'QR Scan at A', '2026-04-17 05:08:07', '2026-04-17 05:08:07'),
(50, 36, 'A', '2026-04-17', '13:08:17', NULL, 'present', 'QR Scan at A', '2026-04-17 05:08:17', '2026-04-17 05:08:17'),
(51, 44, 'A', '2026-04-17', '14:09:11', '14:09:16', 'present', 'QR Scan at A', '2026-04-17 06:09:11', '2026-04-17 06:09:16'),
(52, 77, 'A', '2026-04-17', '14:21:15', NULL, 'present', 'QR Scan at A', '2026-04-17 06:21:15', '2026-04-17 06:21:15'),
(53, 7, 'D', '2026-04-17', '14:30:26', '14:54:22', 'present', 'Manual entry at D', '2026-04-17 06:30:26', '2026-04-17 06:54:22'),
(54, 24, 'E', '2026-04-17', '14:39:16', '14:39:25', 'present', 'Manual entry at E', '2026-04-17 06:39:16', '2026-04-17 06:39:25'),
(55, 24, 'B', '2026-04-17', '14:39:30', '14:39:41', 'present', 'Manual entry at B', '2026-04-17 06:39:30', '2026-04-17 06:39:41'),
(56, 24, 'F', '2026-04-17', '14:39:51', NULL, 'present', 'Manual entry at F', '2026-04-17 06:39:51', '2026-04-17 06:39:51'),
(57, 8, 'A', '2026-04-18', '08:06:26', NULL, 'present', 'QR Scan at A', '2026-04-18 00:06:26', '2026-04-18 00:06:26');

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

-- --------------------------------------------------------

--
-- Table structure for table `branch_users`
--

DROP TABLE IF EXISTS `branch_users`;
CREATE TABLE IF NOT EXISTS `branch_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `daily_rate` decimal(10,2) DEFAULT '0.00',
  `has_deductions` tinyint(1) DEFAULT '0',
  `profile_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `default_branch_id` int DEFAULT NULL,
  `performance_allowance` decimal(10,2) DEFAULT '0.00',
  `has_deduction` tinyint(1) DEFAULT '1',
  `branch_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_employee_branch` (`branch_name`)
) ENGINE=MyISAM AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `employee_code`, `first_name`, `middle_name`, `last_name`, `email`, `department`, `position`, `branch_name`, `status`, `daily_rate`, `has_deductions`, `profile_image`, `created_at`, `updated_at`, `default_branch_id`, `performance_allowance`, `has_deduction`, `branch_id`) VALUES
(5, 'W0001', 'Testtt', 'sdfgdsg', 'sfdg', 'sfdg@gmail.com', NULL, 'Worker', NULL, 'Active', 100.00, 1, 'uploads/employees/69e18cd6c872f_46.png', '2026-04-14 05:14:15', '2026-04-17 07:43:47', NULL, 0.00, 0, NULL),
(7, 'SA001', 'Super', 'Torres', 'Admin', 'admin@jajrconstruction.com', NULL, 'Admin', NULL, 'Active', 600.00, 0, 'uploads/profile_images/profile_6_1771480314.png', '2026-04-16 08:33:09', '2026-04-17 08:50:33', NULL, 0.00, 0, 33),
(8, 'E0001', 'AARIZ', NULL, 'MARLOU', 'aariz.marlou@example.com', NULL, 'Worker', 'Sto. Rosario', 'Active', 700.00, 0, 'profile_69d6006a66bfe6.32302616.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 21),
(9, 'E0002', 'CESAR', NULL, 'ABUBO', 'cesar.abubo@example.com', NULL, 'Worker', NULL, 'Active', 550.00, 0, 'uploads/employees/69e1f5570e031_compressed_profile.jpg', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 150.00, 1, 21),
(10, 'E0003', 'MARLON', '', 'AGUILAR', 'marlon.aguilar@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d600211a0589.35341824.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 0, 10),
(11, 'E0004', 'NOEL', NULL, 'ARIZ', 'noel.ariz@example.com', 'Operations', 'Worker', NULL, 'Inactive', 550.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 26),
(12, 'E0005', 'DANIEL', '', 'BACHILLER', 'daniel.bachiller@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d6002e97f1d3.80387073.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 1, 21),
(13, 'E0006', 'ALFREDO', '', 'BAGUIO', 'alfredo.baguio@example.com', 'Operations', 'Worker', NULL, 'Active', 550.00, 0, 'profile_69d5ff418361b7.89098507.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 150.00, 0, 21),
(14, 'E0007', 'ROLLY', '', 'BALTAZAR', 'rolly.baltazar@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d5ff547f48e9.55971784.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 21),
(15, 'E0008', 'DONG', NULL, 'BAUTISTA', 'dong.bautista@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 20),
(16, 'E0009', 'JANLY', '', 'BELINO', 'janly.belino@example.com', 'Operations', 'Worker', NULL, 'Active', 650.00, 0, 'profile_69d5f8bd3ff0e7.72784110.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 10),
(17, 'E0010', 'MENUEL', '', 'BENITEZ', 'menuel.benitez@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d5f8d8982db4.66850139.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 1, 21),
(18, 'E0011', 'GELMAR', '', 'BARNACHEA', 'gelmar.bernachea@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d5ff3620afe4.25764722.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 21),
(19, 'E0012', 'JOMAR', NULL, 'CABANBAN', 'jomar.cabanban@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 22),
(20, 'E0013', 'MARIO', '', 'CABANBAN', 'mario.cabanban@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d9bdfcd6a4e1.58343645.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 0, 10),
(21, 'E0014', 'KELVIN', NULL, 'CALDERON', 'kelvin.calderon@example.com', 'Operations', 'Worker', NULL, 'Inactive', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 21),
(22, 'E0015', 'FLORANTE', NULL, 'CALUZA', 'florante.caluza@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 22),
(23, 'E0016', 'MELVIN', NULL, 'CAMPOS', 'melvin.campos@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 21),
(24, 'E0017', 'JERWIN', '', 'CAMPOS', 'jerwin.campos@example.com', 'Operations', 'Worker', 'Capitol', 'Active', 550.00, 0, 'profile_69d5ff06eb31e2.16953567.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 150.00, 1, 21),
(25, 'E0018', 'BENJIE', '', 'CARAS', 'benjie.caras@example.com', 'Operations', 'Worker', NULL, 'Active', 700.00, 0, 'profile_69d5ffdbd4db63.91949381.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 21),
(26, 'E0019', 'JORELLE BONJO', '', 'DACUMOS', 'bonjo.dacumos@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d60206afa450.64233705.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 10),
(27, 'E0020', 'RYAN', '', 'DEOCARIS', 'ryan.deocaris@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d6009b3d7d21.77206328.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 21),
(28, 'E0021', 'BEN', '', 'ESTEPA', 'ben.estepa@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d6007aeb1ce2.19714221.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 600.00, 1, 21),
(29, 'E0022', 'MAR DAVE', '', 'FLORES', 'mardave.flores@example.com', 'Operations', 'Worker', NULL, 'Active', 550.00, 0, 'profile_69d5ffa98b1854.65713856.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 150.00, 0, 10),
(30, 'E0023', 'ALBERT', '', 'FONTANILLA', 'albert.fontanilla@example.com', 'Operations', 'Worker', NULL, 'Active', 550.00, 0, 'profile_69d600ff0c9b92.81545089.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 150.00, 1, 21),
(31, 'E0024', 'JOHN WILSON', NULL, 'FONTANILLA', 'johnwilson.fontanilla@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 20),
(32, 'E0025', 'LEO', '', 'GURTIZA', 'leo.gurtiza@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d5fec772d144.20772071.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 1, 10),
(33, 'E0026', 'JOSE', '', 'IGLECIAS', 'jose.iglecias@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d9afab0cf298.43125381.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 31),
(34, 'E0027', 'JEFFREY', '', 'JIMENEZ', 'jeffrey.jimenez@example.com', 'Operations', 'Worker', NULL, 'Active', 550.00, 0, 'profile_69d6008a7d4189.24345782.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 150.00, 1, 21),
(35, 'E0028', 'WILSON', '', 'LICTAOA', 'wilson.lictaoa@example.com', 'Operations', 'Worker', NULL, 'Inactive', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 21),
(36, 'E0029', 'LORETO', '', 'MABALO', 'loreto.mabalo@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d9bddccd1619.96311862.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 0, 10),
(37, 'E0030', 'ROMEL', '', 'MALLARE', 'romel.mallare@example.com', 'Operations', 'Worker', NULL, 'Active', 800.00, 0, 'profile_69d5fea1eb47d3.35526436.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 150.00, 1, 31),
(38, 'E0031', 'SAMUEL SR.', '', 'MARQUEZ', 'samuel.marquez@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d5fe62cbdd09.62445973.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 21),
(39, 'E0032', 'ROLLY', NULL, 'MARZAN', 'rolly.marzan@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 10),
(40, 'E0033', 'RONALD', '', 'MARZAN', 'ronald.marzan@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d9bdf04c57f8.40601532.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 1000.00, 0, 10),
(41, 'E0034', 'WILSON', '', 'MARZAN', 'wilson.marzan@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d6004781b584.57723505.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 1, 10),
(42, 'E0035', 'MARVIN', NULL, 'MIRANDA', 'marvin.miranda@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 22),
(43, 'E0036', 'JOE', '', 'MONTERDE', 'joe.monterde@example.com', 'Operations', 'Worker', NULL, 'Active', 700.00, 0, 'profile_69d5ff67b7ece6.83173563.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 21),
(44, 'E0038', 'ARNOLD', '', 'NERIDO', 'arnold.nerido@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 0, 31),
(45, 'E0040', 'DANNY', '', 'PADILLA', 'danny.padilla@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d600ac33ec53.26400528.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 10),
(46, 'E0041', 'EDGAR', NULL, 'PANEDA', 'edgar.paneda@example.com', 'Operations', 'Worker', NULL, 'Inactive', 550.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 26),
(47, 'E0042', 'JEREMY', '', 'PIMENTEL', 'jeremy.pimentel@example.com', 'Operations', 'Worker', NULL, 'Active', 550.00, 0, 'profile_69d600d6b1d057.48967611.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 21),
(48, 'E0043', 'MIGUEL', NULL, 'PREPOSI', 'miguel.preposi@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 1, 10),
(49, 'E0044', 'JUN', NULL, 'ROAQUIN', 'jun.roaquin@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 26),
(50, 'E0045', 'RICKMAR', '', 'SANTOS', 'rickmar.santos@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d600eed64931.69263448.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 1, 28),
(51, 'E0046', 'RIO', '', 'SILOY', 'rio.siloy@example.com', 'Operations', 'Worker', NULL, 'Active', 750.00, 0, 'profile_69d5fe758e89a2.19541693.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 150.00, 1, 32),
(52, 'E0047', 'NORMAN', '', 'TARAPE', 'norman.tarape@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d5fe90ac00d1.71248253.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 10),
(53, 'E0048', 'HILMAR', '', 'TATUNAY', 'hilmar.tatunay@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d5ff866f3104.37734210.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 100.00, 1, 21),
(54, 'E0049', 'KENNETH JOHN', '', 'UGAS', 'kennethjohn.ugas@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d5ff943a6d70.65129657.png', '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 50.00, 1, 10),
(55, 'E0050', 'CLYDE JUSTINE', NULL, 'VASADRE', 'clydejustine.vasadre@example.com', 'Operations', 'Worker', NULL, 'Inactive', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 1, 28),
(56, 'E0053', 'JOYLENE F.', NULL, 'BALANON', 'joylene.balanon@example.com', 'Engineering', 'Engineer', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 33),
(57, 'ENG-2026-0002', 'John Kennedy', '', 'Lucas', 'lucas@gmail.com', 'Engineering', 'Engineer', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, 10),
(58, 'ENG-2026-0003', 'Julius John', '', 'Echague', 'echague@gmail.com', 'Engineering', 'Engineer', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 1, 21),
(59, 'PRO-2026-0001', 'Junell', '', 'Tadina', 'tadina@gmail.com', 'Engineering', 'Engineer', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, 33),
(60, 'ENG-2026-0006', 'Winnielyn Kaye', '', 'Olarte', 'olarte@gmail.com', 'Engineering', 'Engineer', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, 33),
(61, 'E0057', 'RONALYN', NULL, 'MALLARE', 'ronalyn.mallare@example.com', 'Administration', 'Admin', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 33),
(62, 'E0058', 'MICHELLE F.', NULL, 'NORIAL', 'michelle.norial@example.com', 'Engineering', 'Engineer', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 05:35:34', NULL, 0.00, 0, 33),
(63, 'ADMIN-2026-0001', 'Elaine', 'Torres', 'Aguilar', 'aguilar@gmail.com', 'Administration', 'Admin', NULL, 'Active', 600.00, 0, 'profile_6996a4f55d7335.10207456.png', '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, 33),
(64, 'SA-2026-002', 'Jason', 'Larkin', 'Wong', 'wong@gmail.com', 'Administration', 'Admin', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, NULL),
(65, 'SA-2026-003', 'Lee Aldrich', '', 'Rimando', 'rimando@gmail.com', 'Administration', 'Admin', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, NULL),
(66, 'SA-2026-004', 'Marc Justin', '', 'Arzadon', 'arzadon@gmail.com', 'Administration', 'Admin', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, NULL),
(67, 'W0050', 'JOSHUA', NULL, 'ARQUITOLA', 'joshua.arquitola@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, 22),
(68, 'W0051', 'VERGEL', '', 'DACUMOS', 'vergel.dacumos@example.com', 'Operations', 'Worker', NULL, 'Inactive', 550.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, 22),
(69, 'W0052', 'REAL RAIN', NULL, 'IVERSON', 'realrain.iverson@example.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, 22),
(70, 'W0053', 'VOHANN', '', 'MIRANDA', 'vohann.miranda@example.com', 'Operations', 'Worker', NULL, 'Inactive', 550.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, 22),
(71, 'W0054', 'SONNY', NULL, 'OCCIANO', 'sonny.occiano@example.com', 'Operations', 'Worker', NULL, 'Inactive', 1400.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, 21),
(72, 'W0055', 'RANDY', '', 'ATON', 'randy.aton@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d600c4792567.58068989.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 50.00, 1, 21),
(73, 'W0056', 'JHUNEL', '', 'CANCHO', 'jhunel.cancho@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d5fe54d05ff6.44033214.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 32),
(74, 'W0057', 'HECTOR', NULL, 'PADICLAS', 'hector.padiclas@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 100.00, 0, 10),
(75, 'W0058', 'MARIANO', NULL, 'NERIDO', 'mariano.nerido@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 10),
(76, 'W0059', 'JAYSON KENNETH', NULL, 'PADILLA', 'jaysonkenneth.padilla@example.com', 'Operations', 'Worker', NULL, 'Inactive', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, 21),
(77, 'W0060', 'JEFFREY', '', 'ZAMORA', 'jeffrey.zamora@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, 'profile_69d601095e8562.71487068.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 100.00, 0, 31),
(78, 'W0061', 'FRANKIE', NULL, 'PADILLA', 'frankie.padilla@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 21),
(79, 'W0062', 'ROMEO', '', 'GURION', 'romeo.gurion@example.com', 'Operations', 'Worker', NULL, 'Active', 550.00, 0, 'profile_69d5ff1d4c6693.09123495.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 10),
(80, 'ADMIN-2026-0003', 'Charisse', 'Abaya', 'Laureaga', 'charisse@gmail.com', 'Administration', 'Admin', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, 33),
(81, 'ADMIN-2026-0004', 'Marjorie', '', 'Garcia', 'garcia@gmail.com', 'Administration', 'Admin', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-18 06:44:22', NULL, 0.00, 0, 5),
(82, 'ENG-2026-0007', 'Earl Cleint', 'Ordono', 'Nisperos', 'nisperos@gmail.com', 'Engineering', 'Engineer', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, 21),
(83, 'IT-2026-01', 'Daniel ', 'Obaldo', 'Rillera', 'danrillera.va@gmail.com', 'IT', 'Developer', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, 33),
(84, 'IT-2026-02', 'Prince Christiane', 'Borja', 'Tolentino', 'tolentinochristian89@gmail.com', 'IT', 'Developer', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, 33),
(85, 'W0063', 'Gilbert', '', 'Avecilla', 'avecilla@gmail.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, NULL),
(86, 'W0064', 'Joseph', '', 'Espanto', 'espanto@gmail.com', 'Operations', 'Worker', NULL, 'Active', 550.00, 0, 'profile_69d9af93b4b563.99389483.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 21),
(87, 'W0065', 'Ronel', '', 'Noces', 'noces@gmail.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, 'profile_69d5fe420625c5.31868763.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 10),
(88, 'W0066', 'Fernando', '', 'Rivera', 'rivera@gmail.com', 'Operations', 'Worker', NULL, 'Active', 700.00, 0, 'profile_69d600e353fb09.09593138.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 21),
(89, 'W0067', 'Darwin', '', 'Gurion', 'gurion1@gmail.com', 'Operations', 'Worker', NULL, 'Active', 700.00, 0, 'profile_69d5fed995d947.19342413.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 10),
(90, 'W0068', 'Rey', '', 'Gurion', 'gurion2@gmail.com', 'Operations', 'Worker', NULL, 'Active', 700.00, 0, 'profile_69d5feeb0d97b1.11056357.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 10),
(91, 'W0069', 'Santi', '', 'Abubo', 'abubo1@gmail.com', 'Operations', 'Worker', NULL, 'Active', 550.00, 0, 'profile_69d5ffe6e6d766.98386818.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 21),
(92, 'ADMIN-2026-0005', 'Lyra', '', 'Javonillo', 'javonillo@gmail.com', 'Administration', 'Admin', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:33:09', NULL, 0.00, 0, 33),
(93, 'W0070', 'Sonny', '', 'Pascua', 'sonny@gmail.com', 'Operations', 'Worker', NULL, 'Inactive', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, NULL),
(94, 'W0071', 'Edwin', '', 'Laforteza', 'edwin@gmail.com', 'Operations', 'Worker', NULL, 'Inactive', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, NULL),
(95, 'W0072', 'Semy', '', 'Abat', 'abat@gmail.com', 'Operations', 'Worker', NULL, 'Inactive', 550.00, 0, 'profile_69c72508562873.21033310.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, NULL),
(96, 'W0073', 'Reynaldo', '', 'Gurion', 'gurion@gmail.com', 'Operations', 'Worker', NULL, 'Active', 700.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, NULL),
(97, 'W0074', 'Larry', '', 'Gurion', 'larry@gmail.com', 'Operations', 'Worker', NULL, 'Active', 700.00, 0, 'profile_69d9aff8f24610.75781313.png', '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 10),
(98, 'W0075', 'Kyle', '', 'Arrieta', 'kyle@gmail.com', 'Operations', 'Worker', NULL, 'Active', 550.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 21),
(99, 'W0076', 'Rolan', '', 'Estrada', 'estrada@gmail.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 31),
(100, 'W0077', 'Ronald', '', 'Estrada', 'ronald@gmail.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 31),
(101, 'W0078', 'Arlene', '', 'Catbagan', 'cat@gmail.com', 'Operations', 'Worker', NULL, 'Inactive', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 1, NULL),
(102, 'W0079', 'Test', '', 'Worker', 'testworker@gmail.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 90.00, 0, 21),
(103, 'W0080', 'Wilben', '', 'Gurion', 'gurion5@gmail.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 10),
(104, 'W0081', 'Rodel', '', 'Ochoco', 'ochoco@gmail.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 10),
(105, 'W0082', 'Justine', '', 'Iglesias', 'Iglesias2@gmail.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 21),
(106, 'W0083', 'Jhonrey', '', 'Danao', 'danao@gmail.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 21),
(107, 'W0084', 'Marvin', '', 'Mirandan', 'miranda@gmail.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 24),
(108, 'W0085', 'SONNY', '', 'OCCIANO', 'occiano@gmail.com', 'Operations', 'Worker', NULL, 'Active', 1400.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 24),
(109, 'W0086', 'GIN TYRONE', '', 'AQUINO', 'aquino@gmail.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 21),
(110, 'W0087', 'EFREN JAY', '', 'MORALES', 'morales@gmail.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, NULL, '2026-04-16 08:33:09', '2026-04-16 08:42:17', NULL, 0.00, 0, 21),
(111, 'W0088', 'tester', 'Tiamin', 'Employe', 'tester@gmail.com', NULL, 'Worker', NULL, 'Active', 0.00, 0, NULL, '2026-04-17 07:49:05', '2026-04-17 07:49:05', NULL, 0.00, 1, NULL),
(112, 'W0089', 'sdfgdfg', 'sdfgdf', 'sdfgsdfg', 'sdfgsd@gmail.com', NULL, 'Worker', NULL, 'Active', 434.00, 0, 'uploads/employees/69e1f56dc2167_compressed_profile.jpg', '2026-04-17 08:55:09', '2026-04-17 08:55:09', NULL, 43543.00, 1, NULL),
(113, 'E0037', 'ALDRED', NULL, 'NATARTE', 'aldred.natarte@example.com', 'Operations', 'Worker', NULL, 'Active', 600.00, 0, NULL, '2026-01-22 07:58:04', '2026-04-18 05:19:40', NULL, 0.00, 1, NULL),
(114, 'E0039', 'RONEL', NULL, 'NOSES', 'ronel.noses@example.com', 'Operations', 'Worker', NULL, 'Active', 500.00, 0, NULL, '2026-01-22 07:58:04', '2026-04-18 05:19:40', NULL, 0.00, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recipient_type` enum('admin','employee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
  `recipient_id` int NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_recipient` (`recipient_type`,`recipient_id`),
  KEY `idx_unread` (`recipient_type`,`recipient_id`,`is_read`),
  KEY `idx_created` (`created_at` DESC)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `recipient_type`, `recipient_id`, `type`, `title`, `message`, `link`, `is_read`, `created_at`, `read_at`) VALUES
(1, 'admin', 1, 'system', 'New Employee Added', 'tester Employe has been added to the system as Worker', '/employee', 0, '2026-04-17 07:49:05', NULL),
(2, 'admin', 14, 'system', 'New Employee Added', 'tester Employe has been added to the system as Worker', '/employee', 0, '2026-04-17 07:49:05', NULL),
(3, 'admin', 13, 'system', 'New Employee Added', 'tester Employe has been added to the system as Worker', '/employee', 0, '2026-04-17 07:49:05', NULL),
(4, 'admin', 12, 'system', 'New Employee Added', 'tester Employe has been added to the system as Worker', '/employee', 0, '2026-04-17 07:49:05', NULL),
(5, 'admin', 11, 'system', 'New Employee Added', 'tester Employe has been added to the system as Worker', '/employee', 0, '2026-04-17 07:49:05', NULL),
(6, 'admin', 10, 'system', 'New Employee Added', 'tester Employe has been added to the system as Worker', '/employee', 0, '2026-04-17 07:49:05', NULL),
(7, 'admin', 15, 'system', 'New Employee Added', 'tester Employe has been added to the system as Worker', '/employee', 0, '2026-04-17 07:49:05', NULL),
(8, 'admin', 16, 'system', 'New Employee Added', 'tester Employe has been added to the system as Worker', '/employee', 0, '2026-04-17 07:49:05', NULL),
(9, 'admin', 1, 'system', 'Employee Profile Updated', 'CESAR ABUBO\'s profile was updated', '/employee', 0, '2026-04-17 08:54:47', NULL),
(10, 'admin', 14, 'system', 'Employee Profile Updated', 'CESAR ABUBO\'s profile was updated', '/employee', 0, '2026-04-17 08:54:47', NULL),
(11, 'admin', 13, 'system', 'Employee Profile Updated', 'CESAR ABUBO\'s profile was updated', '/employee', 0, '2026-04-17 08:54:47', NULL),
(12, 'admin', 12, 'system', 'Employee Profile Updated', 'CESAR ABUBO\'s profile was updated', '/employee', 0, '2026-04-17 08:54:47', NULL),
(13, 'admin', 11, 'system', 'Employee Profile Updated', 'CESAR ABUBO\'s profile was updated', '/employee', 0, '2026-04-17 08:54:47', NULL),
(14, 'admin', 10, 'system', 'Employee Profile Updated', 'CESAR ABUBO\'s profile was updated', '/employee', 0, '2026-04-17 08:54:47', NULL),
(15, 'admin', 15, 'system', 'Employee Profile Updated', 'CESAR ABUBO\'s profile was updated', '/employee', 0, '2026-04-17 08:54:47', NULL),
(16, 'admin', 16, 'system', 'Employee Profile Updated', 'CESAR ABUBO\'s profile was updated', '/employee', 0, '2026-04-17 08:54:47', NULL),
(17, 'admin', 1, 'system', 'New Employee Added', 'sdfgdfg sdfgsdfg has been added to the system as Worker', '/employee', 0, '2026-04-17 08:55:09', NULL),
(18, 'admin', 14, 'system', 'New Employee Added', 'sdfgdfg sdfgsdfg has been added to the system as Worker', '/employee', 0, '2026-04-17 08:55:09', NULL),
(19, 'admin', 13, 'system', 'New Employee Added', 'sdfgdfg sdfgsdfg has been added to the system as Worker', '/employee', 0, '2026-04-17 08:55:09', NULL),
(20, 'admin', 12, 'system', 'New Employee Added', 'sdfgdfg sdfgsdfg has been added to the system as Worker', '/employee', 0, '2026-04-17 08:55:09', NULL),
(21, 'admin', 11, 'system', 'New Employee Added', 'sdfgdfg sdfgsdfg has been added to the system as Worker', '/employee', 0, '2026-04-17 08:55:09', NULL),
(22, 'admin', 10, 'system', 'New Employee Added', 'sdfgdfg sdfgsdfg has been added to the system as Worker', '/employee', 0, '2026-04-17 08:55:09', NULL),
(23, 'admin', 15, 'system', 'New Employee Added', 'sdfgdfg sdfgsdfg has been added to the system as Worker', '/employee', 0, '2026-04-17 08:55:09', NULL),
(24, 'admin', 16, 'system', 'New Employee Added', 'sdfgdfg sdfgsdfg has been added to the system as Worker', '/employee', 0, '2026-04-17 08:55:09', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payroll_records`
--

DROP TABLE IF EXISTS `payroll_records`;
CREATE TABLE IF NOT EXISTS `payroll_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `branch_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payroll_week_start` date NOT NULL,
  `payroll_week_end` date NOT NULL,
  `week_number` int NOT NULL,
  `days_worked` int DEFAULT '0',
  `daily_rate` decimal(10,2) DEFAULT '0.00',
  `basic_pay` decimal(10,2) DEFAULT '0.00',
  `overtime_hours` decimal(5,2) DEFAULT '0.00',
  `overtime_amount` decimal(10,2) DEFAULT '0.00',
  `performance_allowance` decimal(10,2) DEFAULT '0.00',
  `gross_pay` decimal(10,2) DEFAULT '0.00',
  `sss_contribution` decimal(10,2) DEFAULT '0.00',
  `phic_contribution` decimal(10,2) DEFAULT '0.00',
  `hdmf_contribution` decimal(10,2) DEFAULT '0.00',
  `cash_advance` decimal(10,2) DEFAULT '0.00',
  `total_deductions` decimal(10,2) DEFAULT '0.00',
  `net_pay` decimal(10,2) DEFAULT '0.00',
  `status` enum('draft','processed') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
