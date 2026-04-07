import { TimelineModal } from './timelineModal';
import { TimelineEvent } from '../../types';
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
sentence: 'Lucy discovers the void',
text: 'Lucy discovers the void',
source: { document: 'chapter1.md', line: 1 },
temporalTerms: ['discovers'],
order: 0,
status: 'draft' as const,
isCustom: false,
},
{
id: 'event2',
sentence: 'Portal opens to another world',
text: 'Portal opens to another world',
source: { document: 'chapter1.md', line: 2 },
temporalTerms: ['opens'],
order: 1,
status: 'draft' as const,
isCustom: false,
},
{
id: 'event3',
sentence: 'Magic ritual begins',
text: 'Magic ritual begins',
source: { document: 'chapter2.md', line: 3 },
temporalTerms: ['begins'],
order: 2,
status: 'draft' as const,
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

test('should add custom event', () => {
modal.addCustomEvent('Custom timeline event');
expect(modal.events).toHaveLength(4);
expect(modal.events[3]!.text).toBe('Custom timeline event');
expect(modal.events[3]!.isCustom).toBe(true);
});

test('should remove event by ID', () => {
modal.removeEvent('event1');
expect(modal.events).toHaveLength(2);
expect(modal.events.find((e) => e.id === 'event1')).toBeUndefined();
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
});

describe('Snapshot naming', () => {
test('should set snapshot name', () => {
modal.setSnapshotName('My Timeline');
expect(modal.getSnapshotName()).toBe('My Timeline');
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
});

describe('Snapshot building', () => {
test('should build snapshot with correct structure', () => {
modal.setSnapshotName('Test Snapshot');
const snapshot = modal.buildSnapshot();

expect(snapshot).toHaveProperty('id');
expect(snapshot).toHaveProperty('name');
expect(snapshot).toHaveProperty('events');
expect(snapshot).toHaveProperty('createdAt');
expect(snapshot).toHaveProperty('documentSource');
});

test('should set source document in snapshot', () => {
const snapshot = modal.buildSnapshot();
expect(snapshot.documentSource).toBe('chapter1.md');
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

test('should clear data on cancel', () => {
modal.setSnapshotName('Test');
modal.cancelChanges();

expect(modal.events).toHaveLength(0);
expect(modal.getSnapshotName()).toBe('');
});
});

describe('Edge cases', () => {
test('should handle 1000+ event lists', () => {
const largeEventList: TimelineEvent[] = Array.from(
{ length: 1000 },
(_, i) => ({
id: `event${i}`,
sentence: `Event ${i}`,
text: `Event ${i}`,
source: { document: 'large.md', line: i },
temporalTerms: [],
order: i,
status: 'draft' as const,
isCustom: false,
})
);

const largeModal = new TimelineModal(mockApp, largeEventList, 'large.md');
expect(largeModal.events).toHaveLength(1000);
});
});

describe('Integration scenarios', () => {
test('should handle complete workflow', () => {
modal.addCustomEvent('Lucy discovers the artifact');
modal.addCustomEvent('Portal opens');

modal.setSnapshotName('Act I Timeline');

expect(modal.isSnapshotValid()).toBe(true);
const result = modal.applyChanges();

expect(result.snapshot).not.toBeNull();
expect(result.snapshot!.name).toBe('Act I Timeline');
});
});
});
