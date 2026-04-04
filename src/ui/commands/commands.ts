/**
 * Command registration
 *
 * Registers all commands for the plugin.
 * TODO: Commands to implement in each phase.
 */

import { Plugin } from "obsidian";

export function registerCommands(plugin: Plugin): void {
	// Phase 1: Scan Document
	plugin.addCommand({
		id: "metadata-organizer-scan-document",
		name: "Scan document for entities",
		callback: () => {
			// TODO: Implement document scanning
		},
	});

	// Phase 2: Metadata Review
	plugin.addCommand({
		id: "metadata-organizer-review",
		name: "Review and organize metadata",
		callback: () => {
			// TODO: Implement metadata review modal
		},
	});

	// Phase 3: Sub-metadata
	plugin.addCommand({
		id: "metadata-organizer-sub-metadata",
		name: "Create entity notes",
		callback: () => {
			// TODO: Implement sub-metadata modal
		},
	});

	// Phase 4: Timeline
	plugin.addCommand({
		id: "metadata-organizer-timeline",
		name: "Open timeline editor",
		callback: () => {
			// TODO: Implement timeline UI
		},
	});
}
