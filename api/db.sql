-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Aug 10, 2025 at 06:50 PM
-- Server version: 10.6.22-MariaDB-cll-lve
-- PHP Version: 8.4.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ewinners_gui`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`ewinners`@`localhost` PROCEDURE `insert_dummy_users` ()   BEGIN
    DECLARE i INT DEFAULT 1;
    WHILE i <= 100000 DO
        INSERT INTO users (name, email, age, city)
        VALUES (
            CONCAT('User', i),
            CONCAT('user', i, '@example.com'),
            FLOOR(18 + (RAND() * 42)), -- random age between 18 and 60
            ELT(FLOOR(1 + (RAND() * 4)), 'Colombo', 'Galle', 'Kandy', 'Jaffna')
        );
        SET i = i + 1;
    END WHILE;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `activity_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) DEFAULT NULL,
  `method` varchar(10) NOT NULL,
  `path` varchar(255) NOT NULL,
  `status_code` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`activity_id`, `user_id`, `permission_id`, `method`, `path`, `status_code`, `created_at`) VALUES
(1, 2, 2, 'PUT', '/api/users/3', 200, '2025-08-10 04:15:43'),
(2, 2, 2, 'PUT', '/api/users/3', 200, '2025-08-10 04:16:12'),
(3, 2, 3, 'POST', '/api/divisions', 201, '2025-08-10 04:33:29'),
(4, 2, 3, 'POST', '/api/divisions', 201, '2025-08-10 04:33:38'),
(5, 2, 6, 'POST', '/api/machines', 400, '2025-08-10 04:52:12'),
(6, 2, 6, 'POST', '/api/machines', 500, '2025-08-10 04:52:17'),
(7, 2, 3, 'POST', '/api/divisions', 201, '2025-08-10 04:56:24'),
(8, 2, 6, 'POST', '/api/machines', 201, '2025-08-10 04:57:04'),
(9, 2, 6, 'POST', '/api/machines', 201, '2025-08-10 04:57:40'),
(10, 2, 10, 'PUT', '/api/users/3/status', 400, '2025-08-10 13:14:09'),
(11, 2, 10, 'PUT', '/api/users/3/status', 200, '2025-08-10 13:15:06'),
(12, 2, 10, 'PUT', '/api/users/3/status', 400, '2025-08-10 13:15:14');

-- --------------------------------------------------------

--
-- Table structure for table `divisions`
--

