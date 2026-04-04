/**
 * Log manager for protocol folder
 *
 * Logs all operations to markdown files in protocol folder.
 * Supports multiple log categories: scanning, reviews, edits.
 */

import { Vault } from "obsidian";
import { PluginSettings } from "../types";
import { getLogPath } from "./protocolManager";

export type LogCategory = 
	| "document-scanning"
	| "metadata-review"
	| "sub-metadata-review"
	| "description-edits"
	| "timeline-edits";

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
	data?: Record<string, any>
): Promise<void> {
	try {
		const timestamp = new Date().toISOString();
		const date = new Date().toISOString().split("T")[0];
		const logFolder = getLogPath(settings, category);
		const logFile = `${logFolder}/${date}.md`;

		let content = `# ${category} Log - ${date}\n\n`;

		// Prepare log entry
		const entry = `## ${timestamp}\n**Message:** ${message}\n`;
		const dataStr = data ? `**Data:** \`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n` : "";

		// Read existing log or create new
		const file = vault.getFileByPath(logFile);
		if (file) {
			const existing = await vault.read(file);
			content = existing + `\n${entry}${dataStr}\n`;
			await vault.modify(file, content);
		} else {
			content = content + `\n${entry}${dataStr}`;
			await vault.create(logFile, content);
		}
	} catch (error) {
		console.error(`Error logging to ${category}:`, error);
	}
}
