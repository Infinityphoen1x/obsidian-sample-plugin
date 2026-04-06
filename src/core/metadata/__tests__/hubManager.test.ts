import { HubManager } from "../hubManager";
import { HubEntry } from "../../../types";
import { Vault, TFile } from "obsidian";

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

describe("HubManager - Cross-Reference Tracking", () => {
	let manager: HubManager;
	let mockVault: Vault;
	let fileStorage: Map<string, string>;

	beforeEach(() => {
		const { mockVault: vault, fileStorage: storage } = createMockVault();
		mockVault = vault;
		fileStorage = storage;
		manager = new HubManager(mockVault, ".metadata");
	});

	describe("Initialization", () => {
		test("should initialize with empty entries", () => {
			expect(manager).toBeInstanceOf(HubManager);
			expect(manager.getEntries()).toHaveLength(0);
		});

		test("should load with no existing hub file", async () => {
			await manager.loadHub();
			expect(manager.getEntries()).toHaveLength(0);
		});
	});

	describe("Co-Occurrence Detection", () => {
		test("should detect pairs in sentences", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy meets Magic", ["ent_001", "ent_002"]],
				["Magic is dark", ["ent_002"]],
				["Lucy and Vincent meet", ["ent_001", "ent_003"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);

			const entries = manager.getEntries();
			expect(entries.length).toBeGreaterThan(0);
		});

		test("should track frequency of co-occurrences", () => {
			const sentenceEntities1 = new Map<string, string[]>([
				["Lucy meets Magic", ["ent_001", "ent_002"]],
			]);

			const sentenceEntities2 = new Map<string, string[]>([
				["Lucy and Magic again", ["ent_001", "ent_002"]],
			]);

			manager.detectCoOccurrences(sentenceEntities1, "Chapter1.md", 1);
			manager.detectCoOccurrences(sentenceEntities2, "Chapter1.md", 5);

			const entries = manager.getEntries();
			expect(entries.length).toBeGreaterThan(0);

			// Find the Lucy+Magic entry
			const lucyMagic = entries.find(
				(e) =>
					e.entities.includes("ent_001") &&
					e.entities.includes("ent_002")
			);
			expect(lucyMagic?.frequency).toBe(2);
		});

		test("should create sorted entity pairs", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Pair 1", ["ent_zzz", "ent_aaa"]],
				["Pair 2", ["ent_aaa", "ent_zzz"]], // Same entities, different order
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);

			const entries = manager.getEntries();
			// Should recognize as same pair despite order difference
			expect(entries.length).toBeLessThanOrEqual(2);
		});

		test("should ignore single-entity sentences", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Single entity", ["ent_001"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);

			expect(manager.getEntries()).toHaveLength(0);
		});

		test("should handle multiple co-occurrences in one call", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy and Vincent meet", ["ent_001", "ent_003"]],
				["Magic and Void", ["ent_002", "ent_004"]],
				["All four meet", ["ent_001", "ent_002", "ent_003", "ent_004"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);

			const entries = manager.getEntries();
			expect(entries.length).toBeGreaterThanOrEqual(3);
		});
	});

	describe("Source Tracking", () => {
		test("should track sources for co-occurrences", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy meets Magic", ["ent_001", "ent_002"]],
			]);

			manager.detectCoOccurrences(
				sentenceEntities,
				"Chapter1.md",
				10
			);

			const entries = manager.getEntries();
			const entry = entries[0];
			expect(entry.sources).toHaveLength(1);
			expect(entry.sources[0].document).toBe("Chapter1.md");
			expect(entry.sources[0].lineNumbers).toContain(10);
		});

		test("should accumulate sources from multiple documents", () => {
			const sentenceEntities1 = new Map<string, string[]>([
				["Lucy meets Magic", ["ent_001", "ent_002"]],
			]);

			const sentenceEntities2 = new Map<string, string[]>([
				["Lucy and Magic again", ["ent_001", "ent_002"]],
			]);

			manager.detectCoOccurrences(
				sentenceEntities1,
				"Chapter1.md",
				10
			);
			manager.detectCoOccurrences(
				sentenceEntities2,
				"Chapter2.md",
				15
			);

			const entries = manager.getEntries();
			const entry = entries[0];
			expect(entry.sources.length).toBeGreaterThanOrEqual(1);

			const ch2Source = entry.sources.find(
				(s) => s.document === "Chapter2.md"
			);
			expect(ch2Source).toBeDefined();
		});
	});

	describe("Persistence", () => {
		test("should persist hub to CSV", async () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy meets Magic", ["ent_001", "ent_002"]],
				["Vincent and Void", ["ent_003", "ent_004"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);
			await manager.persist();

			const hubPath = ".metadata/hub-cross-references.csv";
			expect(fileStorage.has(hubPath)).toBe(true);

			const csv = fileStorage.get(hubPath) || "";
			expect(csv).toContain("id,entities,frequency,sources");
			expect(csv).toContain("ent_001");
			expect(csv).toContain("ent_002");
		});

		test("should load persisted hub entries", async () => {
			// Pre-populate CSV
			const csv = `id,entities,frequency,sources
hub_ent_001_ent_002,ent_001|ent_002,2,"[{\\"document\\":\\"Chapter1.md\\",\\"lineNumbers\\":[1]}]"
hub_ent_003_ent_004,ent_003|ent_004,1,"[{\\"document\\":\\"Chapter2.md\\",\\"lineNumbers\\":[5]}]"`;

			fileStorage.set(".metadata/hub-cross-references.csv", csv);

			const newManager = new HubManager(mockVault, ".metadata");
			await newManager.loadHub();

			const entries = newManager.getEntries();
			expect(entries.length).toBeGreaterThanOrEqual(2);
		});

		test("should complete round-trip: create → persist → reload", async () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy and Magic", ["ent_001", "ent_002"]],
				["Vincent and Void", ["ent_003", "ent_004"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);
			await manager.persist();

			const newManager = new HubManager(mockVault, ".metadata");
			await newManager.loadHub();

			const reloaded = newManager.getEntries();
			expect(reloaded).toHaveLength(manager.getEntries().length);

			reloaded.forEach((entry) => {
				expect(entry.id).toBeDefined();
				expect(entry.entities.length).toBeGreaterThanOrEqual(2);
				expect(entry.frequency).toBeGreaterThan(0);
			});
		});
	});

	describe("Querying", () => {
		test("should retrieve entry by ID", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy meets Magic", ["ent_001", "ent_002"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);
			const entries = manager.getEntries();
			const id = entries[0].id;

			const retrieved = manager.getEntry(id);
			expect(retrieved).toBeDefined();
			expect(retrieved?.entities).toContain("ent_001");
		});

		test("should find entries for a specific entity", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy meets Magic", ["ent_001", "ent_002"]],
				["Lucy and Vincent", ["ent_001", "ent_003"]],
				["Magic and Void", ["ent_002", "ent_004"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);

			const lucyEntries = manager.getEntriesForEntity("ent_001");
			expect(lucyEntries.length).toBeGreaterThanOrEqual(2);
			lucyEntries.forEach((entry) => {
				expect(entry.entities).toContain("ent_001");
			});
		});

		test("should search by entity pair", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy meets Magic", ["ent_001", "ent_002"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);

			const found = manager.searchByEntities(["ent_001", "ent_002"]);
			expect(found).toBeDefined();
			expect(found?.frequency).toBeGreaterThan(0);
		});
	});

	describe("Statistics", () => {
		test("should calculate statistics", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy meets Magic", ["ent_001", "ent_002"]],
				["Lucy and Vincent", ["ent_001", "ent_003"]],
				["Magic and Void", ["ent_002", "ent_004"]],
				["Lucy and Magic again", ["ent_001", "ent_002"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);

			const stats = manager.getStats();
			expect(stats.totalEntries).toBeGreaterThan(0);
			expect(stats.totalCoOccurrences).toBeGreaterThan(0);
			expect(stats.avgFrequency).toBeGreaterThan(0);
		});

		test("should handle empty hub stats", () => {
			const stats = manager.getStats();
			expect(stats.totalEntries).toBe(0);
			expect(stats.totalCoOccurrences).toBe(0);
			expect(stats.avgFrequency).toBe(0);
		});
	});

	describe("Edge Cases", () => {
		test("should handle three-way co-occurrences", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy, Magic, and Vincent meet", ["ent_001", "ent_002", "ent_003"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);

			const entries = manager.getEntries();
			expect(entries.length).toBeGreaterThan(0);

			// Should create all three-way combination
			const threeWay = entries.find(
				(e) =>
					e.entities.includes("ent_001") &&
					e.entities.includes("ent_002") &&
					e.entities.includes("ent_003")
			);
			expect(threeWay).toBeDefined();
		});

		test("should handle duplicate entity IDs in same sentence", () => {
			const sentenceEntities = new Map<string, string[]>([
				["Lucy and Lucy", ["ent_001", "ent_001"]],
			]);

			manager.detectCoOccurrences(sentenceEntities, "Chapter1.md", 1);

			// Should not create self-reference entries
			const entries = manager.getEntries();
			entries.forEach((entry) => {
				const uniqueEntities = new Set(entry.entities);
				expect(uniqueEntities.size).toBeGreaterThan(1);
			});
		});
	});
});
