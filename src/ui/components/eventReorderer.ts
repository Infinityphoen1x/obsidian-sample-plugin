/**
 * Event Reorderer Component
 *
 * Mobile-friendly event reordering (arrows + numbers)
 * Used by TimelineSnapshotModal for managing event order
 */

import { TimelineEvent } from "../../types";

/**
 * Manages event ordering with arrow and number-input methods
 */
export class EventReorderer {
	private events: TimelineEvent[];

	constructor(events: TimelineEvent[]) {
		this.events = [...events]; // Create a copy to avoid mutating original
	}

	/**
	 * Get current event list
	 */
	getEvents(): TimelineEvent[] {
		return [...this.events];
	}

	/**
	 * Move event up by one position (↑ button)
	 * @param index Current index of event
	 * @returns true if moved, false if already at top
	 */
	moveUp(index: number): boolean {
		if (index <= 0 || index >= this.events.length) {
			return false;
		}
		// Swap with previous event using temporary variable
		const temp = this.events[index - 1] as TimelineEvent;
		this.events[index - 1] = this.events[index] as TimelineEvent;
		this.events[index] = temp;
		return true;
	}

	/**
	 * Move event down by one position (↓ button)
	 * @param index Current index of event
	 * @returns true if moved, false if already at bottom
	 */
	moveDown(index: number): boolean {
		if (index < 0 || index >= this.events.length - 1) {
			return false;
		}
		// Swap with next event using temporary variable
		const temp = this.events[index] as TimelineEvent;
		this.events[index] = this.events[index + 1] as TimelineEvent;
		this.events[index + 1] = temp;
		return true;
	}

	/**
	 * Move event to specific position
	 * @param currentIndex Current index of event
	 * @param newPosition Target position (0-indexed)
	 * @returns true if moved, false if invalid indices
	 */
	moveToPosition(currentIndex: number, newPosition: number): boolean {
		// Validate indices
		if (currentIndex < 0 || currentIndex >= this.events.length ||
			newPosition < 0 || newPosition >= this.events.length) {
			return false;
		}

		if (currentIndex === newPosition) {
			return true; // Already at position
		}

		// Remove event from current position
		const removed = this.events.splice(currentIndex, 1);
		const event = removed[0] as TimelineEvent;

		// Insert at new position
		this.events.splice(newPosition, 0, event);

		return true;
	}

	/**
	 * Swap two events by index
	 * @param index1 First event index
	 * @param index2 Second event index
	 * @returns true if swapped, false if invalid indices
	 */
	swapEvents(index1: number, index2: number): boolean {
		if (index1 < 0 || index1 >= this.events.length ||
			index2 < 0 || index2 >= this.events.length) {
			return false;
		}

		const temp = this.events[index1] as TimelineEvent;
		this.events[index1] = this.events[index2] as TimelineEvent;
		this.events[index2] = temp;
		return true;
	}

	/**
	 * Delete event by index
	 * @param index Index of event to delete
	 * @returns true if deleted, false if invalid index
	 */
	deleteEvent(index: number): boolean {
		if (index < 0 || index >= this.events.length) {
			return false;
		}

		this.events.splice(index, 1);
		return true;
	}

	/**
	 * Reset to original order (if needed)
	 */
	reset(originalEvents: TimelineEvent[]): void {
		this.events = [...originalEvents];
	}

	/**
	 * Get event at specific index
	 */
	getEventAt(index: number): TimelineEvent | undefined {
		if (index < 0 || index >= this.events.length) {
			return undefined;
		}
		return this.events[index];
	}

	/**
	 * Get total event count
	 */
	getCount(): number {
		return this.events.length;
	}
}
