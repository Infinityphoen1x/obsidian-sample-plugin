import { buildIndex, saveIndex, loadIndex, findEntityByName, getEntitiesByGroup } from "../indexFile";
import { Entity, MasterMetadataIndex } from "../../../types";
import { Vault, TFile } from "obsidian";
import {
	createEntity,
	createEntityWithGroup,
	createEntityWithTags,
	createSourceRef,
} from "./testHelpers";

// Mock Obsidian vault
const createMockVault = (): Vault => {
	const mockVault = {
		getFileByPath: jest.fn().mockReturnValue(null),
		getAbstractFileByPath: jest.fn().mockReturnValue(null),
		read: jest.fn().mockResolvedValue("{}"),
		create: jest.fn().mockResolvedValue(undefined),
		modify: jest.fn().mockResolvedValue(undefined),
	} as any;
	return mockVault as Vault;
};

// Create a mock TFile that passes instanceof checks
const createMockTFile = (): TFile => {
	const mock = Object.create(TFile.prototype);
	mock.path = "";
	mock.name = "";
	mock.basename = "";
	mock.extension = "";
	return mock as TFile;
};

describe("IndexFile - buildIndex", () => {
	test("should create empty index from empty entities", () => {
		const index = buildIndex([]);

		expect(index.nameToId.size).toBe(0);
		expect(index.canonicalToNames.size).toBe(0);
		expect(index.groupIndex.size).toBe(0);
		expect(index.version).toBe(1);
		expect(index.lastUpdated).toBeDefined();
	});

	test("should index single entity by name", () => {
		const entity = createEntity({ name: "Lucy" });
		const index = buildIndex([entity]);

		expect(index.nameToId.get("lucy")).toBe(entity.id);
	});

	test("should index multiple entities", () => {
		const entities = [
			createEntity({ name: "Lucy" }),
			createEntity({ name: "Naruto" }),
			createEntity({ name: "Sasuke" }),
		];
		const index = buildIndex(entities);

		expect(index.nameToId.size).toBe(3);
		expect(index.nameToId.get("lucy")).toBe(entities[0].id);
		expect(index.nameToId.get("naruto")).toBe(entities[1].id);
		expect(index.nameToId.get("sasuke")).toBe(entities[2].id);
	});

	test("should normalize names to lowercase", () => {
		const entity = createEntity({ name: "Lucy" });
		const index = buildIndex([entity]);

		expect(index.nameToId.get("LUCY")).toBeUndefined();
		expect(index.nameToId.get("lucy")).toBe(entity.id);
	});

	test("should index entities by group", () => {
		const entities = [
			createEntityWithGroup("Lucy", "characters"),
			createEntityWithGroup("Naruto", "characters"),
			createEntityWithGroup("Konoha", "locations"),
		];
		const index = buildIndex(entities);

		expect(index.groupIndex.get("characters")).toHaveLength(2);
		expect(index.groupIndex.get("locations")).toHaveLength(1);
		expect(index.groupIndex.get("characters")).toContain(entities[0].id);
		expect(index.groupIndex.get("characters")).toContain(entities[1].id);
	});

	test("should handle entities without groups", () => {
		const entities = [
			createEntity({ name: "Lucy" }),
			createEntityWithGroup("Naruto", "characters"),
		];
		const index = buildIndex(entities);

		expect(index.groupIndex.get("characters")?.length).toBe(1);
		expect(index.groupIndex.size).toBe(1);
	});

	test("should set version to 1", () => {
		const index = buildIndex([]);
		expect(index.version).toBe(1);
	});

	test("should set lastUpdated to current timestamp", () => {
		const before = Date.now();
		const index = buildIndex([]);
		const after = Date.now();

		expect(index.lastUpdated).toBeGreaterThanOrEqual(before);
		expect(index.lastUpdated).toBeLessThanOrEqual(after);
	});

	test("should index canonical names when present", () => {
		const entity = createEntity({ name: "Lucy" });
		(entity as any).canonical = "Heartfilia";

		const index = buildIndex([entity]);

		expect(index.canonicalToNames.get("heartfilia")).toContain("Lucy");
	});

	test("should handle multiple names for same canonical", () => {
		const entity1 = createEntity({ name: "Lucy" });
		(entity1 as any).canonical = "Heartfilia";

		const entity2 = createEntity({ name: "Lucina" });
		(entity2 as any).canonical = "Heartfilia";

		const index = buildIndex([entity1, entity2]);

		const names = index.canonicalToNames.get("heartfilia");
		expect(names).toHaveLength(2);
		expect(names).toContain("Lucy");
		expect(names).toContain("Lucina");
	});

	test("should handle large entity sets efficiently", () => {
		const entities = Array.from({ length: 1000 }, (_, i) =>
			createEntity({ name: `Entity${i}` })
		);

		const before = Date.now();
		const index = buildIndex(entities);
		const after = Date.now();

		expect(index.nameToId.size).toBe(1000);
		expect(after - before).toBeLessThan(1000); // Should be fast
	});
});

