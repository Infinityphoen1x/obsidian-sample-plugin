/**
 * Timeline View - Main panel UI
 *
 * Custom view for displaying and managing the master timeline.
 * Allows users to see, organize, and manage timeline snapshots.
 */

import { ItemView, WorkspaceLeaf, Notice, Plugin } from "obsidian";
import { TimelineEvent } from "../../types";
import { TimelineRenderer } from "../components/timelineRenderer";
import { EventDetailPanel } from "../components/eventDetailPanel";
import { EventReorderer } from "../components/eventReorderer";

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
	private detailPanel: EventDetailPanel | null = null;
	private eventReorderer: EventReorderer | null = null;
	private plugin?: Plugin;
	private selectedEventId: string | null = null;
	private filterText: string = "";
	private filterDocument: string = "all";
	private filterStatus: "all" | "draft" | "confirmed" = "all";

	constructor(leaf: WorkspaceLeaf, plugin?: Plugin) {
		super(leaf);
		this.plugin = plugin;
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

		// Create main flex container for timeline + detail panel
		const mainEl = container.createDiv({ cls: "timeline-display-main" });
		mainEl.style.display = "flex";
		mainEl.style.gap = "12px";
		mainEl.style.height = "100%";

		// LEFT SIDE: Timeline diagram + event controls
		const timelineAreaEl = mainEl.createDiv({ cls: "timeline-area" });
		timelineAreaEl.style.flex = "1";
		timelineAreaEl.style.display = "flex";
		timelineAreaEl.style.flexDirection = "column";
		timelineAreaEl.style.gap = "8px";
		timelineAreaEl.style.minHeight = "0";

		// Snapshot header
		const headerEl = timelineAreaEl.createDiv({ cls: "snapshot-header" });
		headerEl.style.marginBottom = "8px";

		const titleEl = headerEl.createEl("h4", { text: snapshot.name, cls: "snapshot-display-title" });
		titleEl.style.margin = "0 0 4px 0";
		titleEl.style.fontSize = "14px";
		titleEl.style.fontWeight = "600";

		const metaEl = headerEl.createEl("div", { cls: "snapshot-meta" });
		metaEl.style.fontSize = "12px";
		metaEl.style.color = "var(--text-muted)";
		metaEl.textContent = `${snapshot.events.length} events • Created: ${new Date(snapshot.createdAt).toLocaleDateString()}`;

		// Render Mermaid diagram
		const diagramEl = timelineAreaEl.createDiv({ cls: "timeline-mermaid-diagram" });
		diagramEl.style.flex = "1";
		diagramEl.style.overflowY = "auto";
		diagramEl.style.border = "1px solid var(--background-modifier-border)";
		diagramEl.style.borderRadius = "4px";
		diagramEl.style.padding = "12px";
		diagramEl.style.backgroundColor = "var(--background-secondary)";

		this.renderer = new TimelineRenderer(diagramEl, snapshot.events, {
			orientation: "vertical",
			showSources: true,
			highlightColor: snapshot.color,
			useMermaid: true,
		});
		this.renderer.render();

		// Event list with filtering and drag-drop
		this.renderEventListSection(timelineAreaEl, snapshot);

		// RIGHT SIDE: Detail panel
		const detailAreaEl = mainEl.createDiv({ cls: "timeline-detail-area" });
		detailAreaEl.style.width = "320px";
		detailAreaEl.style.borderLeft = "1px solid var(--background-modifier-border)";
		detailAreaEl.style.paddingLeft = "12px";
		detailAreaEl.style.overflowY = "auto";
		detailAreaEl.style.display = "flex";
		detailAreaEl.style.flexDirection = "column";
		detailAreaEl.style.minHeight = "0";

		// Create detail panel
		this.detailPanel = new EventDetailPanel(detailAreaEl, {
			editable: true,
			onSave: (event: TimelineEvent) => this.handleEventSave(event, snapshot),
			onDelete: (eventId: string) => this.handleEventDelete(eventId, snapshot),
			onColorChange: (eventId: string, color: string) => this.handleEventColorChange(eventId, color, snapshot),
		});

		if (this.selectedEventId) {
			const selectedEvent = snapshot.events.find((e) => e.id === this.selectedEventId);
			if (selectedEvent) {
				this.detailPanel.displayEvent(selectedEvent);
			} else {
				this.detailPanel.clear();
			}
		} else {
			this.detailPanel.clear();
		}
	}

	/**
	 * Render event list section with filtering and controls
	 */
	private renderEventListSection(container: HTMLElement, snapshot: TimelineSnapshot): void {
		const sectionEl = container.createDiv({ cls: "event-list-section" });
		sectionEl.style.display = "flex";
		sectionEl.style.flexDirection = "column";
		sectionEl.style.gap = "8px";
		sectionEl.style.flex = "1";
		sectionEl.style.minHeight = "0";

		// Filter controls
		this.renderFilterControls(sectionEl, snapshot);

		// Event list with drag-drop
		const listEl = sectionEl.createDiv({ cls: "event-list-container" });
		listEl.style.flex = "1";
		listEl.style.overflowY = "auto";
		listEl.style.border = "1px solid var(--background-modifier-border)";
		listEl.style.borderRadius = "4px";
		listEl.style.backgroundColor = "var(--background-secondary)";

		const filteredEvents = this.getFilteredEvents(snapshot.events);

		if (filteredEvents.length === 0) {
			listEl.createEl("p", {
				text: "No events match the current filters",
				cls: "event-list-empty",
			}).style.padding = "12px";
		} else {
			this.eventReorderer = new EventReorderer(filteredEvents);
			filteredEvents.forEach((event, index) => {
				this.renderEventListItem(listEl, event, index, snapshot);
			});
		}
	}

	/**
	 * Render filter controls
	 */
	private renderFilterControls(container: HTMLElement, snapshot: TimelineSnapshot): void {
		const controlsEl = container.createDiv({ cls: "event-filter-controls" });
		controlsEl.style.display = "flex";
		controlsEl.style.gap = "8px";
		controlsEl.style.flexWrap = "wrap";
		controlsEl.style.padding = "8px";
		controlsEl.style.backgroundColor = "var(--background-secondary)";
		controlsEl.style.borderRadius = "4px";

		// Search input
		const searchInput = controlsEl.createEl("input", {
			type: "text",
			placeholder: "Search events...",
			cls: "event-filter-search",
		});
		searchInput.style.flex = "1";
		searchInput.style.minWidth = "120px";
		searchInput.style.padding = "6px 8px";
		searchInput.style.borderRadius = "3px";
		searchInput.style.border = "1px solid var(--background-modifier-border)";
		searchInput.value = this.filterText;

		searchInput.addEventListener("input", (e) => {
			this.filterText = (e.target as HTMLInputElement).value;
			this.onOpen(); // Re-render with new filter
		});

		// Document filter
		const docSelect = controlsEl.createEl("select", { cls: "event-filter-document" });
		docSelect.style.padding = "6px 8px";
		docSelect.style.borderRadius = "3px";
		docSelect.style.border = "1px solid var(--background-modifier-border)";
		docSelect.value = this.filterDocument;

		const allDocsOption = docSelect.createEl("option", { text: "All documents", value: "all" });
		allDocsOption.selected = this.filterDocument === "all";

		const uniqueDocs = new Set(snapshot.events.map((e) => e.sourceDocument || e.source.document));
		uniqueDocs.forEach((doc) => {
			const optEl = docSelect.createEl("option", { text: doc, value: doc });
			optEl.selected = this.filterDocument === doc;
		});

		docSelect.addEventListener("change", (e) => {
			this.filterDocument = (e.target as HTMLSelectElement).value;
			this.onOpen(); // Re-render
		});

		// Status filter
		const statusSelect = controlsEl.createEl("select", { cls: "event-filter-status" });
		statusSelect.style.padding = "6px 8px";
		statusSelect.style.borderRadius = "3px";
		statusSelect.style.border = "1px solid var(--background-modifier-border)";
		statusSelect.value = this.filterStatus;

		["all", "draft", "confirmed"].forEach((status) => {
			const optEl = statusSelect.createEl("option", {
				text: status === "all" ? "All statuses" : status.charAt(0).toUpperCase() + status.slice(1),
				value: status,
			});
			optEl.selected = this.filterStatus === status as "all" | "draft" | "confirmed";
		});

		statusSelect.addEventListener("change", (e) => {
			this.filterStatus = (e.target as HTMLSelectElement).value as "all" | "draft" | "confirmed";
			this.onOpen(); // Re-render
		});
	}

	/**
	 * Get filtered events based on current filters
	 */
	private getFilteredEvents(events: TimelineEvent[]): TimelineEvent[] {
		return events.filter((event) => {
			// Text filter
			if (this.filterText.length > 0) {
				const searchLower = this.filterText.toLowerCase();
				const matches =
					event.sentence.toLowerCase().includes(searchLower) ||
					event.id.toLowerCase().includes(searchLower) ||
					(event.sourceDocument || event.source.document).toLowerCase().includes(searchLower);
				if (!matches) return false;
			}

			// Document filter
			if (this.filterDocument !== "all") {
				const doc = event.sourceDocument || event.source.document;
				if (doc !== this.filterDocument) return false;
			}

			// Status filter
			if (this.filterStatus !== "all") {
				if (event.status !== this.filterStatus) return false;
			}

			return true;
		});
	}

	/**
	 * Render individual event list item with drag-drop
	 */
	private renderEventListItem(
		container: HTMLElement,
		event: TimelineEvent,
		index: number,
		snapshot: TimelineSnapshot
	): void {
		const itemEl = container.createDiv({ cls: "event-list-item" });
		itemEl.style.padding = "10px";
		itemEl.style.marginBottom = "6px";
		itemEl.style.borderRadius = "3px";
		itemEl.style.border = `2px solid ${event.color || "#457B9D"}`;
		itemEl.style.cursor = "grab";
		itemEl.style.backgroundColor = this.selectedEventId === event.id ? "var(--background-tertiary)" : "transparent";
		itemEl.style.transition = "all 0.2s ease";
		itemEl.draggable = true;

		// Content
		const contentEl = itemEl.createDiv({ cls: "event-item-content" });
		contentEl.style.display = "flex";
		contentEl.style.gap = "8px";
		contentEl.style.alignItems = "flex-start";

		// Drag handle
		const handleEl = contentEl.createDiv({ cls: "event-drag-handle", text: "⋮" });
		handleEl.style.color = "var(--text-muted)";
		handleEl.style.cursor = "grab";
		handleEl.style.userSelect = "none";

		// Event info
		const infoEl = contentEl.createDiv({ cls: "event-item-info" });
		infoEl.style.flex = "1";
		infoEl.style.minWidth = "0";

		const textEl = infoEl.createEl("div", { text: event.sentence.substring(0, 60) + (event.sentence.length > 60 ? "..." : ""), cls: "event-item-text" });
		textEl.style.fontSize = "12px";
		textEl.style.wordBreak = "break-word";

		const metaEl = infoEl.createEl("div", { cls: "event-item-meta" });
		metaEl.style.fontSize = "11px";
		metaEl.style.color = "var(--text-muted)";
		metaEl.textContent = `[${event.status}] Line ${event.source.line}`;

		// Click handler
		itemEl.addEventListener("click", () => {
			this.selectedEventId = event.id;
			this.onOpen(); // Re-render to update selection
		});

		// Drag handlers
		itemEl.addEventListener("dragstart", (e) => {
			(e.dataTransfer as DataTransfer).effectAllowed = "move";
			(e.dataTransfer as DataTransfer).setData("text/plain", event.id);
			itemEl.style.opacity = "0.5";
		});

		itemEl.addEventListener("dragend", () => {
			itemEl.style.opacity = "1";
		});

		itemEl.addEventListener("dragover", (e) => {
			e.preventDefault();
			(e.dataTransfer as DataTransfer).dropEffect = "move";
			itemEl.style.borderTop = "2px solid var(--text-accent)";
		});

		itemEl.addEventListener("dragleave", () => {
			itemEl.style.borderTop = "";
		});

		itemEl.addEventListener("drop", (e) => {
			e.preventDefault();
			itemEl.style.borderTop = "";
			const draggedId = (e.dataTransfer as DataTransfer).getData("text/plain");
			if (draggedId && draggedId !== event.id) {
				this.handleEventReorder(draggedId, event.id, snapshot);
			}
		});
	}

	/**
	 * Handle event reordering
	 */
	private handleEventReorder(draggedId: string, targetId: string, snapshot: TimelineSnapshot): void {
		const draggedIndex = snapshot.events.findIndex((e) => e.id === draggedId);
		const targetIndex = snapshot.events.findIndex((e) => e.id === targetId);

		if (draggedIndex !== -1 && targetIndex !== -1) {
			if (this.eventReorderer) {
				this.eventReorderer.moveToPosition(draggedIndex, targetIndex);
				// Update event order properties
				snapshot.events.forEach((event, idx) => {
					event.order = idx;
				});
				this.onOpen(); // Re-render
				new Notice(`📍 Event reordered`);
			}
		}
	}

	/**
	 * Handle event save
	 */
	private handleEventSave(event: TimelineEvent, snapshot: TimelineSnapshot): void {
		const index = snapshot.events.findIndex((e) => e.id === event.id);
		if (index !== -1) {
			snapshot.events[index] = event;
			this.onOpen(); // Re-render
			new Notice(`✅ Event updated`);
		}
	}

	/**
	 * Handle event deletion
	 */
	private handleEventDelete(eventId: string, snapshot: TimelineSnapshot): void {
		const index = snapshot.events.findIndex((e) => e.id === eventId);
		if (index !== -1) {
			snapshot.events.splice(index, 1);
			snapshot.events.forEach((event, idx) => {
				event.order = idx;
			});
			this.selectedEventId = null;
			this.onOpen(); // Re-render
			new Notice(`🗑️ Event deleted`);
		}
	}

	/**
	 * Handle event color change
	 */
	private handleEventColorChange(eventId: string, color: string, snapshot: TimelineSnapshot): void {
		const event = snapshot.events.find((e) => e.id === eventId);
		if (event) {
			event.color = color;
			this.onOpen(); // Re-render to show new color
		}
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
