/**
 * Timeline View - Main panel UI
 *
 * Custom view for displaying and managing the master timeline.
 * Allows users to see, organize, and manage timeline snapshots.
 */

import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { TimelineEvent } from "../../types";
import { TimelineRenderer } from "../components/timelineRenderer";

export interface TimelineSnapshot {
	id: string;
	name: string;
	events: TimelineEvent[];
	sourceDocument: string;
	createdAt: number;
	color?: string;
}

export class TimelineView extends ItemView {
	static readonly VIEW_TYPE = "metadata-organizer-timeline";
	
	private snapshots: TimelineSnapshot[] = [];
	private currentSnapshotId: string | null = null;
	private renderer: TimelineRenderer | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return TimelineView.VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Timeline";
	}

	getIcon(): string {
		return "calendar";
	}

	async onOpen(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();

		// Main container
		const mainEl = containerEl.createDiv({ cls: "timeline-view-container" });
		mainEl.style.display = "flex";
		mainEl.style.flexDirection = "column";
		mainEl.style.height = "100%";

		// Header
		const headerEl = mainEl.createDiv({ cls: "timeline-view-header" });
		headerEl.style.padding = "12px";
		headerEl.style.borderBottom = "1px solid #e0e0e0";
		headerEl.style.backgroundColor = "#f8f8f8";

		const titleEl = headerEl.createEl("h3", { text: "Master Timeline", cls: "timeline-title" });
		titleEl.style.margin = "0 0 8px 0";

		// Controls
		const controlsEl = headerEl.createDiv({ cls: "timeline-controls" });
		controlsEl.style.display = "flex";
		controlsEl.style.gap = "8px";
		controlsEl.style.flexWrap = "wrap";

		// Add snapshot button
		const addBtn = controlsEl.createEl("button", { text: "+ Add Snapshot", cls: "timeline-button" });
		addBtn.style.padding = "6px 12px";
		addBtn.style.backgroundColor = "#457B9D";
		addBtn.style.color = "white";
		addBtn.style.border = "none";
		addBtn.style.borderRadius = "4px";
		addBtn.style.cursor = "pointer";
		addBtn.addEventListener("click", () => {
			new Notice("📅 Use 'Open timeline editor' command to create snapshots");
		});

		// Content area
		const contentEl = mainEl.createDiv({ cls: "timeline-view-content" });
		contentEl.style.display = "flex";
		contentEl.style.flex = "1";
		contentEl.style.overflowY = "auto";

		// Sidebar (snapshot list)
		const sidebarEl = contentEl.createDiv({ cls: "timeline-sidebar" });
		sidebarEl.style.width = "250px";
		sidebarEl.style.borderRight = "1px solid #e0e0e0";
		sidebarEl.style.backgroundColor = "#f5f5f5";
		sidebarEl.style.overflowY = "auto";
		sidebarEl.style.paddingTop = "12px";

		this.renderSnapshotList(sidebarEl);

		// Timeline display area
		const timelineDisplayEl = contentEl.createDiv({ cls: "timeline-display" });
		timelineDisplayEl.style.flex = "1";
		timelineDisplayEl.style.padding = "20px";
		timelineDisplayEl.style.overflowY = "auto";

		// Render default message or timeline
		if (this.snapshots.length === 0) {
			timelineDisplayEl.createEl("p", {
				text: "No timeline snapshots yet. Use the 'Open timeline editor' command to create one.",
				cls: "empty-state",
			});
		} else {
			this.renderTimelineDisplay(timelineDisplayEl);
		}
	}

	private renderSnapshotList(container: HTMLElement): void {
		container.empty();

		if (this.snapshots.length === 0) {
			container.createEl("p", { text: "No snapshots", cls: "empty-list", });
			return;
		}

		this.snapshots.forEach((snapshot) => {
			const itemEl = container.createDiv({ cls: "snapshot-list-item" });
			itemEl.style.padding = "10px 12px";
			itemEl.style.marginBottom = "8px";
			itemEl.style.backgroundColor = this.currentSnapshotId === snapshot.id ? "#e3f2fd" : "transparent";
			itemEl.style.borderLeft = `4px solid ${snapshot.color || "#457B9D"}`;
			itemEl.style.cursor = "pointer";
			itemEl.style.borderRadius = "2px";

			const titleEl = itemEl.createEl("div", { text: snapshot.name, cls: "snapshot-title" });
			titleEl.style.fontWeight = "500";
			titleEl.style.marginBottom = "4px";

			const infoEl = itemEl.createEl("div", { cls: "snapshot-info", });
			infoEl.style.fontSize = "12px";
			infoEl.style.color = "#666";
			infoEl.textContent = `${snapshot.events.length} events`;

			itemEl.addEventListener("click", () => {
				this.currentSnapshotId = snapshot.id;
				this.onOpen(); // Re-render to show selection
			});
		});
	}

	private renderTimelineDisplay(container: HTMLElement): void {
		// Make sure we have a current snapshot ID
		if (!this.currentSnapshotId) {
			if (this.snapshots.length === 0) {
				return; // No snapshots
			}
			const firstSnapshot = this.snapshots[0];
			if (firstSnapshot) {
				this.currentSnapshotId = firstSnapshot.id;
			} else {
				return;
			}
		}

		// Get the snapshot
		const snapshotId = this.currentSnapshotId;
		const snapshot = this.snapshots.find((s) => s.id === snapshotId);
		if (!snapshot) {
			container.createEl("p", { text: "Snapshot not found", cls: "error-message" });
			return;
		}

		// Snapshot header
		const headerEl = container.createDiv({ cls: "snapshot-header" });
		headerEl.style.marginBottom = "20px";

		const titleEl = headerEl.createEl("h4", { text: snapshot.name, cls: "snapshot-display-title" });
		titleEl.style.margin = "0 0 8px 0";

		const metaEl = headerEl.createEl("div", { cls: "snapshot-meta" });
		metaEl.style.fontSize = "13px";
		metaEl.style.color = "#666";
		metaEl.textContent = `Source: ${snapshot.sourceDocument} • ${snapshot.events.length} events • Created: ${new Date(snapshot.createdAt).toLocaleDateString()}`;

		// Render timeline
		const timelineEl = container.createDiv({ cls: "timeline-render" });
		this.renderer = new TimelineRenderer(timelineEl, snapshot.events, {
			orientation: "vertical",
			showSources: true,
			highlightColor: snapshot.color,
		});
		this.renderer.render();
	}

	/**
	 * Add a new snapshot to the timeline
	 */
	addSnapshot(snapshot: TimelineSnapshot): void {
		this.snapshots.push(snapshot);
		this.currentSnapshotId = snapshot.id;
		this.onOpen(); // Re-render
		new Notice(`✅ Snapshot "${snapshot.name}" added`);
	}

	/**
	 * Remove a snapshot by ID
	 */
	removeSnapshot(id: string): void {
		const index = this.snapshots.findIndex((s) => s.id === id);
		if (index !== -1) {
			const currentSnapshot = this.snapshots[index];
			if (currentSnapshot) {
				const name = currentSnapshot.name;
				this.snapshots.splice(index, 1);
				if (this.currentSnapshotId === id) {
					this.currentSnapshotId = this.snapshots.length > 0 ? this.snapshots[0]?.id ?? null : null;
				}
				this.onOpen(); // Re-render
				new Notice(`✅ Snapshot "${name}" removed`);
			}
		}
	}

	/**
	 * Get all snapshots
	 */
	getSnapshots(): TimelineSnapshot[] {
		return [...this.snapshots];
	}

	/**
	 * Set all snapshots (for loading from file)
	 */
	setSnapshots(snapshots: TimelineSnapshot[]): void {
		this.snapshots = snapshots;
		this.currentSnapshotId = snapshots.length > 0 ? snapshots[0]?.id ?? null : null;
	}

	async onClose(): Promise<void> {
		// Cleanup
	}
}
