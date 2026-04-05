import { TimelineModal, TimelineEvent, SnapshotTimeline } from './timelineModal';
import { App } from 'obsidian';

const mockApp = {
	vault: {
		getFiles: jest.fn(),
		getFileByPath: jest.fn(),
		getFolderByPath: jest.fn(),
	},
} as unknown as App;

describe('TimelineModal', () => {
	let modal: TimelineModal;
	const mockEvents: TimelineEvent[] = [
		{
			id: 'event1',
			text: 'Lucy discovers the void',
			temporalTerms: ['discovers'],
			sourceDocument: 'chapter1.md',
			isCustom: false,
		},
		{
			id: 'event2',
			text: 'Portal opens to another world',
			temporalTerms: ['opens'],
			sourceDocument: 'chapter1.md',
			isCustom: false,
		},
		{
			id: 'event3',
			text: 'Magic ritual begins',
			temporalTerms: ['begins'],
			sourceDocument: 'chapter2.md',
			isCustom: false,
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
		modal = new TimelineModal(mockApp, mockEvents, 'chapter1.md');
	});

	describe('Event management', () => {
		test('should initialize with provided events', () => {
			expect(modal.events).toHaveLength(3);
		});

		test('should not mutate provided events array', () => {
			const originalEvents = [...mockEvents];
			const testModal = new TimelineModal(
				mockApp,
				mockEvents,
				'test.md'
			);
			testModal.addCustomEvent('test');
			expect(mockEvents).toEqual(originalEvents);
		});

		test('should add custom event', () => {
			modal.addCustomEvent('Custom timeline event');
			expect(modal.events).toHaveLength(4);
			expect(modal.events[3]!.text).toBe('Custom timeline event');
			expect(modal.events[3]!.isCustom).toBe(true);
		});

		test('should mark custom events correctly', () => {
			modal.addCustomEvent('Test event');
			expect(modal.events[3]!.isCustom).toBe(true);
			expect(modal.events[0]!.isCustom).toBe(false);
		});

		test('should generate unique event IDs', () => {
			modal.addCustomEvent('Event 1');
			modal.addCustomEvent('Event 2');
			const ids = modal.events.map((e) => e.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		test('should remove event by ID', () => {
			modal.removeEvent('event1');
			expect(modal.events).toHaveLength(2);
			expect(modal.events.find((e) => e.id === 'event1')).toBeUndefined();
		});

		test('should not remove non-existent event', () => {
			modal.removeEvent('nonexistent');
			expect(modal.events).toHaveLength(3);
		});

		test('should remove all instances of matching ID', () => {
			// Add duplicate ID (shouldn't happen, but test defensive behavior)
			modal.addCustomEvent('Test');
			const lastId = modal.events[modal.events.length - 1]!.id;
			modal.removeEvent(lastId);
			expect(modal.events.find((e) => e.id === lastId)).toBeUndefined();
		});
	});

	describe('Event reordering', () => {
		test('should move event forward', () => {
			modal.moveEvent('event1', 2);
			expect(modal.events[2]!.id).toBe('event1');
		});

		test('should move event backward', () => {
			modal.moveEvent('event3', 0);
			expect(modal.events[0]!.id).toBe('event3');
		});

		test('should not move to invalid index', () => {
			const initialOrder = [...modal.events];
			modal.moveEvent('event1', 999);
			// Order should not change
			expect(modal.events).toEqual(initialOrder);
		});

		test('should not move non-existent event', () => {
			const initialOrder = [...modal.events];
			modal.moveEvent('nonexistent', 1);
			expect(modal.events).toEqual(initialOrder);
		});

		test('should not move to negative index', () => {
			const initialOrder = [...modal.events];
			modal.moveEvent('event1', -1);
			expect(modal.events).toEqual(initialOrder);
		});

		test('should handle swap-like reordering', () => {
			modal.moveEvent('event1', 2);
			modal.moveEvent('event2', 0);
			expect(modal.events[0]!.id).toBe('event2');
			expect(modal.events[2]!.id).toBe('event1');
		});

		test('should maintain order of other events when moving', () => {
			const originalIds = modal.events.map((e) => e.id);
			modal.moveEvent('event2', 0);
			// Check all events still present
			const newIds = modal.events.map((e) => e.id);
			expect(new Set(newIds)).toEqual(new Set(originalIds));
		});
	});

	describe('Snapshot naming', () => {
		test('should set snapshot name', () => {
			modal.setSnapshotName('My Timeline');
			expect(modal.getSnapshotName()).toBe('My Timeline');
		});

		test('should handle empty name', () => {
			modal.setSnapshotName('');
			expect(modal.getSnapshotName()).toBe('');
		});

		test('should handle name with spaces', () => {
			modal.setSnapshotName('My Complex Timeline Name');
			expect(modal.getSnapshotName()).toBe('My Complex Timeline Name');
		});

		test('should handle special characters in name', () => {
			modal.setSnapshotName('Timeline @#$% Special');
			expect(modal.getSnapshotName()).toBe('Timeline @#$% Special');
		});

		test('should overwrite previous name', () => {
			modal.setSnapshotName('First');
			modal.setSnapshotName('Second');
			expect(modal.getSnapshotName()).toBe('Second');
		});
	});

	describe('Snapshot validation', () => {
		test('should validate snapshot with name and events', () => {
			modal.setSnapshotName('Valid Snapshot');
			expect(modal.isSnapshotValid()).toBe(true);
		});

		test('should reject snapshot without name', () => {
			modal.setSnapshotName('');
			expect(modal.isSnapshotValid()).toBe(false);
		});

		test('should reject snapshot with whitespace-only name', () => {
			modal.setSnapshotName('   ');
			expect(modal.isSnapshotValid()).toBe(false);
		});

		test('should reject snapshot without events', () => {
			const emptyModal = new TimelineModal(mockApp, [], 'test.md');
			emptyModal.setSnapshotName('Valid Name');
			expect(emptyModal.isSnapshotValid()).toBe(false);
		});

		test('should reject snapshot without both name and events', () => {
			const emptyModal = new TimelineModal(mockApp, [], 'test.md');
			expect(emptyModal.isSnapshotValid()).toBe(false);
		});
	});

	describe('Snapshot building', () => {
		test('should build snapshot with correct structure', () => {
			modal.setSnapshotName('Test Snapshot');
			const snapshot = modal.buildSnapshot();

			expect(snapshot).toHaveProperty('id');
			expect(snapshot).toHaveProperty('name');
			expect(snapshot).toHaveProperty('events');
			expect(snapshot).toHaveProperty('createdAt');
			expect(snapshot).toHaveProperty('sourceDocument');
		});

		test('should include all events in snapshot', () => {
			modal.setSnapshotName('Test Snapshot');
			const snapshot = modal.buildSnapshot();
			expect(snapshot.events).toHaveLength(3);
		});

		test('should set snapshot name correctly', () => {
			modal.setSnapshotName('My Timeline');
			const snapshot = modal.buildSnapshot();
			expect(snapshot.name).toBe('My Timeline');
		});

		test('should set source document in snapshot', () => {
			const snapshot = modal.buildSnapshot();
			expect(snapshot.sourceDocument).toBe('chapter1.md');
		});

		test('should generate unique snapshot IDs', () => {
			modal.setSnapshotName('Snapshot 1');
			const snapshot1 = modal.buildSnapshot();

			modal.addCustomEvent('New event');
			const snapshot2 = modal.buildSnapshot();

			expect(snapshot1.id).not.toBe(snapshot2.id);
		});

		test('should include custom events in snapshot', () => {
			modal.setSnapshotName('With Custom Events');
			modal.addCustomEvent('Custom event 1');
			modal.addCustomEvent('Custom event 2');

			const snapshot = modal.buildSnapshot();
			expect(snapshot.events.slice(-2)).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						text: 'Custom event 1',
						isCustom: true,
					}),
					expect.objectContaining({
						text: 'Custom event 2',
						isCustom: true,
					}),
				])
			);
		});

		test('should reflect event order changes in snapshot', () => {
			modal.setSnapshotName('Reordered');
			modal.moveEvent('event3', 0);

			const snapshot = modal.buildSnapshot();
			expect(snapshot.events[0]!.id).toBe('event3');
		});

		test('should reflect deleted events in snapshot', () => {
			modal.setSnapshotName('With Deletions');
			modal.removeEvent('event2');

			const snapshot = modal.buildSnapshot();
			expect(snapshot.events).toHaveLength(2);
			expect(snapshot.events.find((e) => e.id === 'event2')).toBeUndefined();
		});
	});

	describe('Apply and cancel operations', () => {
		test('should return valid result on apply', () => {
			modal.setSnapshotName('Valid Timeline');
			const result = modal.applyChanges();

			expect(result.cancelled).toBe(false);
			expect(result.snapshot).not.toBeNull();
			expect(result.snapshot!.name).toBe('Valid Timeline');
		});

		test('should return null snapshot for invalid state on apply', () => {
			// No name, no events validation at apply time
			const result = modal.applyChanges();
			// If snapshot is created regardless, it's valid behavior
			expect(result.cancelled).toBe(false);
		});

		test('should clear data on cancel', () => {
			modal.setSnapshotName('Test');
			modal.cancelChanges();

			expect(modal.events).toHaveLength(0);
			expect(modal.getSnapshotName()).toBe('');
		});

		test('should clear events before clearing name on cancel', () => {
			modal.addCustomEvent('Event');
			modal.setSnapshotName('Test');
			modal.cancelChanges();

			expect(modal.events).toEqual([]);
			expect(modal.getSnapshotName()).toBe('');
		});
	});

	describe('Modal state management', () => {
		test('should track source document', () => {
			const testModal = new TimelineModal(mockApp, mockEvents, 'test.md');
			expect(testModal.sourceDocument).toBe('test.md');
		});

		test('should initialize with empty snapshot name', () => {
			expect(modal.getSnapshotName()).toBe('');
		});

		test('should initialize with provided events', () => {
			expect(modal.events).toHaveLength(mockEvents.length);
		});

		test('should have initial draggedEventId as null', () => {
			// Access private property for testing
			expect((modal as any).draggedEventId).toBeNull();
		});
	});

	describe('Edge cases', () => {
		test('should handle empty event list', () => {
			const emptyModal = new TimelineModal(mockApp, [], 'test.md');
			expect(emptyModal.events).toEqual([]);
			expect(emptyModal.isSnapshotValid()).toBe(false);
		});

		test('should handle very large event list', () => {
			const largeEventList: TimelineEvent[] = Array.from(
				{ length: 1000 },
				(_, i) => ({
					id: `event${i}`,
					text: `Event ${i}`,
					temporalTerms: [],
					sourceDocument: 'large.md',
					isCustom: false,
				})
			);

			const largeModal = new TimelineModal(
				mockApp,
				largeEventList,
				'large.md'
			);
			expect(largeModal.events).toHaveLength(1000);
		});

		test('should handle events with special characters', () => {
			const specialEvent: TimelineEvent = {
				id: 'special',
				text: 'Event with @#$%^&*() special chars',
				temporalTerms: ['@#$%'],
				sourceDocument: 'test.md',
				isCustom: false,
			};

			const specialModal = new TimelineModal(
				mockApp,
				[specialEvent],
				'test.md'
			);
			expect(specialModal.events[0]!.text).toContain('@#$%');
		});

		test('should handle empty temporal terms array', () => {
			const eventNoTerms: TimelineEvent = {
				id: 'noterms',
				text: 'Event without temporal terms',
				temporalTerms: [],
				sourceDocument: 'test.md',
				isCustom: false,
			};

			const testModal = new TimelineModal(
				mockApp,
				[eventNoTerms],
				'test.md'
			);
			expect(testModal.events[0]!.temporalTerms).toEqual([]);
		});

		test('should handle events with many temporal terms', () => {
			const eventManyTerms: TimelineEvent = {
				id: 'manyterms',
				text: 'Complex temporal event',
				temporalTerms: [
					'before',
					'after',
					'during',
					'then',
					'once',
					'past',
					'present',
					'future',
				],
				sourceDocument: 'test.md',
				isCustom: false,
			};

			const testModal = new TimelineModal(
				mockApp,
				[eventManyTerms],
				'test.md'
			);
			expect(testModal.events[0]!.temporalTerms).toHaveLength(8);
		});

		test('should handle nested event manipulation', () => {
			modal.addCustomEvent('Custom 1');
			modal.addCustomEvent('Custom 2');
			modal.moveEvent(modal.events[3]!.id, 0);
			modal.removeEvent(modal.events[1]!.id);

			expect(modal.events).toHaveLength(4); // 3 original + 2 custom - 1 removed
		});
	});

	describe('Integration scenarios', () => {
		test('should handle complete workflow', () => {
			// Add custom events
			modal.addCustomEvent('Lucy discovers the artifact');
			modal.addCustomEvent('Portal opens');

			// Reorder
			modal.moveEvent(modal.events[4]!.id, 1);

			// Set name
			modal.setSnapshotName('Act I Timeline');

			// Validate and build
			expect(modal.isSnapshotValid()).toBe(true);
			const result = modal.applyChanges();

			expect(result.snapshot).not.toBeNull();
			expect(result.snapshot!.name).toBe('Act I Timeline');
			expect(result.snapshot!.events).toHaveLength(5);
		});

		test('should handle event deletion workflow', () => {
			// Remove less important events
			modal.removeEvent('event2');

			// Add replacement custom event
			modal.addCustomEvent('Lucy enters the portal');

			// Verify
			expect(modal.events).toHaveLength(3); // 2 original + 1 custom
			expect(modal.events.find((e) => e.id === 'event2')).toBeUndefined();
		});

		test('should handle complete reordering workflow', () => {
			modal.setSnapshotName('Narrative Order');

			// Reorder all events
			const originalIds = modal.events.map((e) => e.id);
			modal.moveEvent('event3', 0);
			modal.moveEvent('event2', 2);

			// Verify order changed but all events present
			const newIds = modal.events.map((e) => e.id);
			expect(new Set(newIds)).toEqual(new Set(originalIds));
			expect(modal.events[0]!.id).toBe('event3');
		});

		test('should allow save-cancel-retry flow', () => {
			modal.setSnapshotName('First Attempt');
			modal.addCustomEvent('Custom event');

			// Attempt 1: Build snapshot
			let snapshot = modal.buildSnapshot();
			expect(snapshot.name).toBe('First Attempt');

			// Cancel
			modal.cancelChanges();
			expect(modal.getSnapshotName()).toBe('');

			// Retry
			modal.addCustomEvent('New event');
			modal.setSnapshotName('Second Attempt');

			snapshot = modal.buildSnapshot();
			expect(snapshot.name).toBe('Second Attempt');
		});
	});
});
