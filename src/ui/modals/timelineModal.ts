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

	/**
	 * Group events by concurrent timestamp
	 * Returns array of event groups where concurrent events are grouped together
	 */
	private groupConcurrentEvents(): TimelineEvent[][] {
		if (this.events.length === 0) return [];

		const groups: TimelineEvent[][] = [];
		let currentGroup: TimelineEvent[] = [];
		let lastTimestamp: number | undefined;

		for (const event of this.events) {
			const timestamp = event.timestamp ?? event.order;

			// If timestamp matches last, add to current group
			if (lastTimestamp === timestamp && currentGroup.length > 0) {
				currentGroup.push(event);
			} else {
				// New timestamp, save current group and start new one
				if (currentGroup.length > 0) {
					groups.push(currentGroup);
				}
				currentGroup = [event];
				lastTimestamp = timestamp;
			}
		}

		// Add final group
		if (currentGroup.length > 0) {
			groups.push(currentGroup);
		}

		return groups;
	}

	/**
	 * Render events with drag-and-drop support and concurrent grouping
	 */
	private renderEvents(container: HTMLElement): void {
		const eventGroups = this.groupConcurrentEvents();
		let globalIndex = 0;

		eventGroups.forEach((group) => {
			const isConcurrent = group.length > 1;

			if (isConcurrent) {
				// Create group container for concurrent events
				const groupEl = container.createEl('div', {
					cls: 'concurrent-event-group',
				});

				// Group header showing how many events are concurrent
				const groupHeader = groupEl.createEl('div', {
					cls: 'concurrent-group-header',
					text: `⚡ ${group.length} concurrent events`,
				});

				// Render events in nested container
				const eventsNested = groupEl.createEl('div', {
					cls: 'concurrent-events-nested',
				});

				group.forEach((event) => {
					if (event) {
						this.renderEventElement(eventsNested, event, globalIndex++, true);
					}
				});
			} else if (group.length > 0) {
				// Single event (not concurrent)
				const event = group[0];
				if (event) {
					this.renderEventElement(container, event, globalIndex++, false);
				}
			}
		});
	}

	/**
	 * Render individual event element with drag support
	 */
	private renderEventElement(
		container: HTMLElement,
		event: TimelineEvent,
		index: number,
		isNested: boolean
	): void {
		const eventEl = container.createEl('div', {
			cls: isNested ? 'timeline-event nested' : 'timeline-event',
		});

		// Make draggable
		eventEl.setAttribute('draggable', 'true');
		eventEl.setAttribute('data-event-id', event.id);
		eventEl.setAttribute('data-event-index', String(index));

		// Drag event listeners
		eventEl.addEventListener('dragstart', (e: DragEvent) => {
			this.draggedEventId = event.id;
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', event.id);
			}
			eventEl.classList.add('dragging');
		});

		eventEl.addEventListener('dragend', () => {
			eventEl.classList.remove('dragging');
			this.draggedEventId = null;
		});

		eventEl.addEventListener('dragover', (e: DragEvent) => {
			e.preventDefault();
			if (e.dataTransfer) {
				e.dataTransfer.dropEffect = 'move';
			}
			eventEl.classList.add('drag-over');
		});

		eventEl.addEventListener('dragleave', () => {
			eventEl.classList.remove('drag-over');
		});

		eventEl.addEventListener('drop', (e: DragEvent) => {
			e.preventDefault();
			eventEl.classList.remove('drag-over');

			if (this.draggedEventId && this.draggedEventId !== event.id) {
				const draggedIndex = this.events.findIndex((e) => e.id === this.draggedEventId);
				const targetIndex = this.events.findIndex((e) => e.id === event.id);

				if (draggedIndex >= 0 && targetIndex >= 0) {
					this.moveEvent(this.draggedEventId, targetIndex);
					// Re-render
					const timelineSection = document.querySelector('.timeline-section');
					if (timelineSection) {
						const eventsContainer = timelineSection.querySelector('.events-container');
						if (eventsContainer) {
							eventsContainer.empty?.();
							this.renderEvents(eventsContainer as HTMLElement);
						}
					}
				}
			}
		});

		// Event number
		eventEl.createEl('span', {
			text: `${index + 1}. `,
			cls: 'event-number',
		});

		// Drag handle
		eventEl.createEl('span', {
			text: '⋮',
			cls: 'drag-handle',
		});

		// Event text
		eventEl.createEl('span', {
			text: event.text || event.sentence,
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

		// Color indicator if set
		if (event.color) {
			const colorIndicator = eventEl.createEl('span', {
				cls: 'color-indicator',
			});
			colorIndicator.style.backgroundColor = event.color;
		}

		// Delete button
		const deleteBtn = eventEl.createEl('button', {
			text: '✕',
			cls: 'delete-btn',
		});
		deleteBtn.addEventListener('click', () => {
			this.removeEvent(event.id);
			// Re-render
			const timelineSection = document.querySelector('.timeline-section');
			if (timelineSection) {
				const eventsContainer = timelineSection.querySelector('.events-container');
				if (eventsContainer) {
					eventsContainer.empty?.();
					this.renderEvents(eventsContainer as HTMLElement);
				}
			}
		});

		// Move buttons (fallback for touch/accessibility)
		const eventIndex = this.events.findIndex((e) => e.id === event.id);
		if (eventIndex > 0) {
			const upBtn = eventEl.createEl('button', {
				text: '↑',
				cls: 'move-btn',
			});
			upBtn.addEventListener('click', () => {
				this.moveEvent(event.id, eventIndex - 1);
				// Re-render
				const timelineSection = document.querySelector('.timeline-section');
				if (timelineSection) {
					const eventsContainer = timelineSection.querySelector('.events-container');
					if (eventsContainer) {
						eventsContainer.empty?.();
						this.renderEvents(eventsContainer as HTMLElement);
					}
				}
			});
		}

		if (eventIndex < this.events.length - 1) {
			const downBtn = eventEl.createEl('button', {
				text: '↓',
				cls: 'move-btn',
			});
			downBtn.addEventListener('click', () => {
				this.moveEvent(event.id, eventIndex + 1);
				// Re-render
				const timelineSection = document.querySelector('.timeline-section');
				if (timelineSection) {
					const eventsContainer = timelineSection.querySelector('.events-container');
					if (eventsContainer) {
						eventsContainer.empty?.();
						this.renderEvents(eventsContainer as HTMLElement);
					}
				}
			});
		}
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

		// Events timeline section
		const timelineEl = contentEl.createEl('div', { cls: 'timeline-section' });
		timelineEl.createEl('h3', { text: 'Events (Drag to reorder)' });

		// Events container
		const eventsContainer = timelineEl.createEl('div', { cls: 'events-container' });

		// Render events with drag support
		this.renderEvents(eventsContainer);

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
			btn.setButtonText('Add Event').onClick(async () => {
				const text = (customEl as any)._eventText || '';
				if (text.trim()) {
					this.addCustomEvent(text);
					(customEl as any)._eventText = '';
					// Re-render to show new event
					timelineEl.empty();
					this.renderEvents(timelineEl);
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
