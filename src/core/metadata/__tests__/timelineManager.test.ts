import { TimelineManager } from "../timelineManager";
import { TimelineEvent } from "../../../types";
import { Vault, TFile } from "obsidian";

// Mock Obsidian Vault with file tracking
const createMockVault = () => {
	const fileStorage = new Map<string, string>();

	const createTFile = (path: string): TFile => {
		const file = new TFile();
		file.path = path;
		file.name = path.split("/").pop() || "";
		return file;
	};

	const mockVault = {
		getAbstractFileByPath: jest.fn((path: string) => {
			if (fileStorage.has(path)) {
				return createTFile(path);
			}
			return null;
		}),
		read: jest.fn(async (file: TFile) => {
			return fileStorage.get(file.path) || "";
		}),
		create: jest.fn(async (path: string, content: string) => {
			fileStorage.set(path, content);
			return createTFile(path);
		}),
		modify: jest.fn(async (file: TFile, content: string) => {
			fileStorage.set(file.path, content);
		}),
		getFileByPath: jest.fn((path: string) => {
			if (fileStorage.has(path)) {
				return createTFile(path);
			}
			return null;
		}),
	} as any;

	return { mockVault: mockVault as Vault, fileStorage };
};

describe("TimelineManager - CSV Persistence", () => {
	let manager: TimelineManager;
	let mockVault: Vault;
	let fileStorage: Map<string, string>;

	beforeEach(() => {
		const { mockVault: vault, fileStorage: storage } = createMockVault();
		mockVault = vault;
		fileStorage = storage;
		manager = new TimelineManager(mockVault, ".metadata");
	});

	describe("Initialization & Loading", () => {
		test("should initialize with correct parameters", () => {
			expect(manager).toBeInstanceOf(TimelineManager);
		});

		test("should load with no existing files", async () => {
			await manager.loadTimeline();
			expect(manager.getAllSnapshots()).toHaveLength(0);
		});

		test("should load existing timeline files", async () => {
			// Create mock CSV files
			const snapshotsCSV =
				'id,name,sourceDocument,createdAt,color,eventCount\n' +
				'snap_001,Timeline 1,Chapter1.md,1640000000000,#FF5733,2\n';

			const eventsCSV =
				'snapshotId,eventId,order,sentence,text,source_document,source_line,temporalTerms,status,isCustom,color\n' +
				'snap_001,evt_001,0,First event,First event,Chapter1.md,5,past,draft,false,#FF5733\n' +
				'snap_001,evt_002,1,Second event,Second event,Chapter1.md,10,then,confirmed,false,#FF5733\n';

			fileStorage.set(".metadata/master-timeline.csv", snapshotsCSV);
			fileStorage.set(".metadata/timeline-events.csv", eventsCSV);

			await manager.loadTimeline();

			const snapshots = manager.getAllSnapshots();
			expect(snapshots).toHaveLength(1);
			expect(snapshots[0].name).toBe("Timeline 1");

			const result = manager.getSnapshotWithEvents(snapshots[0].id);
			expect(result?.events).toHaveLength(2);
			expect(result?.events[0].sentence).toBe("First event");
		});
	});

	describe("Create & Persist Snapshots", () => {
		test("should create snapshot with events", async () => {
			const events: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: "Story begins",
					text: "Story begins",
					source: { document: "Chapter1.md", line: 1 },
					temporalTerms: ["once"],
					order: 0,
					status: "draft",
					isCustom: false,
				},
				{
					id: "evt_002",
					sentence: "Conflict arises",
					text: "Conflict arises",
					source: { document: "Chapter1.md", line: 15 },
					temporalTerms: ["then"],
					order: 1,
					status: "confirmed",
					isCustom: false,
				},
			];

			const snapshotId = manager.addSnapshot(
				"My Timeline",
				"Chapter1.md",
				events,
				"#FF5733"
			);

			expect(snapshotId).toBeDefined();
			expect(manager.getAllSnapshots()).toHaveLength(1);

			const snapshot = manager.getAllSnapshots()[0];
			expect(snapshot.name).toBe("My Timeline");
			expect(snapshot.sourceDocument).toBe("Chapter1.md");
		});

		test("should persist snapshots to CSV", async () => {
			const events: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: "Event 1",
					text: "Event 1",
					source: { document: "doc.md", line: 1 },
					temporalTerms: ["past"],
					order: 0,
					status: "draft",
					isCustom: false,
				},
			];

			manager.addSnapshot("Timeline 1", "doc.md", events, "#FF5733");
			await manager.persist();

			// Verify master-timeline.csv exists
			const snapshotsPath = ".metadata/master-timeline.csv";
			expect(fileStorage.has(snapshotsPath)).toBe(true);

			const snapshotsContent = fileStorage.get(snapshotsPath) || "";
			expect(snapshotsContent).toContain("Timeline 1");
			expect(snapshotsContent).toContain("doc.md");

			// Verify timeline-events.csv exists
			const eventsPath = ".metadata/timeline-events.csv";
			expect(fileStorage.has(eventsPath)).toBe(true);

			const eventsContent = fileStorage.get(eventsPath) || "";
			expect(eventsContent).toContain("Event 1");
		});

		test("should handle special characters in CSV", async () => {
			const events: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: 'Event with "quotes" and, commas',
					text: 'Event with "quotes" and, commas',
					source: { document: "doc.md", line: 1 },
					temporalTerms: ["past"],
					order: 0,
					status: "draft",
					isCustom: false,
				},
			];

			manager.addSnapshot("Timeline", "doc.md", events, "#FF5733");
			await manager.persist();

			// Reload and verify special characters are preserved
			const newManager = new TimelineManager(mockVault, ".metadata");
			await newManager.loadTimeline();

			const result = newManager.getSnapshotWithEvents(manager.getAllSnapshots()[0].id);
			expect(result?.events[0].sentence).toBe('Event with "quotes" and, commas');
		});
	});

	describe("Multiple Snapshots", () => {
		test("should manage multiple snapshots", async () => {
			const events1: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: "Event 1",
					text: "Event 1",
					source: { document: "doc1.md", line: 1 },
					temporalTerms: ["past"],
					order: 0,
					status: "draft",
					isCustom: false,
				},
			];

			const events2: TimelineEvent[] = [
				{
					id: "evt_002",
					sentence: "Event 2",
					text: "Event 2",
					source: { document: "doc2.md", line: 5 },
					temporalTerms: ["future"],
					order: 0,
					status: "confirmed",
					isCustom: true,
				},
			];

			manager.addSnapshot("Timeline A", "doc1.md", events1, "#FF5733");
			// Add small delay to ensure different timestamp for ID generation
			await new Promise((resolve) => setTimeout(resolve, 2));
			manager.addSnapshot("Timeline B", "doc2.md", events2, "#00FF00");

			expect(manager.getAllSnapshots()).toHaveLength(2);

			await manager.persist();

			// Reload and verify both snapshots
			const newManager = new TimelineManager(mockVault, ".metadata");
			await newManager.loadTimeline();

			const snapshots = newManager.getAllSnapshots();
			expect(snapshots).toHaveLength(2);
			expect(snapshots.map((s) => s.name).sort()).toEqual(["Timeline A", "Timeline B"]);
		});

		test("should get snapshot with all events", async () => {
			const events: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: "Event 1",
					text: "Event 1",
					source: { document: "doc.md", line: 1 },
					temporalTerms: ["past"],
					order: 0,
					status: "draft",
					isCustom: false,
				},
				{
					id: "evt_002",
					sentence: "Event 2",
					text: "Event 2",
					source: { document: "doc.md", line: 5 },
					temporalTerms: ["present"],
					order: 1,
					status: "confirmed",
					isCustom: false,
				},
			];

			const snapshotId = manager.addSnapshot(
				"Full Timeline",
				"doc.md",
				events,
				"#FF5733"
			);

			const result = manager.getSnapshotWithEvents(snapshotId);
			expect(result).toBeDefined();
			expect(result?.events).toHaveLength(2);
			expect(result?.events.map((e) => e.sentence)).toEqual([
				"Event 1",
				"Event 2",
			]);
		});
	});

	describe("Update Operations", () => {
		test("should update snapshot with new events", async () => {
			const events: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: "Original event",
					text: "Original event",
					source: { document: "doc.md", line: 1 },
					temporalTerms: ["past"],
					order: 0,
					status: "draft",
					isCustom: false,
				},
			];

			const snapshotId = manager.addSnapshot(
				"Timeline",
				"doc.md",
				events,
				"#FF5733"
			);

			// Update the snapshot (simulate reordering)
			const updatedEvents: TimelineEvent[] = [
				{
					...events[0],
					order: 1,
					status: "confirmed",
				},
				{
					id: "evt_002",
					sentence: "New event",
					text: "New event",
					source: { document: "doc.md", line: 20 },
					temporalTerms: ["future"],
					order: 0,
					status: "draft",
					isCustom: true,
				},
			];

			manager.updateSnapshotEvents(snapshotId, updatedEvents);
			await manager.persist();

			// Reload and verify
			const newManager = new TimelineManager(mockVault, ".metadata");
			await newManager.loadTimeline();

			const result = newManager.getSnapshotWithEvents(snapshotId);
			expect(result?.events).toHaveLength(2);
			expect(result?.events.find((e) => e.id === "evt_002")).toBeDefined();
		});
	});

	describe("Edge Cases", () => {
		test("should handle no temporal terms", async () => {
			const events: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: "Event without terms",
					text: "Event without terms",
					source: { document: "doc.md", line: 1 },
					temporalTerms: [],
					order: 0,
					status: "draft",
					isCustom: false,
				},
			];

			manager.addSnapshot("Timeline", "doc.md", events, "#FF5733");
			await manager.persist();

			const newManager = new TimelineManager(mockVault, ".metadata");
			await newManager.loadTimeline();

			const result = newManager.getSnapshotWithEvents(manager.getAllSnapshots()[0].id);
			expect(result?.events[0].temporalTerms).toEqual([]);
		});

		test("should handle undefined color", async () => {
			const events: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: "Event",
					text: "Event",
					source: { document: "doc.md", line: 1 },
					temporalTerms: ["past"],
					order: 0,
					status: "draft",
					isCustom: false,
				},
			];

			manager.addSnapshot("Timeline", "doc.md", events, undefined as any);
			await manager.persist();

			const newManager = new TimelineManager(mockVault, ".metadata");
			await newManager.loadTimeline();

			const snapshot = newManager.getAllSnapshots()[0];
			expect(snapshot.color).toBeUndefined();
		});

		test("should handle empty snapshot list", async () => {
			const manager2 = new TimelineManager(mockVault, ".metadata");
			await manager2.persist();

			// Should not crash and files should exist
			expect(fileStorage.has(".metadata/master-timeline.csv")).toBe(true);
		});

		test("should return undefined for non-existent snapshot", () => {
			const result = manager.getSnapshotWithEvents("nonexistent");
			expect(result).toBeUndefined();
		});
	});

	describe("CSV Format Validation", () => {
		test("should create valid CSV headers", async () => {
			const events: TimelineEvent[] = [];
			manager.addSnapshot("Timeline", "doc.md", events, "#FF5733");
			await manager.persist();

			const snapshotsCSV = fileStorage.get(".metadata/master-timeline.csv") || "";
			expect(snapshotsCSV).toContain("id,name,sourceDocument,createdAt,color,eventCount");

			const eventsCSV = fileStorage.get(".metadata/timeline-events.csv") || "";
			expect(eventsCSV).toContain(
				"snapshotId,eventId,order,sentence,text,source_document,source_line,temporalTerms,status,isCustom,color"
			);
		});

		test("should escape quotes in CSV values", async () => {
			const events: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: 'He said "hello"',
					text: 'He said "hello"',
					source: { document: "doc.md", line: 1 },
					temporalTerms: ["past"],
					order: 0,
					status: "draft",
					isCustom: false,
				},
			];

			manager.addSnapshot("Timeline", "doc.md", events, "#FF5733");
			await manager.persist();

			const eventsCSV = fileStorage.get(".metadata/timeline-events.csv") || "";
			// Quotes should be escaped as ""
			expect(eventsCSV).toContain('He said ""hello""');
		});
	});

	describe("Integration Flow", () => {
		test("should complete full lifecycle: create → persist → reload → verify", async () => {
			// Step 1: Create timeline with events
			const events: TimelineEvent[] = [
				{
					id: "evt_001",
					sentence: "Beginning",
					text: "Beginning",
					source: { document: "story.md", line: 10 },
					temporalTerms: ["once"],
					order: 0,
					status: "draft",
					isCustom: false,
					color: "#FF5733",
				},
				{
					id: "evt_002",
					sentence: "Middle",
					text: "Middle",
					source: { document: "story.md", line: 25 },
					temporalTerms: ["then"],
					order: 1,
					status: "confirmed",
					isCustom: false,
				},
				{
					id: "evt_003",
					sentence: "End",
					text: "End",
					source: { document: "story.md", line: 40 },
					temporalTerms: ["finally"],
					order: 2,
					status: "confirmed",
					isCustom: true,
					color: "#00FF00",
				},
			];

			const snapshotId = manager.addSnapshot(
				"My Story Timeline",
				"story.md",
				events,
				"#FF5733"
			);

			// Step 2: Persist to CSV
			await manager.persist();
			expect(fileStorage.has(".metadata/master-timeline.csv")).toBe(true);
			expect(fileStorage.has(".metadata/timeline-events.csv")).toBe(true);

			// Step 3: Create new manager and reload
			const newManager = new TimelineManager(mockVault, ".metadata");
			await newManager.loadTimeline();

			// Step 4: Verify everything loaded correctly
			const snapshots = newManager.getAllSnapshots();
			expect(snapshots).toHaveLength(1);

			const result = newManager.getSnapshotWithEvents(snapshotId);
			expect(result?.snapshot.name).toBe("My Story Timeline");
			expect(result?.snapshot.sourceDocument).toBe("story.md");

			expect(result?.events).toHaveLength(3);
			expect(result?.events[0]).toMatchObject({
				id: "evt_001",
				sentence: "Beginning",
				order: 0,
				status: "draft",
			});
			expect(result?.events[2]).toMatchObject({
				id: "evt_003",
				sentence: "End",
				order: 2,
				isCustom: true,
				color: "#00FF00",
			});
		});
	});
});
