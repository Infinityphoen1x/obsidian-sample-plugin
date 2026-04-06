import { Plugin } from "obsidian";
import { activateMainPanel, activateTimelinePane } from "../../initialization/initializeViews";

/**
 * Register main panel and timeline view commands
 */
export function registerMainCommands(plugin: Plugin): void {
	// Open Main Panel command
	plugin.addCommand({
		id: "metadata-organizer-open-panel",
		name: "Open main panel",
		callback: async () => {
			await activateMainPanel(plugin);
		},
	});

	// Open Timeline command
	plugin.addCommand({
		id: "metadata-organizer-open-timeline",
		name: "Open timeline view",
		callback: async () => {
			await activateTimelinePane(plugin);
		},
	});
}
