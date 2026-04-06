/**
 * Main panel view
 *
 * Control center for plugin operations
 * Displays buttons for scanning, organizing, and editing metadata
 */

import { ItemView, WorkspaceLeaf, Notice, Plugin } from "obsidian";

export class MainPanelView extends ItemView {
	static readonly VIEW_TYPE = "metadata-organizer-main";
	private plugin?: Plugin;

	constructor(leaf: WorkspaceLeaf, plugin?: Plugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return MainPanelView.VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Metadata Organizer";
	}

	getIcon(): string {
		return "layout-grid";
	}

	async onOpen(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();

		// Main container
		const mainEl = containerEl.createDiv({ cls: "main-panel-container" });
		mainEl.style.padding = "20px";

		// Title
		const titleEl = mainEl.createEl("h2", { text: "Metadata Organizer", cls: "panel-title" });
		titleEl.style.marginTop = "0";
		titleEl.style.marginBottom = "20px";
		titleEl.style.color = "#333";

		// Description
		const descEl = mainEl.createEl("p", { text: "Organize your documents and manage metadata", cls: "panel-description" });
		descEl.style.color = "#666";
		descEl.style.marginBottom = "24px";

		// Button groups
		this.createButtonGroup(mainEl, "Document Scanning", [
			{
				label: "📄 Scan Document",
				command: "metadata-organizer-scan-document",
				description: "Extract entities from active document",
			},
		]);

		this.createButtonGroup(mainEl, "Organization", [
			{
				label: "🏷️ Review Metadata",
				command: "metadata-organizer-review",
				description: "Organize entities into groups",
			},
			{
				label: "📝 Create Entity Notes",
				command: "metadata-organizer-sub-metadata",
				description: "Generate child notes for entities",
			},
		]);

		this.createButtonGroup(mainEl, "Timeline", [
			{
				label: "📅 Open Timeline Editor",
				command: "metadata-organizer-timeline",
				description: "Create and manage timeline snapshots",
			},
		]);

		// Info section
		const infoEl = mainEl.createDiv({ cls: "panel-info" });
		infoEl.style.marginTop = "32px";
		infoEl.style.padding = "12px";
		infoEl.style.backgroundColor = "#f0f4f8";
		infoEl.style.borderRadius = "4px";
		infoEl.style.fontSize = "13px";
		infoEl.style.color = "#555";
		infoEl.innerHTML = `
			<strong>📖 Getting Started</strong><br>
			<ul style="margin: 8px 0 0 12px; padding: 0;">
				<li>Open a document and click "Scan Document"</li>
				<li>Review and organize entities</li>
				<li>Create entity notes for linked references</li>
				<li>Build timelines from temporal terms</li>
			</ul>
		`;
	}

	private createButtonGroup(
		container: HTMLElement,
		title: string,
		buttons: Array<{ label: string; command: string; description?: string }>
	): void {
		const groupEl = container.createDiv({ cls: "button-group" });
		groupEl.style.marginBottom = "20px";

		const titleEl = groupEl.createEl("h4", { text: title, cls: "group-title" });
		titleEl.style.margin = "0 0 12px 0";
		titleEl.style.fontSize = "13px";
		titleEl.style.fontWeight = "600";
		titleEl.style.color = "#333";
		titleEl.style.textTransform = "uppercase";
		titleEl.style.letterSpacing = "0.5px";

		buttons.forEach((btn) => {
			this.createButton(groupEl, btn.label, btn.command, btn.description);
		});
	}

	private createButton(
		container: HTMLElement,
		label: string,
		command: string,
		description?: string
	): void {
		const btnEl = container.createDiv({ cls: "button-wrapper" });
		btnEl.style.marginBottom = "10px";

		const btn = btnEl.createEl("button", { text: label, cls: "main-panel-button" });
		btn.style.width = "100%";
		btn.style.padding = "10px 12px";
		btn.style.backgroundColor = "#457B9D";
		btn.style.color = "white";
		btn.style.border = "none";
		btn.style.borderRadius = "4px";
		btn.style.cursor = "pointer";
		btn.style.fontWeight = "500";
		btn.style.textAlign = "left";
		btn.style.transition = "background-color 0.2s";

		btn.addEventListener("mouseenter", () => {
			btn.style.backgroundColor = "#386382";
		});

		btn.addEventListener("mouseleave", () => {
			btn.style.backgroundColor = "#457B9D";
		});

		btn.addEventListener("click", async () => {
			console.debug(`[Button Click] User clicked button for command: ${command}`);
			try {
				console.debug(`[Button] Attempting to execute command: ${command}`);
				// Execute the command using Obsidian's internal command system
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const commandResult = (this.app as any).commands?.executeCommandById?.(command);
				if (commandResult instanceof Promise) {
					await commandResult;
				}
				console.debug(`[Button] Command executed successfully`);
			} catch (error) {
				console.error(`[Button] Error executing command ${command}:`, error);
				new Notice(`❌ Failed to execute: ${command}`);
			}
		});

		if (description) {
			const descEl = btnEl.createEl("small", { text: description, cls: "button-desc" });
			descEl.style.display = "block";
			descEl.style.marginTop = "4px";
			descEl.style.color = "#999";
			descEl.style.fontSize = "12px";
		}
	}

	async onClose(): Promise<void> {
		// Cleanup
	}
}
