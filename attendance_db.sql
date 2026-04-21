/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Employee',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `daily_rate` decimal(10,2) DEFAULT '600.00',
  `branch_id` int DEFAULT NULL,
  `has_deduction` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Whether employee is subject to SSS/PhilHealth/PagIBIG deduction ) (1=yes, 0-no)',
  `sss_loan` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_employees_branch` (`branch_id`),
  KEY `idx_has_deduction` (`has_deduction`)
) ENGINE=MyISAM AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `employees` (`id`, `employee_code`, `first_name`, `middle_name`, `last_name`, `email`, `password_hash`, `position`, `status`, `created_at`, `updated_at`, `profile_image`, `daily_rate`, `branch_id`, `has_deduction`, `sss_loan`) VALUES
(6, 'SA001', 'Super', 'Torres', 'Adminesu', 'admin@jajrconstruction.com', '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', 'Super Admin', 'Active', '2026-01-16 10:26:58', '2026-02-19 13:51:54', 'uploads/profile_images/profile_6_1771480314.png', '600.00', 31, 1, '0.00'),
(11, 'E0001', 'AARIZ', NULL, 'MARLOU', 'aariz.marlou@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 09:58:28', NULL, '700.00', 21, 1, '0.00'),
(12, 'E0002', 'CESAR', '', 'ABUBO', 'cesar.abubo@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-04-11 16:48:02', 'profile_697d962d450256.84780797.png', '550.00', 10, 1, '110.00'),
(13, 'E0003', 'MARLON', '', 'AGUILAR', 'marlon.aguilar@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-04-13 07:21:17', 'profile_6996a4ed2ef972.23487330.png', '600.00', 20, 0, '10.00'),
(14, 'E0004', 'NOEL', NULL, 'ARIZ', 'noel.ariz@example.com', '$2y$10$2Iq/E7PtLMHHBwAjTl.q5OthGTKYXQf5Bx/Q/SXpsmeyQ5VJKcnnO', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-04-08 09:50:26', NULL, '550.00', 10, 0, '0.00'),
(15, 'E0005', 'DANIEL', NULL, 'BACHILLER', 'daniel.bachiller@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:27:53', NULL, '600.00', 20, 1, '0.00'),
(16, 'E0006', 'ALFREDO', NULL, 'BAGUIO', 'alfredo.baguio@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:22:15', NULL, '550.00', 10, 1, '0.00'),
(17, 'E0007', 'ROLLY', NULL, 'BALTAZAR', 'rolly.baltazar@example.com', '$2y$10$4/nX3PsxAeYnik1fwh7lxO3XJHlW.IiOjK5NZPDCDD9eXoCBMVp8K', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:22:23', NULL, '500.00', 10, 1, '0.00'),
(18, 'E0008', 'DONG', NULL, 'BAUTISTA', 'dong.bautista@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 15:01:04', NULL, '600.00', 20, 1, '0.00'),
(19, 'E0009', 'JANLY', NULL, 'BELINO', 'janly.belino@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:24:27', NULL, '650.00', 10, 1, '0.00'),
(20, 'E0010', 'MENUEL', NULL, 'BENITEZ', 'menuel.benitez@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-04-08 09:50:48', NULL, '600.00', 10, 0, '0.00'),
(21, 'E0011', 'GELMAR', NULL, 'BERNACHEA', 'gelmar.bernachea@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:24:13', NULL, '500.00', 10, 1, '0.00'),
(22, 'E0012', 'JOMAR', NULL, 'CABANBAN', 'jomar.cabanban@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 15:01:04', NULL, '600.00', 22, 1, '0.00'),
(23, 'E0013', 'MARIO', NULL, 'CABANBAN', 'mario.cabanban@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:23:08', NULL, '600.00', 10, 1, '0.00'),
(24, 'E0014', 'KELVIN', NULL, 'CALDERON', 'kelvin.calderon@example.com', '$2y$10$d7rLs2lPiCob5CCSgaZVqO3w9jDwWaFIIsH7eqpaZ1/7myUv319q2', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-13 16:26:11', NULL, '500.00', 21, 1, '0.00'),
(25, 'E0015', 'FLORANTE', NULL, 'CALUZA', 'florante.caluza@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 15:01:04', NULL, '600.00', 22, 1, '0.00'),
(26, 'E0016', 'MELVIN', NULL, 'CAMPOS', 'melvin.campos@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:26:08', NULL, '600.00', 21, 1, '0.00'),
(27, 'E0017', 'JERWIN', NULL, 'CAMPOS', 'jerwin.campos@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:22:14', NULL, '550.00', 21, 1, '0.00'),
(28, 'E0018', 'BENJIE', NULL, 'CARAS', 'benjie.caras@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:23:27', NULL, '700.00', 10, 1, '0.00'),
(29, 'E0019', 'BONJO', NULL, 'DACUMOS', 'bonjo.dacumos@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:25:08', NULL, '500.00', 10, 1, '0.00'),
(30, 'E0020', 'RYAN', NULL, 'DEOCARIS', 'ryan.deocaris@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:26:16', NULL, '500.00', 21, 1, '0.00'),
(31, 'E0021', 'BEN', NULL, 'ESTEPA', 'ben.estepa@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:23:41', NULL, '600.00', 10, 1, '0.00'),
(32, 'E0022', 'MAR DAVE', NULL, 'FLORES', 'mardave.flores@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:28:21', NULL, '550.00', 20, 1, '0.00'),
(33, 'E0023', 'ALBERT', NULL, 'FONTANILLA', 'albert.fontanilla@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:22:14', NULL, '550.00', 20, 1, '0.00'),
(34, 'E0024', 'JOHN WILSON', NULL, 'FONTANILLA', 'johnwilson.fontanilla@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 15:51:18', NULL, '600.00', 20, 1, '0.00'),
(35, 'E0025', 'LEO', NULL, 'GURTIZA', 'leo.gurtiza@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:23:47', NULL, '600.00', 10, 1, '0.00'),
(36, 'E0026', 'JOSE', NULL, 'IGLECIAS', 'jose.iglecias@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:26:21', NULL, '500.00', 21, 1, '0.00'),
(37, 'E0027', 'JEFFREY', NULL, 'JIMENEZ', 'jeffrey.jimenez@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:28:37', NULL, '550.00', 20, 1, '0.00'),
(38, 'E0028', 'WILSON', NULL, 'LICTAOA', 'wilson.lictaoa@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:26:29', NULL, '500.00', 21, 1, '0.00'),
(39, 'E0029', 'LORETO', NULL, 'MABALO', 'loreto.mabalo@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:24:06', NULL, '600.00', 10, 1, '0.00'),
(40, 'E0030', 'ROMEL', NULL, 'MALLARE', 'romel.mallare@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:26:06', NULL, '800.00', 10, 1, '0.00'),
(41, 'E0031', 'SAMUEL SR.', NULL, 'MARQUEZ', 'samuel.marquez@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:28:57', NULL, '500.00', 20, 1, '0.00'),
(42, 'E0032', 'ROLLY', NULL, 'MARZAN', 'rolly.marzan@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:26:46', NULL, '600.00', 21, 1, '0.00'),
(43, 'E0033', 'RONALD', NULL, 'MARZAN', 'ronald.marzan@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:24:22', NULL, '600.00', 10, 1, '0.00'),
(44, 'E0034', 'WILSON', NULL, 'MARZAN', 'wilson.marzan@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:26:38', NULL, '600.00', 21, 1, '0.00'),
(45, 'E0035', 'MARVIN', NULL, 'MIRANDA', 'marvin.miranda@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:21:12', NULL, '600.00', 22, 1, '0.00'),
(46, 'E0036', 'JOE', NULL, 'MONTERDE', 'joe.monterde@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 15:01:04', NULL, '700.00', 10, 1, '0.00'),
(47, 'E0037', 'ALDRED', NULL, 'NATARTE', 'aldred.natarte@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 15:01:04', NULL, '600.00', 10, 1, '0.00'),
(48, 'E0038', 'ARNOLD', NULL, 'NERIDO', 'arnold.nerido@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 09:58:24', NULL, '600.00', 21, 1, '0.00'),
(49, 'E0039', 'RONEL', NULL, 'NOSES', 'ronel.noses@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:26:40', NULL, '500.00', 10, 1, '0.00'),
(50, 'E0040', 'DANNY', NULL, 'PADILLA', 'danny.padilla@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:25:01', NULL, '500.00', 10, 1, '0.00'),
(51, 'E0041', 'EDGAR', NULL, 'PANEDA', 'edgar.paneda@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 15:01:04', NULL, '550.00', 26, 1, '0.00'),
(52, 'E0042', 'JEREMY', NULL, 'PIMENTEL', 'jeremy.pimentel@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:25:09', NULL, '550.00', 10, 1, '0.00'),
(53, 'E0043', 'MIGUEL', NULL, 'PREPOSI', 'miguel.preposi@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:25:16', NULL, '600.00', 10, 1, '0.00'),
(54, 'E0044', 'JUN', NULL, 'ROAQUIN', 'jun.roaquin@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 15:01:04', NULL, '600.00', 26, 1, '0.00'),
(55, 'E0045', 'RICKMAR', NULL, 'SANTOS', 'rickmar.santos@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:34:19', NULL, '500.00', 28, 1, '0.00'),
(56, 'E0046', 'RIO', NULL, 'SILOY', 'rio.siloy@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:34:48', NULL, '750.00', 32, 1, '0.00'),
(57, 'E0047', 'NORMAN', NULL, 'TARAPE', 'norman.tarape@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:29:59', NULL, '500.00', 10, 1, '0.00'),
(58, 'E0048', 'HILMAR', NULL, 'TATUNAY', 'hilmar.tatunay@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-09 08:33:51', NULL, '500.00', 20, 1, '0.00'),
(59, 'E0049', 'KENNETH JOHN', NULL, 'UGAS', 'kennethjohn.ugas@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 16:25:30', NULL, '600.00', 10, 1, '0.00'),
(60, 'E0050', 'CLYDE JUSTINE', NULL, 'VASADRE', 'clydejustine.vasadre@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Worker', 'Active', '2026-01-22 15:58:04', '2026-02-06 15:01:04', NULL, '500.00', 28, 1, '0.00'),
(63, 'ENG-2026-0005', 'JOYLENE F.', NULL, 'BALANON', 'joylene.balanon@example.com', '$2y$10$6sbxv2qIU8i/2KUOVDrUZOLBIHTOvRoI9ApBOwLtYPXN60w8jx4mm', 'Engineer', 'Active', '2026-01-22 15:58:04', '2026-04-21 13:42:35', NULL, '600.00', 33, 0, '0.00'),
(67, 'ADMIN-2026-0002', 'RONALYN', NULL, 'MALLARE', 'ronalyn.mallare@example.com', '$2y$10$s7xQ8p1U.l28nDSgbhYG/uLSvLFL5CA1Weyn0APXBa93lnoX7eANK', 'Admin', 'Active', '2026-01-22 15:58:04', '2026-02-10 16:14:16', NULL, '600.00', 33, 1, '0.00'),
(68, 'ENG-2026-0001', 'MICHELLE F.', NULL, 'NORIAL', 'michelle.norial@example.com', '$2y$10$uIk2ehlCc6dssBZzLVITSOucNq/LPXCv2a7cZi5MDquTH7pmmN94O', 'Engineer', 'Active', '2026-01-22 15:58:04', '2026-02-12 10:09:06', NULL, '600.00', 29, 1, '0.00'),
(113, 'ENG-2026-0002', 'John Kennedy', '', 'Lucas', 'lucas@gmail.com', '$2y$10$p.ERk7.PwModiMwq61au.ufymZHF/jRpMffS3dQBobbFwEmADEUT.', 'Engineer', 'Active', '2026-02-06 15:11:15', '2026-02-07 15:34:49', NULL, '600.00', NULL, 1, '0.00'),
(114, 'ENG-2026-0003', 'Julius John', '', 'Echague', 'echague@gmail.com', '$2y$10$5vYYVwzl3qRA1ClmqUBjJu/YM8SrszeIhO6oEtaoFXcuVxIpmvrV2', 'Engineer', 'Active', '2026-02-06 15:12:00', '2026-02-07 15:34:38', NULL, '600.00', NULL, 1, '0.00'),
(115, 'PRO-2026-0001', 'Junell', '', 'Tadina', 'tadina@gmail.com', '$2y$10$Nc0l0GkWV9crcUj7dc1vie4ry1up7kwrYBJGeH5oDSvJlhKCOgUt6', 'Engineer', 'Active', '2026-02-06 15:12:32', '2026-02-10 10:31:56', NULL, '600.00', NULL, 1, '0.00'),
(116, 'ENG-2026-0006', 'Winnielyn Kaye', '', 'Olarte', 'olarte@gmail.com', '$2y$10$1NUUvvknY0mWhdfHYYygheh6Kj1zoCTQSQcxOzPUKNyR28/S4cj7G', 'Engineer', 'Active', '2026-02-06 15:14:59', '2026-02-07 15:35:05', NULL, '600.00', NULL, 1, '0.00'),
(117, 'ADMIN-2026-0001', 'ELAINE', 'Torres', 'Aguilar', 'aguilar@gmail.com', '$2y$10$Q0GiyO/e43xHBEwRHNAmvOoh7pu9TEiN3t1Jl1mL39UuhHsv6k8Wq', 'Admin', 'Active', '2026-02-06 15:15:51', '2026-04-10 09:19:50', 'profile_6996a4f55d7335.10207456.png', '600.00', 33, 0, '0.00'),
(118, 'SA-2026-002', 'Jason', 'Larkin', 'Wong', 'wong@gmail.com', '$2y$10$TWT37ldw/9w1nEBDLtVgvOS/6gEEM1IJSbthCB/9vHmaeJ7FYuGbC', 'Super Admin', 'Active', '2026-02-06 15:16:34', '2026-02-07 15:33:29', NULL, '600.00', NULL, 1, '0.00'),
(119, 'SA-2026-003', 'Lee Aldrich', '', 'Rimando', 'rimando@gmail.com', '$2y$10$BeFRm.XDlPuyZJHLC4Qhw.WZuxW8biClIxAAILz9PEzVaO9gEo92G', 'Super Admin', 'Active', '2026-02-06 15:17:12', '2026-02-07 15:33:18', NULL, '600.00', NULL, 1, '0.00'),
(120, 'SA-2026-004', 'Marc', '', 'Arzadon', 'arzadon@gmail.com', '$2y$10$qSf327Nylr1l.TkboICD6ujkKmYGEaiTvixotQ.Jh/XP.MYOZsJIe', 'Super Admin', 'Active', '2026-02-06 15:18:15', '2026-04-10 11:58:56', NULL, '600.00', NULL, 0, '0.00'),
(121, 'E0052', 'JOSHUA', NULL, 'ARQUITOLA', 'joshua.arquitola@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:22', '2026-04-08 09:50:32', NULL, '600.00', 22, 0, '0.00'),
(122, 'E0053', 'VERGEL', NULL, 'DACUMOS', 'vergel.dacumos@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:22', '2026-02-06 16:48:24', NULL, '600.00', 22, 1, '0.00'),
(123, 'E0054', 'REAL RAIN', NULL, 'IVERSON', 'realrain.iverson@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:22', '2026-02-06 16:48:38', NULL, '600.00', 22, 1, '0.00'),
(124, 'E0055', 'VOHANN', NULL, 'MIRANDA', 'vohann.miranda@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:22', '2026-02-06 16:48:48', NULL, '600.00', 22, 1, '0.00'),
(125, 'E0056', 'SONNY', NULL, 'OCCIANO', 'sonny.occiano@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:22', '2026-02-09 08:23:00', NULL, '1400.00', 22, 1, '0.00'),
(126, 'E0065', 'RANDY', NULL, 'ATON', 'randy.aton@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:34', '2026-02-06 16:47:34', NULL, '600.00', 10, 1, '0.00'),
(127, 'E0058', 'JHUNEL', NULL, 'CANCHO', 'jhunel.cancho@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:34', '2026-02-09 08:24:48', NULL, '500.00', 10, 1, '0.00'),
(129, 'E0060', 'HECTOR', NULL, 'PADICLAS', 'hector.padiclas@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:34', '2026-02-06 16:47:34', NULL, '600.00', 10, 1, '0.00'),
(130, 'E0061', 'MARIANO', NULL, 'NERIDO', 'mariano.nerido@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:34', '2026-02-06 16:51:31', NULL, '600.00', 21, 1, '0.00'),
(131, 'E0062', 'JAYSON KENNETH', NULL, 'PADILLA', 'jaysonkenneth.padilla@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:34', '2026-02-09 08:31:58', NULL, '500.00', 21, 1, '0.00'),
(132, 'E0063', 'JEFFREY', NULL, 'ZAMORA', 'jeffrey.zamora@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:34', '2026-02-09 09:58:11', NULL, '600.00', 21, 1, '0.00'),
(133, 'E0064', 'FRANKIE', NULL, 'PADILLA', 'frankie.padilla@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:47:34', '2026-02-09 08:33:37', NULL, '500.00', 20, 1, '0.00'),
(134, 'E0066', 'ROMEO', NULL, 'GURION', 'romeo.gurion@example.com', 'df0156a0e0f8f16e44f3878b6be24a0d', 'Worker', 'Active', '2026-02-06 16:50:56', '2026-02-09 08:22:14', NULL, '550.00', 10, 1, '0.00'),
(135, 'ADMIN-2026-0003', 'Admin', '', 'Charisse', 'charisse@gmail.com', '$2y$10$okYrrmkMRDWVUZpjtghDG.7QgVaq9X7ZQjHHZYKZPhSCAwLl8STPS', 'ADMIN', 'Active', '2026-02-10 15:55:32', '2026-04-21 11:07:09', NULL, '600.00', 33, 1, '0.00'),
(136, 'ADMIN-2026-0004', 'Marjorie', '', 'Garcia', 'garcia@gmail.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'ADMIN', 'Active', '2026-02-10 15:56:55', '2026-02-10 16:19:47', NULL, '600.00', 33, 1, '0.00'),
(137, 'IT-2026-001', 'Daniel', 'Obaldo', 'Rillera', 'danrillera.va@gmail.com', '$2y$10$Mae5Rwb.AE1Rnz4bosTMyOz4XJdLDmhjnVBZw4nYQorRPt.CSyjje', 'Developer', 'Active', '2026-03-13 00:00:00', '2026-04-21 10:26:50', '', '0.00', 33, 1, '0.00');


/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;