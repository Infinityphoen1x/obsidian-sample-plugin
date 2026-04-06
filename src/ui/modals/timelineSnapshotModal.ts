/**
 * Timeline Snapshot Modal
 *
 * Modal for editing timeline events and reordering
 * Allows users to reorder, delete, or add custom events
 */

import { App, Modal, Notice, Setting } from "obsidian";
import { TimelineEvent } from "../../types";
import { EventReorderer } from "../components/eventReorderer";

export interface TimelineSnapshotResult {
	cancelled: boolean;
	events?: TimelineEvent[];
	snapshotName?: string;
}

export class TimelineSnapshotModal extends Modal {
	private events: TimelineEvent[];
	private reorderer: EventReorderer;
	private snapshotName: string = "Untitled Snapshot";
	private onSubmit: (result: TimelineSnapshotResult) => void;
	private onCancel: () => void;

	constructor(
		app: App,
		events: TimelineEvent[],
		onSubmit: (result: TimelineSnapshotResult) => void,
		onCancel: () => void
	) {
		super(app);
		this.events = events;
		this.reorderer = new EventReorderer(events);
		this.onSubmit = onSubmit;
		this.onCancel = onCancel;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		// Title
		contentEl.createEl("h2", { text: "Timeline Events" });

		// Snapshot name input
		new Setting(contentEl)
			.setName("Snapshot name")
			.setDesc("Name for this timeline snapshot")
			.addText((text) =>
				text
					.setPlaceholder("Untitled Snapshot")
					.setValue(this.snapshotName)
					.onChange((value) => {
						this.snapshotName = value || "Untitled Snapshot";
					})
			);

		// Event counter
		contentEl.createEl("p", { text: `Total events: ${this.reorderer.getCount()}` });

		// Events list
		const eventListContainer = contentEl.createDiv({ cls: "timeline-events-list" });
		this.renderEventsList(eventListContainer);

		// Action buttons
		const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

		buttonContainer.createEl("button", { text: "Apply" }).addEventListener("click", () => {
			this.onSubmit({
				cancelled: false,
				events: this.reorderer.getEvents(),
				snapshotName: this.snapshotName,
			});
			this.close();
		});

		buttonContainer.createEl("button", { text: "Cancel" }).addEventListener("click", () => {
			this.onCancel();
			this.close();
		});
	}

	private renderEventsList(container: HTMLElement): void {
		container.empty();

		const events = this.reorderer.getEvents();

		if (events.length === 0) {
			container.createEl("p", { text: "No events to display", cls: "empty-state" });
			return;
		}

		events.forEach((event, index) => {
			this.renderEventRow(container, event, index);
		});
	}

	private renderEventRow(container: HTMLElement, event: TimelineEvent, index: number): void {
		const eventRow = container.createDiv({ cls: "timeline-event-row" });

		// Event index
		const indexEl = eventRow.createDiv({ cls: "event-index", text: `${index + 1}` });

		// Event text (sentence)
		const textEl = eventRow.createDiv({ cls: "event-text", text: event.sentence });
		textEl.title = event.sentence;

		// Event controls
		const controlsEl = eventRow.createDiv({ cls: "event-controls" });

		// Up button
		if (index > 0) {
			const upBtn = controlsEl.createEl("button", { text: "↑", cls: "arrow-btn" });
			upBtn.addEventListener("click", () => {
				if (this.reorderer.moveUp(index)) {
					this.renderEventsList(container.parentElement!);
					new Notice(`✅ Moved "${event.text}" up`);
				}
			});
		} else {
			const upDisabled = controlsEl.createEl("button", { text: "↑", cls: "arrow-btn disabled" });
			upDisabled.disabled = true;
		}

		// Down button
		if (index < this.reorderer.getCount() - 1) {
			const downBtn = controlsEl.createEl("button", { text: "↓", cls: "arrow-btn" });
			downBtn.addEventListener("click", () => {
				if (this.reorderer.moveDown(index)) {
					this.renderEventsList(container.parentElement!);
					new Notice(`✅ Moved "${event.text}" down`);
				}
			});
		} else {
			const downDisabled = controlsEl.createEl("button", { text: "↓", cls: "arrow-btn disabled" });
			downDisabled.disabled = true;
		}

		// Position input
		const positionInput = controlsEl.createEl("input", { cls: "position-input" });
		positionInput.type = "number";
		positionInput.min = "1";
		positionInput.max = String(this.reorderer.getCount());
		positionInput.value = String(index + 1);
		positionInput.title = "Go to position";
		positionInput.addEventListener("change", () => {
			const newPos = parseInt(positionInput.value, 10) - 1;
			if (!isNaN(newPos) && newPos >= 0 && newPos < this.reorderer.getCount()) {
				if (this.reorderer.moveToPosition(index, newPos)) {
					this.renderEventsList(container.parentElement!);
					new Notice(`✅ Moved to position ${newPos + 1}`);
				}
			} else {
				positionInput.value = String(index + 1);
			}
		});

		// Delete button
		const deleteBtn = controlsEl.createEl("button", { text: "✕", cls: "delete-btn" });
		deleteBtn.addEventListener("click", () => {
			if (this.reorderer.deleteEvent(index)) {
				this.renderEventsList(container.parentElement!);
				new Notice(`✅ Deleted event`);
			}
		});
	}

	onClose(): void {
		// Cleanup handled by Obsidian
	}
}
