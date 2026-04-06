/**
 * Protocol folder management
 *
 * Handles creation and maintenance of the hidden protocol folder
 * where all metadata, timelines, logs, and cache files are stored.
 */

import { Vault, TFolder } from "obsidian";
import { PluginSettings } from "../types";

/**
 * Initialize protocol folder structure
 * Creates .metadata folder and all subfolders if they don't exist
 */
export async function initializeProtocolFolder(
	vault: Vault,
	settings: PluginSettings
): Promise<void> {
	const folderName = settings.protocolFolderName;

	try {
		// Create main protocol folder
		let folder = vault.getFolderByPath(folderName);
		if (!folder) {
			folder = await vault.createFolder(folderName);
		}

		// Create log subfolders
		const logSubfolders = [
			"document-scanning",
			"metadata-review",
			"sub-metadata-review",
			"description-edits",
			"timeline-edits",
			"hub-updates",
			"glossary-updates",
		];

		for (const subfolder of logSubfolders) {
			const subPath = `${folderName}/logs/${subfolder}`;
			const existing = vault.getFolderByPath(subPath);
			if (!existing) {
				await vault.createFolder(subPath);
			}
		}

		console.log(`Protocol folder initialized at: ${folderName}`);
	} catch (error) {
		console.error("Error initializing protocol folder:", error);
		throw error;
	}
}

/**
 * Ensure protocol folder structure exists (idempotent)
 */
export async function ensureProtocolStructure(
	vault: Vault,
	settings: PluginSettings
): Promise<void> {
	try {
		const folder = vault.getFolderByPath(settings.protocolFolderName);
		if (!folder) {
			await initializeProtocolFolder(vault, settings);
		}
	} catch (error) {
		console.error("Error ensuring protocol folder structure:", error);
	}
}

/**
 * Get the full path to the protocol folder
 */
export function getProtocolFolderPath(settings: PluginSettings): string {
	return settings.protocolFolderName;
}

/**
 * Get path to a specific log subfolder
 */
export function getLogPath(
	settings: PluginSettings,
	category: "document-scanning" | "metadata-review" | "sub-metadata-review" | "description-edits" | "timeline-edits" | "hub-updates" | "glossary-updates"
): string {
	return `${settings.protocolFolderName}/logs/${category}`;
}
