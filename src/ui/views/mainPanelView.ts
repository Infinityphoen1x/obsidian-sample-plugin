/**
 * Main panel view
 *
 * TODO: Implement main app panel with buttons
 */

import { ItemView, WorkspaceLeaf } from "obsidian";

export class MainPanelView extends ItemView {
	static readonly VIEW_TYPE = "metadata-organizer-main";

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return MainPanelView.VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Metadata Organizer";
	}

	async onOpen(): Promise<void> {
		// TODO: Render main panel
	}

	async onClose(): Promise<void> {
		// Cleanup
	}
}
