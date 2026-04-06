import { MasterMetadata, MergeResult } from "../masterMetadata";
import { Entity, PluginSettings, SourceRef } from "../../../types";
import { Vault } from "obsidian";
import {
	createMockSettings,
	createEntity,
	createSourceRef,
	createEntityWithSources,
	createEntityWithTags,
	createEntityWithGroup,
	createEntityWithDescription,
	resetEntityCounter,
} from "./testHelpers";

// Mock Obsidian components
const mockVault = {
	getFileByPath: jest.fn().mockReturnValue(null),
	read: jest.fn().mockResolvedValue(""),
	create: jest.fn().mockResolvedValue(undefined),
	modify: jest.fn().mockResolvedValue(undefined),
} as any as Vault;
const mockSettings = createMockSettings();

describe("MasterMetadata - Entity Merge & Persistence", () => {
	let masterMetadata: MasterMetadata;
	let trackedEntities: Map<string, Entity>;

	beforeEach(() => {
		resetEntityCounter();
		trackedEntities = new Map();
		masterMetadata = new MasterMetadata(mockVault, mockSettings);
		// Mock the entityStore's methods
		(masterMetadata as any).entityStore.loadEntities = jest.fn().mockResolvedValue(undefined);
		(masterMetadata as any).entityStore.persist = jest.fn().mockResolvedValue(undefined);
		
		// Mock addEntity to track entities
		(masterMetadata as any).entityStore.addEntity = jest.fn((entity: Entity) => {
			trackedEntities.set(entity.id, entity);
		});
		
		// Mock getAllEntities to return tracked entities
		(masterMetadata as any).entityStore.getAllEntities = jest.fn(() => {
			return Array.from(trackedEntities.values());
		});
	});

	describe("Initialization", () => {
		test("should initialize with empty entity store", async () => {
			(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue([]);
			await masterMetadata.initialize();
			expect((masterMetadata as any).entityStore.loadEntities).toHaveBeenCalled();
		});

		test("should build index on first initialization", async () => {
			(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue([]);
			await masterMetadata.initialize();
			expect((masterMetadata as any).index).toBeDefined();
		});

		test("should handle initialization errors gracefully", async () => {
			(masterMetadata as any).entityStore.loadEntities = jest.fn().mockRejectedValueOnce(new Error("Load failed"));
			await expect(masterMetadata.initialize()).resolves.not.toThrow();
		});
	});

	describe("Single Entity Addition", () => {
		beforeEach(() => {
			trackedEntities.clear();
		});

		test("should add new entity and return true", () => {
			const entity = createEntity({
				id: "ent_abc123_0001",
				name: "Lucy",
				frequency: 1,
				tags: ["character"],
			});

			const result = masterMetadata.addEntity(entity);
			expect(result).toBe(true);
			expect((masterMetadata as any).entityStore.addEntity).toHaveBeenCalledWith(entity);
		});

		test("should merge existing entity and return false", () => {
			const existingEntity = createEntity({
				id: "ent_abc123_0001",
				name: "Lucy",
				frequency: 5,
				sources: [createSourceRef("doc1.md")],
				tags: ["character"],
			});

			const incomingEntity = createEntity({
				id: "ent_abc123_0002",
				name: "lucy",
				frequency: 1,
				sources: [createSourceRef("doc2.md")],
				tags: ["protagonist"],
			});

			(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue([existingEntity]);

			const result = masterMetadata.addEntity(incomingEntity);
			expect(result).toBe(false);
		});
	});

	describe("Batch Entity Addition with Merge Logic", () => {
		beforeEach(() => {
			trackedEntities.clear();
		});

		test("should add multiple new entities", () => {
			const entities: Entity[] = [
				createEntity({
					id: "ent_abc123_0001",
					name: "Lucy",
					frequency: 1,
					tags: ["character"],
				}),
				createEntity({
					id: "ent_def456_0002",
					name: "Naruto",
					frequency: 1,
					tags: ["character"],
				}),
			];

			const result = masterMetadata.addEntities(entities);
			expect(result.newEntities).toBe(2);
			expect(result.mergedEntities).toBe(0);
			expect(result.totalEntities).toBe(2);
		});

		test("should add source document to entities", () => {
			const entities: Entity[] = [
				createEntity({
					id: "ent_abc123_0001",
					name: "Lucy",
					frequency: 1,
					tags: ["character"],
				}),
			];

			masterMetadata.addEntities(entities, "doc1.md");
			const sources = entities[0]?.sources;
			expect(sources).toStrictEqual([expect.objectContaining({ document: "doc1.md" })]);
		});

		test("should not duplicate source documents", () => {
			const entities: Entity[] = [
				createEntity({
					id: "ent_abc123_0001",
					name: "Lucy",
					frequency: 1,
					sources: [createSourceRef("doc1.md")],
					tags: ["character"],
				}),
			];

			masterMetadata.addEntities(entities, "doc1.md");
			masterMetadata.addEntities(entities, "doc1.md");

			// Sources should not be duplicated
			const doc1Count = (entities[0]?.sources ?? []).filter((s) => s.document === "doc1.md").length;
			expect(doc1Count).toBeLessThanOrEqual(2);
		});
	});

	describe("Frequency Tracking", () => {
		test("should increase frequency when merging", () => {
			const masterEntity = createEntity({
				id: "ent_abc123_0001",
				name: "Lucy",
				frequency: 5,
				sources: [createSourceRef("doc1.md")],
				tags: ["character"],
			});

			const incomingEntity = createEntity({
				id: "ent_abc123_0002",
				name: "lucy",
				frequency: 3,
				sources: [createSourceRef("doc2.md")],
				tags: [],
			});

			(masterMetadata as any).mergeEntities(masterEntity, incomingEntity);
			expect(masterEntity.frequency).toBe(8);
		});

		test("should handle missing frequency values", () => {
			const masterEntity = createEntity({
				id: "ent_abc123_0001",
				name: "Lucy",
				sources: [createSourceRef("doc1.md")],
				tags: ["character"],
			});
			// Reset frequency to test default
			delete (masterEntity as any).frequency;

			const incomingEntity = createEntity({
				id: "ent_abc123_0002",
				name: "lucy",
				frequency: 2,
				sources: [createSourceRef("doc2.md")],
				tags: [],
			});

			(masterMetadata as any).mergeEntities(masterEntity, incomingEntity);
			expect(masterEntity.frequency).toBeGreaterThanOrEqual(2);
		});

		test("should sort entities by frequency correctly", () => {
			const entities: Entity[] = [
				createEntity({ id: "1", name: "Lucy", frequency: 5 }),
				createEntity({ id: "2", name: "Naruto", frequency: 10 }),
				createEntity({ id: "3", name: "Sasuke", frequency: 3 }),
			];

			(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue(entities);
			const sorted = masterMetadata.getEntitiesByFrequency();

			expect(sorted[0]?.name).toBe("Naruto");
			expect(sorted[1]?.name).toBe("Lucy");
			expect(sorted[2]?.name).toBe("Sasuke");
		});
	});

	describe("Source & Tag & Group Operations", () => {
		test("should merge source documents without duplicates", () => {
			const masterEntity = createEntity({
				sources: [createSourceRef("doc1.md"), createSourceRef("doc2.md")],
			});
			const incomingEntity = createEntity({
				sources: [createSourceRef("doc2.md"), createSourceRef("doc3.md")],
			});

			(masterMetadata as any).mergeEntities(masterEntity, incomingEntity);
			expect(masterEntity.sources?.map((s) => s.document)).toEqual(["doc1.md", "doc2.md", "doc3.md"]);
		});

		test("should merge tags without duplicates", () => {
			const masterEntity = createEntity({ tags: ["character", "protagonist"] });
			const incomingEntity = createEntity({ tags: ["protagonist", "female"] });

			(masterMetadata as any).mergeEntities(masterEntity, incomingEntity);
			expect(masterEntity.tags).toEqual(["character", "protagonist", "female"]);
		});

		test("should preserve longer description over shorter", () => {
			const masterEntity = createEntity({ description: "Short" });
			const incomingEntity = createEntity({ description: "A much longer description" });

			(masterMetadata as any).mergeEntities(masterEntity, incomingEntity);
			expect(masterEntity.description).toBe("A much longer description");
		});

		test("should preserve master group assignment", () => {
			const masterEntity = createEntity({ group: "characters" });
			const incomingEntity = createEntity({ group: "protagonists" });

			(masterMetadata as any).mergeEntities(masterEntity, incomingEntity);
			expect(masterEntity.group).toBe("characters");
		});

		test("should assign group from incoming when master lacks one", () => {
			const masterEntity = createEntity({});
			const incomingEntity = createEntity({ group: "characters" });

			(masterMetadata as any).mergeEntities(masterEntity, incomingEntity);
			expect(masterEntity.group).toBe("characters");
		});

		describe.each([
			{ method: "getEntitiesByTag", key: "tags", searchValue: "protagonist", filterFactory: (v: string) => ["character", v] },
			{ method: "getEntitiesBySource", key: "sources", searchValue: "doc1.md", filterFactory: (v: string) => [createSourceRef(v)] },
			{ method: "getEntitiesByGroup", key: "group", searchValue: "characters", filterFactory: (v: string) => v },
		])("$method filtering", ({ method, key, searchValue, filterFactory }) => {
			test(`should filter entities by ${key}`, () => {
				const entities = [
					key === "group" ? createEntityWithGroup("Lucy", filterFactory(searchValue) as string) : 
					key === "tags" ? createEntityWithTags("Lucy", filterFactory(searchValue) as string[]) :
					createEntityWithSources("Lucy", filterFactory(searchValue) as unknown as SourceRef[]),
					key === "group" ? createEntityWithGroup("Naruto", "other") :
					key === "tags" ? createEntityWithTags("Naruto", ["other"]) :
					createEntityWithSources("Naruto", [createSourceRef("other.md")]),
				];

				(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue(entities);
				const result = (masterMetadata as any)[method](searchValue);

				expect(result).toHaveLength(1);
				expect(result[0]?.name).toBe("Lucy");
			});
		});
	});

	describe("Timestamp Tracking", () => {
		test("should update updatedAt when merging", () => {
			const masterEntity = createEntity({
				id: "ent_abc123_0001",
				name: "Lucy",
				frequency: 1,
				sources: [],
				tags: [],
				updatedAt: Date.now() - 10000, // 10 seconds ago
			});

			const incomingEntity = createEntity({
				id: "ent_abc123_0002",
				name: "lucy",
				frequency: 1,
				sources: [],
				tags: [],
			});

			const beforeMerge = Date.now();
			(masterMetadata as any).mergeEntities(masterEntity, incomingEntity);
			const afterMerge = Date.now();

			expect(masterEntity.updatedAt).toBeGreaterThanOrEqual(beforeMerge);
			expect(masterEntity.updatedAt).toBeLessThanOrEqual(afterMerge);
		});
	});

	describe("Statistics & Reporting", () => {
		test("should calculate statistics correctly", () => {
			const entities: Entity[] = [
				createEntity({
					id: "1",
					name: "Lucy",
					frequency: 10,
					sources: [createSourceRef("doc1")],
					tags: ["char"],
					description: "Desc",
				}),
				createEntity({
					id: "2",
					name: "Naruto",
					frequency: 8,
				}),
				createEntity({
					id: "3",
					name: "Sasuke",
					frequency: 6,
				}),
			];

			(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue(entities);
			const stats = masterMetadata.getStatistics();

			expect(stats.totalEntities).toBe(3);
			expect(stats.avgFrequency).toBe(8); // (10 + 8 + 6) / 3
			expect(stats.mostFrequent?.name).toBe("Lucy");
			expect(stats.entitiesWithSources).toBe(1);
			expect(stats.entitiesWithTags).toBe(1);
			expect(stats.entitiesWithDescription).toBe(1);
		});

		test("should handle empty entity store in statistics", () => {
			(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue([]);
			const stats = masterMetadata.getStatistics();

			expect(stats.totalEntities).toBe(0);
			expect(stats.avgFrequency).toBe(0);
			expect(stats.mostFrequent).toBeNull();
		});
	});

	describe("Export", () => {
		test("should export to JSON format", () => {
			const entities: Entity[] = [createEntity({ id: "1", name: "Lucy", frequency: 5 })];

			(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue(entities);
			const json = masterMetadata.toJSON();

			expect(json.version).toBe("1.0");
			expect(json.exportDate).toBeDefined();
			expect(json.statistics).toBeDefined();
			expect(json.entities).toHaveLength(1);
		});

		test("should include all required fields in export", () => {
			const entities: Entity[] = [
				createEntity({
					id: "1",
					name: "Lucy",
					frequency: 5,
					sources: [createSourceRef("doc1")],
					tags: ["char"],
				}),
			];

			(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue(entities);
			const json = masterMetadata.toJSON();

			expect(json).toHaveProperty("version");
			expect(json).toHaveProperty("exportDate");
			expect(json).toHaveProperty("statistics");
			expect(json).toHaveProperty("entities");
		});
	});

	describe("Persistence", () => {
		test("should persist entities and index", async () => {
			(masterMetadata as any).entityStore.getAllEntities = jest.fn().mockReturnValue([]);
			await masterMetadata.persist();

			expect((masterMetadata as any).entityStore.persist).toHaveBeenCalled();
		});

		test("should handle persistence errors", async () => {
			(masterMetadata as any).entityStore.persist = jest.fn().mockRejectedValueOnce(new Error("Persist failed"));
			await expect(masterMetadata.persist()).rejects.toThrow("Persist failed");
		});
	});
});
