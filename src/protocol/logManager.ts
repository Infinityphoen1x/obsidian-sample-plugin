/**
 * Log manager for protocol folder
 *
 * Logs all operations to markdown files in protocol folder.
 * Supports multiple log categories: scanning, reviews, edits, timeline, hub, glossary.
 */

import { Vault } from "obsidian";
import { PluginSettings } from "../types";
import { getLogPath } from "./protocolManager";

export type LogCategory = 
	| "document-scanning"
	| "metadata-review"
	| "sub-metadata-review"
	| "description-edits"
	| "timeline-edits"
	| "hub-updates"
	| "glossary-updates";

/**
 * Log a message to protocol folder
 * @param vault Obsidian Vault
 * @param settings Plugin settings
 * @param category Log category
 * @param message Log message
 * @param data Optional additional data
 */
export async function log(
	vault: Vault,
	settings: PluginSettings,
	category: LogCategory,
	message: string,
	data?: Record<string, unknown>
): Promise<void> {
	try {
		const timestamp = new Date().toISOString();
		const date = new Date().toISOString().split("T")[0];
		const logFolder = getLogPath(settings, category);
		const logFile = `${logFolder}/${date}.md`;

		// Ensure the log folder exists by creating it recursively if needed
		try {
			const folders = logFolder.split('/').filter(f => f);
			let currentPath = '';
			for (const folder of folders) {
				currentPath = currentPath ? `${currentPath}/${folder}` : folder;
				try {
					const existing = vault.getAbstractFileByPath(currentPath);
					if (!existing) {
						console.debug(`[Log] Creating log folder: ${currentPath}`);
						await vault.createFolder(currentPath);
					}
				} catch (error) {
					// Folder might already exist, continue
				}
			}
		} catch (error) {
			console.warn(`[Log] Warning creating log folder: ${error}`);
		}

		let content = `# ${category} Log - ${date}\n\n`;

		// Prepare log entry
		const entry = `## ${timestamp}\n**Message:** ${message}\n`;
		const dataStr = data ? `**Data:** \`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n` : "";

		// Read existing log or create new
		const file = vault.getAbstractFileByPath(logFile);
		if (file && file.name) {
			const existing = await vault.read(file as unknown);
			content = existing + `\n${entry}${dataStr}\n`;
			await vault.modify(file as unknown, content);
			console.debug(`[Log] Appended to log file: ${logFile}`);
		} else {
			content = content + `\n${entry}${dataStr}`;
			await vault.create(logFile, content);
			console.debug(`[Log] Created new log file: ${logFile}`);
		}
	} catch (error) {
		console.error(`Error logging to ${category}:`, error);
	}
}

/**
 * Log a hub co-occurrence detection
 */
export async function logHubCoOccurrence(
	vault: Vault,
	settings: PluginSettings,
	entityNames: string[],
	frequency: number,
	sourceDocument: string,
	lineNumbers: number[]
): Promise<void> {
	const data = {
		entities: entityNames,
		frequency,
		sourceDocument,
		lineNumbers,
		entityCount: entityNames.length,
		timestamp: new Date().toISOString(),
	};
	
	const message = `Detected co-occurrence: ${entityNames.join(" + ")} (frequency: ${frequency})`;
	await log(vault, settings, "hub-updates", message, data);
}

/**
 * Log a glossary entry update
 */
export async function logGlossaryUpdate(
	vault: Vault,
	settings: PluginSettings,
	action: "added" | "updated" | "removed",
	groupName: string,
	entityName: string,
	frequency?: number
): Promise<void> {
	const data = {
		action,
		groupName,
		entityName,
		frequency,
		timestamp: new Date().toISOString(),
	};
	
	const message = `Glossary entry ${action}: ${entityName} in group "${groupName}"`;
	await log(vault, settings, "glossary-updates", message, data);
}

/**
 * Log a timeline modification
 */
export async function logTimelineOperation(
	vault: Vault,
	settings: PluginSettings,
	operation: "snapshot-added" | "snapshot-updated" | "snapshot-removed" | "event-added" | "event-updated" | "event-removed",
	details: Record<string, unknown>
): Promise<void> {
	const data = {
		operation,
		...details,
		timestamp: new Date().toISOString(),
	};
	
	const message = `Timeline operation: ${operation}`;
	await log(vault, settings, "timeline-edits", message, data);
}
