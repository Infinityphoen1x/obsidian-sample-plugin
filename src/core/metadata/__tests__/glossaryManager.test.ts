import { GlossaryManager, GlossaryEntry } from "../glossaryManager";
import { Entity, Group } from "../../../types";
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

describe("GlossaryManager - Glossary Tree Structure", () => {
	let manager: GlossaryManager;
	let mockVault: Vault;
	let fileStorage: Map<string, string>;

	beforeEach(() => {
		const { mockVault: vault, fileStorage: storage } = createMockVault();
		mockVault = vault;
		fileStorage = storage;
		manager = new GlossaryManager(mockVault, ".metadata");
	});

	describe("Initialization", () => {
		test("should initialize with empty tree", () => {
			expect(manager).toBeInstanceOf(GlossaryManager);
			const tree = manager.getTree();
			expect(tree.entries).toHaveLength(0);
		});

		test("should load with no existing glossary file", async () => {
			await manager.loadGlossary();
			const tree = manager.getTree();
			expect(tree.entries).toHaveLength(0);
		});
	});

	describe("Building from Groups and Entities", () => {
		test("should build glossary from groups", () => {
			const groups: Group[] = [
				{
					id: "grp_1",
					name: "Characters",
					folder: "Characters/",
					keyTermIds: ["ent_1", "ent_2"],
					tags: [],
					createdAt: Date.now(),
				},
				{
					id: "grp_2",
					name: "Locations",
					folder: "Locations/",
					keyTermIds: ["ent_3"],
					tags: [],
					createdAt: Date.now(),
				},
			];

			const entities: Entity[] = [
				{
					id: "ent_1",
					name: "Lucy",
					group: "Characters",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				{
					id: "ent_2",
					name: "Vincent",
					group: "Characters",
					frequency: 32,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				{
					id: "ent_3",
					name: "Mage Tower",
					group: "Locations",
					frequency: 18,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			manager.buildFromGroupsAndEntities(groups, entities);

			const tree = manager.getTree();
			expect(tree.entries).toHaveLength(2);

			const charGroup = tree.entries.find((e) => e.name === "Characters");
			expect(charGroup?.children).toHaveLength(2);

			const locGroup = tree.entries.find((e) => e.name === "Locations");
			expect(locGroup?.children).toHaveLength(1);
		});

		test("should handle ungrouped entities", () => {
			const groups: Group[] = [];

			const entities: Entity[] = [
				{
					id: "ent_1",
					name: "Standalone",
					frequency: 5,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			manager.buildFromGroupsAndEntities(groups, entities);

			const tree = manager.getTree();
			const ungrouped = tree.entries.find((e) => e.name === "Ungrouped");
			expect(ungrouped).toBeDefined();
			expect(ungrouped?.children).toHaveLength(1);
		});

		test("should include entity descriptions", () => {
			const groups: Group[] = [
				{
					id: "grp_1",
					name: "Characters",
					folder: "Characters/",
					keyTermIds: ["ent_1"],
					tags: [],
					createdAt: Date.now(),
				},
			];

			const entities: Entity[] = [
				{
					id: "ent_1",
					name: "Lucy",
					group: "Characters",
					description: "The protagonist",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			manager.buildFromGroupsAndEntities(groups, entities);

			const tree = manager.getTree();
			const charGroup = tree.entries.find((e) => e.name === "Characters");
			const lucy = charGroup?.children?.[0];
			expect(lucy?.description).toBe("The protagonist");
		});

		test("should sort children alphabetically", () => {
			const groups: Group[] = [
				{
					id: "grp_1",
					name: "Characters",
					folder: "Characters/",
					keyTermIds: ["ent_2", "ent_1", "ent_3"],
					tags: [],
					createdAt: Date.now(),
				},
			];

			const entities: Entity[] = [
				{
					id: "ent_1",
					name: "Alice",
					group: "Characters",
					frequency: 10,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				{
					id: "ent_2",
					name: "Zoe",
					group: "Characters",
					frequency: 10,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				{
					id: "ent_3",
					name: "Bob",
					group: "Characters",
					frequency: 10,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			manager.buildFromGroupsAndEntities(groups, entities);

			const tree = manager.getTree();
			const charGroup = tree.entries.find((e) => e.name === "Characters");
			const names = charGroup?.children?.map((c) => c.name) || [];
			expect(names).toEqual(["Alice", "Bob", "Zoe"]);
		});
	});

	describe("Add or Update Entry", () => {
		test("should add entry to existing group", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			const tree = manager.getTree();
			const charGroup = tree.entries.find((e) => e.name === "Characters");
			expect(charGroup?.children).toHaveLength(1);
		});

		test("should create group if not exists", () => {
			manager.addOrUpdateEntry(
				"NewGroup",
				{
					id: "ent_1",
					name: "Item",
					frequency: 1,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"NewGroup/Item.md"
			);

			const tree = manager.getTree();
			const newGroup = tree.entries.find((e) => e.name === "NewGroup");
			expect(newGroup).toBeDefined();
			expect(newGroup?.children).toHaveLength(1);
		});

		test("should update existing entry", () => {
			const entity: Entity = {
				id: "ent_1",
				name: "Lucy",
				frequency: 45,
				sources: [],
				tags: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
				description: "Original description",
			};

			manager.addOrUpdateEntry("Characters", entity, "Characters/Lucy.md");

			const updatedEntity: Entity = {
				...entity,
				description: "Updated description",
				frequency: 50,
			};

			manager.addOrUpdateEntry(
				"Characters",
				updatedEntity,
				"Characters/Lucy.md"
			);

			const tree = manager.getTree();
			const charGroup = tree.entries.find((e) => e.name === "Characters");
			expect(charGroup?.children).toHaveLength(1);
			expect(charGroup?.children?.[0].description).toBe(
				"Updated description"
			);
		});
	});

	describe("Remove Entry", () => {
		test("should remove entry from group", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			manager.removeEntry("Characters", "ent_1");

			const tree = manager.getTree();
			const charGroup = tree.entries.find((e) => e.name === "Characters");
			expect(charGroup).toBeUndefined();
		});

		test("should remove only specified entity", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_2",
					name: "Vincent",
					frequency: 32,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Vincent.md"
			);

			manager.removeEntry("Characters", "ent_1");

			const tree = manager.getTree();
			const charGroup = tree.entries.find((e) => e.name === "Characters");
			expect(charGroup?.children).toHaveLength(1);
			expect(charGroup?.children?.[0].name).toBe("Vincent");
		});
	});

	describe("Querying", () => {
		test("should get group entries", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			const entries = manager.getGroupEntries("Characters");
			expect(entries).toHaveLength(1);
			expect(entries[0].name).toBe("Lucy");
		});

		test("should find entry by entity ID", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			const entry = manager.findByEntityId("ent_1");
			expect(entry).toBeDefined();
			expect(entry?.name).toBe("Lucy");
		});

		test("should search by name", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			const results = manager.search("Lucy");
			expect(results).toHaveLength(1);
			expect(results[0].name).toBe("Lucy");
		});

		test("should perform partial name search", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			const results = manager.search("Luc");
			expect(results).toHaveLength(1);
		});
	});

	describe("Statistics", () => {
		test("should calculate statistics", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			manager.addOrUpdateEntry(
				"Locations",
				{
					id: "ent_2",
					name: "Tower",
					frequency: 20,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Locations/Tower.md"
			);

			const stats = manager.getStats();
			expect(stats.totalGroups).toBe(2);
			expect(stats.totalEntities).toBe(2);
			expect(stats.entriesByGroup["Characters"]).toBe(1);
			expect(stats.entriesByGroup["Locations"]).toBe(1);
		});
	});

	describe("Persistence", () => {
		test("should persist glossary to JSON", async () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			await manager.persist();

			const glossaryPath = ".metadata/glossary.json";
			expect(fileStorage.has(glossaryPath)).toBe(true);

			const json = fileStorage.get(glossaryPath) || "{}";
			const parsed = JSON.parse(json);
			expect(parsed.entries).toBeDefined();
			expect(parsed.entries.length).toBeGreaterThan(0);
		});

		test("should load persisted glossary", async () => {
			const glossaryData = {
				version: 1,
				lastUpdated: Date.now(),
				entries: [
					{
						name: "Characters",
						type: "group",
						path: "Characters/",
						children: [
							{
								name: "Lucy",
								type: "entity",
								path: "Characters/Lucy.md",
								entityId: "ent_1",
								frequency: 45,
							},
						],
					},
				],
			};

			fileStorage.set(
				".metadata/glossary.json",
				JSON.stringify(glossaryData)
			);

			const newManager = new GlossaryManager(mockVault, ".metadata");
			await newManager.loadGlossary();

			const tree = newManager.getTree();
			expect(tree.entries).toHaveLength(1);
		});

		test("should complete round-trip: build → persist → reload", async () => {
			const groups: Group[] = [
				{
					id: "grp_1",
					name: "Characters",
					folder: "Characters/",
					keyTermIds: ["ent_1", "ent_2"],
					tags: [],
					createdAt: Date.now(),
				},
			];

			const entities: Entity[] = [
				{
					id: "ent_1",
					name: "Lucy",
					group: "Characters",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				{
					id: "ent_2",
					name: "Vincent",
					group: "Characters",
					frequency: 32,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
			];

			manager.buildFromGroupsAndEntities(groups, entities);
			await manager.persist();

			const newManager = new GlossaryManager(mockVault, ".metadata");
			await newManager.loadGlossary();

			const tree = newManager.getTree();
			expect(tree.entries).toHaveLength(1);
			expect(tree.entries[0].children).toHaveLength(2);
		});
	});

	describe("Export", () => {
		test("should export glossary as text", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			const text = manager.exportAsText();
			expect(text).toContain("Characters");
			expect(text).toContain("Lucy");
		});

		test("should use custom separator in export", () => {
			manager.addOrUpdateEntry(
				"Characters",
				{
					id: "ent_1",
					name: "Lucy",
					frequency: 45,
					sources: [],
					tags: [],
					createdAt: Date.now(),
					updatedAt: Date.now(),
				},
				"Characters/Lucy.md"
			);

			const text = manager.exportAsText(" | ");
			expect(text).toContain(" | ");
		});
	});
});