describe("IndexFile - saveIndex", () => {
	let mockVault: Vault;
	let testIndex: MasterMetadataIndex;

	beforeEach(() => {
		mockVault = createMockVault();
		testIndex = buildIndex([
			createEntity({ name: "Lucy" }),
			createEntityWithGroup("Naruto", "characters"),
		]);
	});

	test("should create new index file", async () => {
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(null);

		await saveIndex(mockVault, testIndex, ".metadata", "index.json");

		expect(mockVault.create).toHaveBeenCalled();
		const callArgs = (mockVault.create as jest.Mock).mock.calls[0];
		expect(callArgs[0]).toBe(".metadata/index.json");
	});

	test("should modify existing index file", async () => {
		const mockFile = createMockTFile();
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(mockFile);

		await saveIndex(mockVault, testIndex, ".metadata", "index.json");

		expect(mockVault.modify).toHaveBeenCalled();
	});

	test("should serialize Maps to arrays", async () => {
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(null);

		await saveIndex(mockVault, testIndex, ".metadata", "index.json");

		const jsonContent = (mockVault.create as jest.Mock).mock.calls[0][1];
		const parsed = JSON.parse(jsonContent);

		expect(Array.isArray(parsed.nameToId)).toBe(true);
		expect(Array.isArray(parsed.groupIndex)).toBe(true);
	});

	test("should include all index properties", async () => {
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(null);

		await saveIndex(mockVault, testIndex, ".metadata", "index.json");

		const jsonContent = (mockVault.create as jest.Mock).mock.calls[0][1];
		const parsed = JSON.parse(jsonContent);

		expect(parsed).toHaveProperty("nameToId");
		expect(parsed).toHaveProperty("groupIndex");
		expect(parsed).toHaveProperty("lastUpdated");
		expect(parsed).toHaveProperty("version");
	});

	test("should handle save errors", async () => {
		(mockVault.getFileByPath as jest.Mock).mockImplementation(() => {
			throw new Error("Vault error");
		});

		await expect(saveIndex(mockVault, testIndex, ".metadata", "index.json")).rejects.toThrow();
	});

	test("should format JSON with indentation", async () => {
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(null);

		await saveIndex(mockVault, testIndex, ".metadata", "index.json");

		const jsonContent = (mockVault.create as jest.Mock).mock.calls[0][1];
		expect(jsonContent).toContain("\n");
		expect(jsonContent).toMatch(/\s{2}/); // 2-space indentation
	});
});

describe("IndexFile - loadIndex", () => {
	let mockVault: Vault;

	beforeEach(() => {
		mockVault = createMockVault();
	});

	test("should load index from vault", async () => {
		const mockFile = createMockTFile();
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(mockFile);

		const indexData = {
			nameToId: [["lucy", "ent_1"]],
			groupIndex: [["characters", ["ent_1"]]],
			lastUpdated: Date.now(),
			version: 1,
		};
		(mockVault.read as jest.Mock).mockResolvedValue(JSON.stringify(indexData));

		const loaded = await loadIndex(mockVault, ".metadata", "index.json");

		expect(loaded).not.toBeNull();
		expect(loaded?.nameToId.get("lucy")).toBe("ent_1");
	});

	test("should return null for missing file", async () => {
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(null);

		const loaded = await loadIndex(mockVault, ".metadata", "index.json");

		expect(loaded).toBeNull();
	});

	test("should reconstruct Maps from arrays", async () => {
		const mockFile = createMockTFile();
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(mockFile);

		const indexData = {
			nameToId: [
				["lucy", "ent_1"],
				["naruto", "ent_2"],
			],
			groupIndex: [["characters", ["ent_1", "ent_2"]]],
			lastUpdated: Date.now(),
			version: 1,
		};
		(mockVault.read as jest.Mock).mockResolvedValue(JSON.stringify(indexData));

		const loaded = await loadIndex(mockVault, ".metadata", "index.json");

		expect(loaded?.nameToId instanceof Map).toBe(true);
		expect(loaded?.groupIndex instanceof Map).toBe(true);
		expect(loaded?.nameToId.size).toBe(2);
	});

	test("should use defaults for missing properties", async () => {
		const mockFile = createMockTFile();
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(mockFile);
		(mockVault.read as jest.Mock).mockResolvedValue("{}");

		const loaded = await loadIndex(mockVault, ".metadata", "index.json");

		expect(loaded?.nameToId.size).toBe(0);
		expect(loaded?.version).toBe(1);
		expect(loaded?.lastUpdated).toBeDefined();
	});

	test("should handle load errors gracefully", async () => {
		const mockFile = createMockTFile();
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(mockFile);
		(mockVault.read as jest.Mock).mockRejectedValue(new Error("Read failed"));

		const loaded = await loadIndex(mockVault, ".metadata", "index.json");

		expect(loaded).toBeNull();
	});

	test("should handle malformed JSON", async () => {
		const mockFile = createMockTFile();
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(mockFile);
		(mockVault.read as jest.Mock).mockResolvedValue("{ invalid json }");

		const loaded = await loadIndex(mockVault, ".metadata", "index.json");

		expect(loaded).toBeNull();
	});
});

