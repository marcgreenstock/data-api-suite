CREATE DATABASE `test`;
USE `test`;
CREATE TABLE `test` (
	`id` INT(11) AUTO_INCREMENT,
    `nonNullString` VARCHAR(255) NOT NULL,
    `nullString` VARCHAR(255),
    `integer` INT(11),
    `timestamp` TIMESTAMP,
    CONSTRAINT `test_id` PRIMARY KEY (`id`)
) ENGINE = InnoDB;
