/**
 * Timeline Modal
 *
 * Modal for visualizing and organizing temporal events from a document.
 * Allows users to create, reorder, and delete events for snapshot timeline creation.
 */

import { App, Modal, Setting } from 'obsidian';
import { TimelineEvent, SnapshotTimeline } from '../../types';

export interface TimelineModalResult {
	snapshot: SnapshotTimeline | null;
	cancelled: boolean;
}

export class TimelineModal extends Modal {
	events: TimelineEvent[] = [];
	snapshotName: string = '';
	sourceDocument: string;
	private onApply: (result: TimelineModalResult) => Promise<void>;
	private onCancel: () => void;
	private draggedEventId: string | null = null;

	constructor(
		app: App,
		events: TimelineEvent[],
		sourceDocument: string,
		onApply: (result: TimelineModalResult) => Promise<void> = async () => {},
		onCancel: () => void = () => {}
	) {
		super(app);
		this.events = [...events]; // Copy to avoid mutations
		this.sourceDocument = sourceDocument;
		this.onApply = onApply;
		this.onCancel = onCancel;
	}

	/**
	 * Add a custom event to the timeline
	 */
	addCustomEvent(text: string): void {
		const event: TimelineEvent = {
			id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
			sentence: text,
			text,
			source: {
				document: this.sourceDocument,
				line: 0,
			},
			sourceDocument: this.sourceDocument,
			temporalTerms: [],
			order: this.events.length,
			status: 'draft' as const,
			isCustom: true,
		};
		this.events.push(event);
	}

	/**
	 * Remove event by ID
	 */
	removeEvent(eventId: string): void {
		this.events = this.events.filter((e) => e.id !== eventId);
	}

	/**
	 * Reorder event (move to new index)
	 */
	moveEvent(eventId: string, newIndex: number): void {
		const currentIndex = this.events.findIndex((e) => e.id === eventId);
		if (currentIndex >= 0 && newIndex >= 0 && newIndex < this.events.length) {
			const [event] = this.events.splice(currentIndex, 1);
			this.events.splice(newIndex, 0, event!);
		}
	}

	/**
	 * Set snapshot timeline name
	 */
	setSnapshotName(name: string): void {
		this.snapshotName = name;
	}

	/**
	 * Get snapshot timeline name
	 */
	getSnapshotName(): string {
		return this.snapshotName;
	}

	/**
	 * Check if snapshot is valid (has name and events)
	 */
	isSnapshotValid(): boolean {
		return this.snapshotName.trim().length > 0 && this.events.length > 0;
	}

	/**
	 * Build snapshot timeline object
	 */
	buildSnapshot(): SnapshotTimeline {
		return {
			id: `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
			name: this.snapshotName,
			events: this.events,
			createdAt: Date.now(),
			documentSource: this.sourceDocument,
		};
	}

	/**
	 * Apply changes and create snapshot
	 */
	applyChanges(): TimelineModalResult {
		if (!this.isSnapshotValid()) {
			return {
				snapshot: null,
				cancelled: false,
			};
		}

		return {
			snapshot: this.buildSnapshot(),
			cancelled: false,
		};
	}

	/**
	 * Cancel and discard changes
	 */
	cancelChanges(): void {
		this.events = [];
		this.snapshotName = '';
		this.onCancel();
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Timeline Snapshot' });

		// Document info
		const infoEl = contentEl.createEl('div', { cls: 'info-section' });
		infoEl.createEl('p', { text: `Source: ${this.sourceDocument}` });
		infoEl.createEl('p', {
			text: `Events: ${this.events.length}`,
		});

		// Snapshot name input
		const nameEl = contentEl.createEl('div', { cls: 'name-section' });
		new Setting(nameEl)
			.setName('Snapshot Name')
			.addText((text) => {
				text.setValue(this.snapshotName);
				text.onChange((value) => {
					this.setSnapshotName(value);
				});
			});

		// Events timeline
		const timelineEl = contentEl.createEl('div', { cls: 'timeline-section' });
		timelineEl.createEl('h3', { text: 'Events' });

		this.events.forEach((event, index) => {
			const eventEl = timelineEl.createEl('div', {
				cls: 'timeline-event',
			});

			// Event number
			eventEl.createEl('span', {
				text: `${index + 1}. `,
				cls: 'event-number',
			});

			// Event text
			const textEl = eventEl.createEl('span', {
				text: event.text,
				cls: 'event-text',
			});

			// Custom marker
			if (event.isCustom) {
				eventEl.createEl('span', {
					text: '(custom)',
					cls: 'custom-marker',
				});
			}

			// Temporal terms
			if (event.temporalTerms.length > 0) {
				eventEl.createEl('span', {
					text: `[${event.temporalTerms.join(', ')}]`,
					cls: 'temporal-terms',
				});
			}

			// Delete button
			const deleteBtn = eventEl.createEl('button', {
				text: '✕',
				cls: 'delete-btn',
			});
			deleteBtn.addEventListener('click', () => {
				this.removeEvent(event.id);
			});

			// Move buttons
			if (index > 0) {
				const upBtn = eventEl.createEl('button', {
					text: '↑',
					cls: 'move-btn',
				});
				upBtn.addEventListener('click', () => {
					this.moveEvent(event.id, index - 1);
				});
			}

			if (index < this.events.length - 1) {
				const downBtn = eventEl.createEl('button', {
					text: '↓',
					cls: 'move-btn',
				});
				downBtn.addEventListener('click', () => {
					this.moveEvent(event.id, index + 1);
				});
			}
		});

		// Add custom event section
		const customEl = contentEl.createEl('div', { cls: 'custom-event-section' });
		customEl.createEl('h3', { text: 'Add Custom Event' });
		new Setting(customEl).addText((text) => {
			text.setPlaceholder('Enter event text');
			text.onChange((value) => {
				// Store for button click
				(customEl as any)._eventText = value;
			});
		});

		new Setting(customEl).addButton((btn) =>
			btn.setButtonText('Add Event').onClick(() => {
				const text = (customEl as any)._eventText || '';
				if (text.trim()) {
					this.addCustomEvent(text);
					(customEl as any)._eventText = '';
				}
			})
		);

		// Action buttons
		const actionsEl = contentEl.createEl('div', { cls: 'actions' });
		new Setting(actionsEl)
			.addButton((btn) =>
				btn
					.setButtonText('Create Snapshot')
					.setCta()
					.onClick(async () => {
						if (!this.isSnapshotValid()) {
							alert(
								'Please enter a snapshot name and add at least one event'
							);
							return;
						}
						await this.onApply(this.applyChanges());
						this.close();
					})
			)
			.addButton((btn) =>
				btn.setButtonText('Cancel').onClick(() => {
					this.cancelChanges();
					this.close();
				})
			);
	}

	onClose(): void {
		// Cleanup
	}
}
