/**
 * Protocol folder management
 *
 * Handles creation and maintenance of the hidden protocol folder
 * where all metadata, timelines, logs, and cache files are stored.
 */

import { Vault, TFile } from "obsidian";
import { PluginSettings } from "../types";
import { serializeCSV } from "../utils/csvParser";
import { buildIndex, saveIndex } from "../core/metadata/indexFile";

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
			try {
				folder = await vault.createFolder(folderName);
			} catch (error: unknown) {
				// Ignore "folder already exists" error - it's idempotent
				if (!(error instanceof Error && error.message?.includes("already exists"))) {
					throw error;
				}
				folder = vault.getFolderByPath(folderName);
			}
		}

		// Ensure logs folder exists
		const logsPath = `${folderName}/logs`;
		let logsFolder = vault.getFolderByPath(logsPath);
		if (!logsFolder) {
			try {
				logsFolder = await vault.createFolder(logsPath);
			} catch (error: unknown) {
				if (!(error instanceof Error && error.message?.includes("already exists"))) {
					throw error;
				}
				logsFolder = vault.getFolderByPath(logsPath);
			}
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
				try {
					await vault.createFolder(subPath);
				} catch (error: unknown) {
					// Ignore "folder already exists" error - it's idempotent
					if (!(error instanceof Error && error.message?.includes("already exists"))) {
						throw error;
					}
				}
			}
		}

		// Ensure core protocol files exist
		await ensureProtocolFiles(vault, settings);

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
		} else {
			await ensureProtocolFiles(vault, settings);
		}
	} catch (error) {
		console.error("Error ensuring protocol folder structure:", error);
	}
}

async function ensureProtocolFiles(vault: Vault, settings: PluginSettings): Promise<void> {
	const folderName = settings.protocolFolderName;

	await ensureFile(
		vault,
		`${folderName}/${settings.masterMetadataFile}`,
		serializeCSV([])
	);

	await ensureFile(
		vault,
		`${folderName}/hub-cross-references.csv`,
		"id,entities,frequency,sources"
	);

	await ensureFile(
		vault,
		`${folderName}/master-timeline.csv`,
		"id,name,sourceDocument,createdAt,color,eventCount"
	);

	await ensureFile(
		vault,
		`${folderName}/timeline-events.csv`,
		"snapshotId,eventId,order,sentence,text,source_document,source_line,temporalTerms,status,isCustom,color"
	);

	await ensureFile(
		vault,
		`${folderName}/blacklist.txt`,
		"# Blacklisted Words - Do not import as key terms\n# Last updated: " + new Date().toISOString() + "\n\n"
	);

	await ensureIndexFile(vault, settings);
}

async function ensureFile(vault: Vault, path: string, content: string): Promise<void> {
	const existing = vault.getAbstractFileByPath(path);
	if (existing instanceof TFile) {
		return;
	}

	try {
		await vault.create(path, content);
	} catch (error) {
		console.warn(`Failed to create protocol file: ${path}`, error);
	}
}

async function ensureIndexFile(vault: Vault, settings: PluginSettings): Promise<void> {
	const indexPath = `${settings.protocolFolderName}/${settings.indexFile}`;
	const existing = vault.getAbstractFileByPath(indexPath);
	if (existing instanceof TFile) {
		return;
	}

	try {
		const emptyIndex = buildIndex([]);
		await saveIndex(vault, emptyIndex, settings.protocolFolderName, settings.indexFile);
	} catch (error) {
		console.warn("Failed to create index file:", error);
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
	category: "document-scanning" | "metadata-review" | "sub-metadata-review" | "description-edits" | "timeline-edits" | "hub-updates" | "glossary-updates" | "scan-errors"
): string {
	return `${settings.protocolFolderName}/logs/${category}`;
}