describe("IndexFile - findEntityByName", () => {
	let index: MasterMetadataIndex;

	beforeEach(() => {
		const entities = [
			createEntity({ id: "ent_1", name: "Lucy" }),
			createEntity({ id: "ent_2", name: "Naruto" }),
		];
		index = buildIndex(entities);
	});

	test("should find entity by exact name", () => {
		const result = findEntityByName(index, "Lucy");
		expect(result).toBe("ent_1");
	});

	test("should find entity by lowercase name", () => {
		const result = findEntityByName(index, "lucy");
		expect(result).toBe("ent_1");
	});

	test("should find entity by uppercase name", () => {
		const result = findEntityByName(index, "LUCY");
		expect(result).toBe("ent_1");
	});

	test("should return null for non-existent entity", () => {
		const result = findEntityByName(index, "Sasuke");
		expect(result).toBeNull();
	});

	test("should handle empty index", () => {
		const emptyIndex = buildIndex([]);
		const result = findEntityByName(emptyIndex, "Lucy");
		expect(result).toBeNull();
	});

	test("should be case-insensitive", () => {
		const result1 = findEntityByName(index, "NaRuTo");
		const result2 = findEntityByName(index, "NARUTO");
		const result3 = findEntityByName(index, "naruto");

		expect(result1).toBe("ent_2");
		expect(result2).toBe("ent_2");
		expect(result3).toBe("ent_2");
	});
});

describe("IndexFile - getEntitiesByGroup", () => {
	let index: MasterMetadataIndex;

	beforeEach(() => {
		const entities = [
			createEntityWithGroup("Lucy", "characters"),
			createEntityWithGroup("Naruto", "characters"),
			createEntityWithGroup("Konoha", "locations"),
		];
		index = buildIndex(entities);
	});

	test("should get entities by group name", () => {
		const result = getEntitiesByGroup(index, "characters");
		expect(result).toHaveLength(2);
	});

	test("should return empty array for non-existent group", () => {
		const result = getEntitiesByGroup(index, "nonexistent");
		expect(result).toEqual([]);
	});

	test("should return entity IDs as array", () => {
		const result = getEntitiesByGroup(index, "characters");
		expect(Array.isArray(result)).toBe(true);
		result.forEach((id) => expect(typeof id).toBe("string"));
	});

	test("should handle group with single entity", () => {
		const result = getEntitiesByGroup(index, "locations");
		expect(result).toHaveLength(1);
	});

	test("should handle empty index", () => {
		const emptyIndex = buildIndex([]);
		const result = getEntitiesByGroup(emptyIndex, "characters");
		expect(result).toEqual([]);
	});

	test("should be case-sensitive", () => {
		const result1 = getEntitiesByGroup(index, "Characters");
		const result2 = getEntitiesByGroup(index, "characters");

		expect(result1).toEqual([]);
		expect(result2).toHaveLength(2);
	});
});

describe("IndexFile - Integration", () => {
	let mockVault: Vault;

	beforeEach(() => {
		mockVault = createMockVault();
	});

	test("should build, save, and load index correctly", async () => {
		const entities = [
			createEntity({ id: "ent_1", name: "Lucy" }),
			createEntity({ id: "ent_2", name: "Naruto", group: "characters" }),
		];

		// Build
		const built = buildIndex(entities);

		// Save
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(null);
		await saveIndex(mockVault, built, ".metadata", "index.json");

		// Extract saved JSON
		const savedJson = (mockVault.create as jest.Mock).mock.calls[0][1];

		// Load
		(mockVault.getFileByPath as jest.Mock).mockReturnValue(createMockTFile());
		(mockVault.read as jest.Mock).mockResolvedValue(savedJson);

		const loaded = await loadIndex(mockVault, ".metadata", "index.json");

		// Verify
		expect(loaded?.nameToId.get("lucy")).toBe("ent_1");
		expect(loaded?.groupIndex.get("characters")).toContain("ent_2");
	});

	test("should maintain index consistency across operations", () => {
		const entities = [
			createEntity({ id: "ent_1", name: "Lucy" }),
			createEntity({ id: "ent_2", name: "Naruto" }),
		];

		const index = buildIndex(entities);

		expect(findEntityByName(index, "Lucy")).toBe("ent_1");
		expect(findEntityByName(index, "Naruto")).toBe("ent_2");
		expect(findEntityByName(index, "Sasuke")).toBeNull();
	});
});
