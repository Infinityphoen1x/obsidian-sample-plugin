/**
 * Validation utilities
 *
 * Input validation and data structure verification.
 */

import { Entity, PluginSettings } from "../types";

/**
 * Validate entity data
 * @param entity Entity to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateEntity(entity: Entity): string {
	if (!entity.id || !/^ent_/.test(entity.id)) {
		return "Invalid entity ID format";
	}

	if (!entity.name || entity.name.trim().length === 0) {
		return "Entity name cannot be empty";
	}

	if (typeof entity.frequency !== "number" || entity.frequency < 0) {
		return "Frequency must be a non-negative number";
	}

	if (!Array.isArray(entity.tags)) {
		return "Tags must be an array";
	}

	if (!Array.isArray(entity.sources)) {
		return "Sources must be an array";
	}

	return "";
}

/**
 * Validate settings
 * @param settings Settings to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateSettings(settings: PluginSettings): string {
	if (!settings.protocolFolderName || settings.protocolFolderName.trim().length === 0) {
		return "Protocol folder name cannot be empty";
	}

	if (settings.chunkSize < 50 || settings.chunkSize > 200) {
		return "Chunk size must be between 50 and 200";
	}

	if (!["debug", "info", "warn"].includes(settings.logLevel)) {
		return "Invalid log level";
	}

	return "";
}

/**
 * Validate folder path
 * @param path The path to validate
 * @returns True if valid folder path
 */
export function isValidFolderPath(path: string): boolean {
	return /^[a-zA-Z0-9\-_/.]*$/.test(path) && !path.endsWith("/");
}

/**
 * Validate filename
 * @param filename The filename to validate
 * @returns True if valid markdown filename
 */
export function isValidMarkdownFilename(filename: string): boolean {
	return /^[a-zA-Z0-9\-_. ]+\.md$/.test(filename);
}
