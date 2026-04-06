import { Plugin, Notice } from "obsidian";
import { TimelineView } from "../ui/views/timelineView";
import { MainPanelView } from "../ui/views/mainPanelView";

/**
 * Register all custom views with the plugin
 * Called once in onload - views register only once, may be re-created on reload
 */
export function registerViews(plugin: Plugin): void {
	// Register timeline view
	plugin.registerView(
		TimelineView.VIEW_TYPE,
		(leaf) => new TimelineView(leaf, plugin)
	);

	// Register main panel view
	plugin.registerView(
		MainPanelView.VIEW_TYPE,
		(leaf) => new MainPanelView(leaf, plugin)
	);
}

/**
 * Safely activate timeline view
 * Checks for existing leaves and reuses or creates new one
 */
export async function activateTimelinePane(plugin: Plugin): Promise<void> {
	const existingLeaves = plugin.app.workspace.getLeavesOfType(TimelineView.VIEW_TYPE);
	const leaf = existingLeaves.length > 0 ? existingLeaves[0] : plugin.app.workspace.getLeaf("tab");

	if (!leaf) {
		new Notice("Unable to open timeline pane.");
		return;
	}

	await leaf.setViewState({
		type: TimelineView.VIEW_TYPE,
		active: true,
	});

	await plugin.app.workspace.revealLeaf(leaf);
	new Notice("Opened timeline view");
}

/**
 * Safely activate main panel view
 * Checks for existing leaves and reuses or creates new one
 */
export async function activateMainPanel(plugin: Plugin): Promise<void> {
	const existingLeaves = plugin.app.workspace.getLeavesOfType(MainPanelView.VIEW_TYPE);
	const leaf =
		existingLeaves.length > 0
			? existingLeaves[0]
			: plugin.app.workspace.getRightLeaf(false);

	if (!leaf) {
		new Notice("Unable to open main panel.");
		return;
	}

	await leaf.setViewState({
		type: MainPanelView.VIEW_TYPE,
		active: true,
	});

	await plugin.app.workspace.revealLeaf(leaf);
	new Notice("Opened main panel");
}