CREATE TABLE `divisions` (
  `division_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `division_type_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `divisions`
--

INSERT INTO `divisions` (`division_id`, `title`, `parent_id`, `division_type_id`) VALUES
(1, 'soup', NULL, 1),
(2, 'PC', NULL, 1),
(3, 'Shampoo', 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `division_types`
--

CREATE TABLE `division_types` (
  `division_type_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `division_types`
--

INSERT INTO `division_types` (`division_type_id`, `title`) VALUES
(1, 'plant'),
(2, 'line');

-- --------------------------------------------------------

--
-- Table structure for table `machines`
--

CREATE TABLE `machines` (
  `machine_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `division_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `machines`
--

INSERT INTO `machines` (`machine_id`, `title`, `division_id`) VALUES
(2, 'filling machine', 3),
(3, 'carton machine', 3);

-- --------------------------------------------------------

--
-- Table structure for table `meters`
--

CREATE TABLE `meters` (
  `meter_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `machine_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parameters`
--

CREATE TABLE `parameters` (
  `parameter_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `value_type` enum('string','number','boolean') NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `meter_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `permission_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`permission_id`, `name`, `description`) VALUES
(1, 'user.list', NULL),
(2, 'user.update', NULL),
(3, 'division.add', NULL),
(4, 'division.list', NULL),
(5, 'division.update', NULL),
(6, 'machine.add', NULL),
(7, 'machine.list', NULL),
(8, 'machine.update', NULL),
(9, 'machine.delete', NULL),
(10, 'user.status.update', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `name`) VALUES
(4, 'super.admin'),
(1, 'user');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(4, 1),
(4, 2),
(4, 3),
(4, 4),
(4, 5),
(4, 6),
(4, 7),
(4, 8),
(4, 9),
(4, 10);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL,
  `status` set('pending','verified','deleted') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `email`, `password_hash`, `role_id`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(2, 'ramishka', 'Geenath', 'ramishka@gmail.com', '$2b$10$JH3y6qWNHbWbto0i/FPS4uIbXVD6IOn9twa6UHPifqxT5dpr26lvC', 4, 'pending', '2025-08-10 03:16:00', '2025-08-10 03:30:48', NULL),
(3, 'Gihan', 'Karunarathne', 'gihan@gmail.com', '$2b$10$9Q77Xq5aM87S/zDwv2YMAOhI1DUWd5VGAIXVQRuSI8DnMqOHyIutG', 1, 'verified', '2025-08-10 04:15:08', '2025-08-10 13:15:05', NULL),
(4, 'ramishka', 'thennakoon', 'test@gmail.com', '$2b$10$NXMDMckzyYSsIAtCvJlSTOdvnr4mCWJDlWWPxpK19JygDOa/Mdq6W', 1, 'pending', '2025-08-10 06:07:28', '2025-08-10 06:07:28', NULL),
(5, 'ramishka', 'Geenath', 'ramishkaa@gmail.com', '$2b$10$HRWPjpvhbFLq0gMDLlYMme3HPq4V91lMpVWebWyyKa8Y7lQkTIjzO', 1, 'pending', '2025-08-10 06:17:46', '2025-08-10 06:17:46', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`activity_id`),
  ADD KEY `fk_activities_user` (`user_id`),
  ADD KEY `fk_activities_permission` (`permission_id`);

--
-- Indexes for table `divisions`
--
ALTER TABLE `divisions`
  ADD PRIMARY KEY (`division_id`),
  ADD KEY `fk_divisions_type` (`division_type_id`),
  ADD KEY `idx_divisions_parent` (`parent_id`);

--
-- Indexes for table `division_types`
--
ALTER TABLE `division_types`
  ADD PRIMARY KEY (`division_type_id`);

--
-- Indexes for table `machines`
--
ALTER TABLE `machines`
  ADD PRIMARY KEY (`machine_id`),
  ADD KEY `idx_machines_division` (`division_id`);

--
-- Indexes for table `meters`
--
ALTER TABLE `meters`
  ADD PRIMARY KEY (`meter_id`),
  ADD KEY `idx_meters_machine` (`machine_id`);

--
-- Indexes for table `parameters`
--
ALTER TABLE `parameters`
  ADD PRIMARY KEY (`parameter_id`),
  ADD KEY `idx_parameters_meter` (`meter_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`permission_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `fk_rp_permission` (`permission_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_role` (`role_id`),
  ADD KEY `idx_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `divisions`
--
ALTER TABLE `divisions`
  MODIFY `division_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `division_types`
--
ALTER TABLE `division_types`
  MODIFY `division_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `machines`
--
ALTER TABLE `machines`
  MODIFY `machine_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `meters`
--
ALTER TABLE `meters`
  MODIFY `meter_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parameters`
--
ALTER TABLE `parameters`
  MODIFY `parameter_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `fk_activities_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`),
  ADD CONSTRAINT `fk_activities_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `divisions`
--
ALTER TABLE `divisions`
  ADD CONSTRAINT `fk_divisions_parent` FOREIGN KEY (`parent_id`) REFERENCES `divisions` (`division_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_divisions_type` FOREIGN KEY (`division_type_id`) REFERENCES `division_types` (`division_type_id`);

--
-- Constraints for table `machines`
--
ALTER TABLE `machines`
  ADD CONSTRAINT `fk_machines_division` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`division_id`);

--
-- Constraints for table `meters`
--
ALTER TABLE `meters`
  ADD CONSTRAINT `fk_meters_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`machine_id`);

--
-- Constraints for table `parameters`
--
ALTER TABLE `parameters`
  ADD CONSTRAINT `fk_parameters_meter` FOREIGN KEY (`meter_id`) REFERENCES `meters` (`meter_id`);

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
