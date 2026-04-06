/**
 * Command registration
 *
 * NOTE: Actual command implementations are in metadataCommands.ts and mainCommands.ts
 * This file should not be used - it's kept for reference only.
 * 
 * Commands are registered via:
 * - registerMainCommands() - Opens main panel and timeline views
 * - registerMetadataCommands() - Scan document, review metadata, timeline, etc.
 * 
 * See main.ts registerAllCommands() method for which functions are called.
 */

import { Plugin } from "obsidian";

export function registerCommands(plugin: Plugin): void {
	// This function is NOT called by the plugin
	// All commands are registered by registerMainCommands and registerMetadataCommands instead
	console.warn(
		"[Metadata Organizer] registerCommands() called but should not be used. " +
		"Use registerMainCommands() and registerMetadataCommands() instead."
	);
}
