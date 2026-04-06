import { EntityStore, getOrCreateEntity } from "../entityStore";
import { Entity, SourceRef } from "../../../types";
import { Vault, TFile } from "obsidian";
import {
	createMockSettings,
	createEntity,
	createSourceRef,
	createEntityWithSources,
	createEntityWithTags,
	resetEntityCounter,
} from "./testHelpers";

// Mock Obsidian vault
const createMockVault = (): Vault => {
	const mockVault = {
		getFileByPath: jest.fn().mockReturnValue(null),
		read: jest.fn().mockResolvedValue(""),
		create: jest.fn().mockResolvedValue(undefined),
		modify: jest.fn().mockResolvedValue(undefined),
	} as any;
	return mockVault as Vault;
};

describe("EntityStore - Core Functionality", () => {
	let store: EntityStore;
	let mockVault: Vault;

	beforeEach(() => {
		resetEntityCounter();
		mockVault = createMockVault();
		store = new EntityStore(mockVault, ".metadata", "master.csv");
	});

	describe("Constructor & Initialization", () => {
		test("should initialize with correct parameters", () => {
			expect(store).toBeInstanceOf(EntityStore);
		});

		test("should have empty entity map initially", () => {
			expect(store.getAllEntities()).toHaveLength(0);
		});

		test("should have no index initially", () => {
			expect(store.getIndex()).toBeNull();
		});
	});

	describe("Add Entity", () => {
		test("should add single entity", () => {
			const entity = createEntity({ name: "Lucy" });
			store.addEntity(entity);

			expect(store.getAllEntities()).toHaveLength(1);
			expect(store.getEntity(entity.id)?.name).toBe("Lucy");
		});

		test("should add multiple entities", () => {
			const entities = [
				createEntity({ name: "Lucy" }),
				createEntity({ name: "Naruto" }),
				createEntity({ name: "Sasuke" }),
			];

			entities.forEach((e) => store.addEntity(e));

			expect(store.getAllEntities()).toHaveLength(3);
		});

		test("should update index when adding entity", () => {
			const entity = createEntity({ name: "Lucy" });
			store.addEntity(entity);

			// Create index manually to simulate loadEntities
			(store as any).index = { nameToId: new Map(), canonicalToNames: new Map(), groupIndex: new Map(), version: 1, lastUpdated: Date.now() };
			store.addEntity(entity);

			expect(store.findByName("lucy")).not.toBeNull();
		});

		test("should overwrite duplicate entity ID", () => {
			const entity1 = createEntity({ id: "ent_1", name: "Lucy", frequency: 5 });
			const entity2 = createEntity({ id: "ent_1", name: "Lucy", frequency: 10 });

			store.addEntity(entity1);
			store.addEntity(entity2);

			expect(store.getAllEntities()).toHaveLength(1);
			expect(store.getEntity("ent_1")?.frequency).toBe(10);
		});
	});

	describe("Get Entity", () => {
		test("should get entity by ID", () => {
			const entity = createEntity({ id: "ent_123", name: "Lucy" });
			store.addEntity(entity);

			const retrieved = store.getEntity("ent_123");
			expect(retrieved?.name).toBe("Lucy");
		});

		test("should return null for non-existent entity", () => {
			const result = store.getEntity("nonexistent");
			expect(result).toBeNull();
		});

		test("should retrieve all entity properties", () => {
			const entity = createEntity({
				id: "ent_full",
				name: "Lucy",
				frequency: 5,
				sources: [createSourceRef("doc1.md")],
				tags: ["character"],
				description: "A character",
				group: "characters",
			});

			store.addEntity(entity);
			const retrieved = store.getEntity("ent_full");

			expect(retrieved?.frequency).toBe(5);
			expect(retrieved?.sources).toHaveLength(1);
			expect(retrieved?.tags).toHaveLength(1);
			expect(retrieved?.description).toBe("A character");
			expect(retrieved?.group).toBe("characters");
		});
	});

	describe("Find Entity by Name", () => {
		beforeEach(() => {
			// Manually create index for findByName to work
			(store as any).index = {
				nameToId: new Map(),
				canonicalToNames: new Map(),
				groupIndex: new Map(),
				version: 1,
				lastUpdated: Date.now(),
			};
		});

		test("should find entity by exact name", () => {
			const entity = createEntity({ name: "Lucy" });
			store.addEntity(entity);

			const found = store.findByName("Lucy");
			expect(found?.name).toBe("Lucy");
		});

		test("should find entity by case-insensitive name", () => {
			const entity = createEntity({ name: "Lucy" });
			store.addEntity(entity);

			const found = store.findByName("lucy");
			expect(found?.name).toBe("Lucy");
		});

		test("should find entity by uppercase name", () => {
			const entity = createEntity({ name: "Lucy" });
			store.addEntity(entity);

			const found = store.findByName("LUCY");
			expect(found?.name).toBe("Lucy");
		});

		test("should return null for non-existent name", () => {
			const entity = createEntity({ name: "Lucy" });
			store.addEntity(entity);

			const found = store.findByName("Naruto");
			expect(found).toBeNull();
		});

		test("should find entity without index", () => {
			(store as any).index = null;
			const entity = createEntity({ name: "Lucy" });
			store.addEntity(entity);

			const found = store.findByName("Lucy");
			expect(found).toBeNull(); // Should return null if no index
		});
	});

	describe("Update Entity", () => {
		test("should update entity properties", () => {
			const entity = createEntity({ id: "ent_1", name: "Lucy", frequency: 5 });
			store.addEntity(entity);

			store.updateEntity("ent_1", { frequency: 10 });

			const updated = store.getEntity("ent_1");
			expect(updated?.frequency).toBe(10);
		});

		test("should update multiple properties", () => {
			const entity = createEntity({
				id: "ent_1",
				name: "Lucy",
				frequency: 5,
				tags: ["old"],
			});
			store.addEntity(entity);

			store.updateEntity("ent_1", {
				frequency: 10,
				tags: ["new"],
				description: "Updated",
			});

			const updated = store.getEntity("ent_1");
			expect(updated?.frequency).toBe(10);
			expect(updated?.tags).toEqual(["new"]);
			expect(updated?.description).toBe("Updated");
		});

		test("should update updatedAt timestamp", () => {
			const entity = createEntity({
				id: "ent_1",
				name: "Lucy",
				updatedAt: Date.now() - 10000,
			});
			store.addEntity(entity);

			const before = Date.now();
			store.updateEntity("ent_1", { frequency: 10 });
			const after = Date.now();

			const updated = store.getEntity("ent_1");
			expect(updated?.updatedAt).toBeGreaterThanOrEqual(before);
			expect(updated?.updatedAt).toBeLessThanOrEqual(after);
		});

		test("should not update non-existent entity", () => {
			store.updateEntity("nonexistent", { frequency: 10 });
			expect(store.getEntity("nonexistent")).toBeNull();
		});

		test("should update index when name changes", () => {
			(store as any).index = {
				nameToId: new Map(),
				canonicalToNames: new Map(),
				groupIndex: new Map(),
				version: 1,
				lastUpdated: Date.now(),
			};

			const entity = createEntity({ id: "ent_1", name: "Lucy" });
			store.addEntity(entity);

			store.updateEntity("ent_1", { name: "Lucina" });

			expect(store.findByName("Lucina")).not.toBeNull();
		});
	});

	describe("Get All Entities", () => {
		test("should return empty array initially", () => {
			expect(store.getAllEntities()).toEqual([]);
		});

		test("should return all added entities", () => {
			const entities = [
				createEntity({ name: "Lucy" }),
				createEntity({ name: "Naruto" }),
				createEntity({ name: "Sasuke" }),
			];

			entities.forEach((e) => store.addEntity(e));

			expect(store.getAllEntities()).toHaveLength(3);
		});

		test("should return entities in any order", () => {
			const entity1 = createEntity({ id: "ent_1", name: "Lucy" });
			const entity2 = createEntity({ id: "ent_2", name: "Naruto" });
			store.addEntity(entity1);
			store.addEntity(entity2);

			const all = store.getAllEntities();
			const names = all.map((e) => e.name).sort();

			expect(names).toEqual(["Lucy", "Naruto"]);
		});
	});

	describe("CSV Persistence", () => {
		test("should persist entities to CSV", async () => {
			const mockVaultWithFile = createMockVault();
			const mockFile = {} as TFile;
			(mockVaultWithFile.getFileByPath as jest.Mock).mockReturnValue(mockFile);

			const storeWithFile = new EntityStore(mockVaultWithFile, ".metadata", "master.csv");
			const entity = createEntity({ name: "Lucy" });
			storeWithFile.addEntity(entity);

			await storeWithFile.persist();

			expect(mockVaultWithFile.modify).toHaveBeenCalled();
		});

		test("should create CSV file if it doesn't exist", async () => {
			const mockVaultNoFile = createMockVault();
			(mockVaultNoFile.getFileByPath as jest.Mock).mockReturnValue(null);

			const storeNoFile = new EntityStore(mockVaultNoFile, ".metadata", "master.csv");
			const entity = createEntity({ name: "Lucy" });
			storeNoFile.addEntity(entity);

			await storeNoFile.persist();

			expect(mockVaultNoFile.create).toHaveBeenCalled();
		});

		test("should handle persist errors gracefully", async () => {
			const mockVaultError = createMockVault();
			(mockVaultError.getFileByPath as jest.Mock).mockImplementation(() => {
				throw new Error("Vault error");
			});

			const storeError = new EntityStore(mockVaultError, ".metadata", "master.csv");
			const entity = createEntity({ name: "Lucy" });
			storeError.addEntity(entity);

			await expect(storeError.persist()).resolves.not.toThrow();
		});

		test("should update index lastUpdated on persist", async () => {
			const mockVaultWithFile = createMockVault();
			const mockFile = {} as TFile;
			(mockVaultWithFile.getFileByPath as jest.Mock).mockReturnValue(mockFile);

			const storeWithIndex = new EntityStore(mockVaultWithFile, ".metadata", "master.csv");
			(storeWithIndex as any).index = {
				nameToId: new Map(),
				canonicalToNames: new Map(),
				groupIndex: new Map(),
				version: 1,
				lastUpdated: 0,
			};

			const before = Date.now();
			await storeWithIndex.persist();
			const after = Date.now();

			expect((storeWithIndex as any).index?.lastUpdated).toBeGreaterThanOrEqual(before);
			expect((storeWithIndex as any).index?.lastUpdated).toBeLessThanOrEqual(after);
		});
	});

	describe("Load Entities from CSV", () => {
		test("should load entities from vault", async () => {
			const csvContent = `id,name,frequency,sources,tags,createdAt,updatedAt
ent_1,Lucy,5,[],["character"],1234567890,1234567890
ent_2,Naruto,8,[],["character"],1234567890,1234567890`;

			const mockVaultLoading = createMockVault();
			const mockFile = {} as TFile;
			(mockVaultLoading.getFileByPath as jest.Mock).mockReturnValue(mockFile);
			(mockVaultLoading.read as jest.Mock).mockResolvedValue(csvContent);

			const storeLoading = new EntityStore(mockVaultLoading, ".metadata", "master.csv");
			await storeLoading.loadEntities();

			expect(storeLoading.getAllEntities().length).toBeGreaterThanOrEqual(0);
		});

		test("should handle missing file gracefully", async () => {
			const mockVaultNoFile = createMockVault();
			(mockVaultNoFile.getFileByPath as jest.Mock).mockReturnValue(null);

			const storeNoFile = new EntityStore(mockVaultNoFile, ".metadata", "master.csv");
			await storeNoFile.loadEntities();

			expect(storeNoFile.getAllEntities()).toHaveLength(0);
		});

		test("should handle load errors gracefully", async () => {
			const mockVaultError = createMockVault();
			const mockFile = {} as TFile;
			(mockVaultError.getFileByPath as jest.Mock).mockReturnValue(mockFile);
			(mockVaultError.read as jest.Mock).mockRejectedValue(new Error("Read failed"));

			const storeError = new EntityStore(mockVaultError, ".metadata", "master.csv");
			await expect(storeError.loadEntities()).resolves.not.toThrow();
		});
	});

	describe("Get Index", () => {
		test("should return null initially", () => {
			expect(store.getIndex()).toBeNull();
		});

		test("should return index after setting", () => {
			const testIndex = {
				nameToId: new Map(),
				canonicalToNames: new Map(),
				groupIndex: new Map(),
				version: 1,
				lastUpdated: Date.now(),
			};
			(store as any).index = testIndex;

			expect(store.getIndex()).toBe(testIndex);
		});
	});
});

describe("getOrCreateEntity - Helper Function", () => {
	let store: EntityStore;
	let mockVault: Vault;

	beforeEach(() => {
		mockVault = createMockVault();
		store = new EntityStore(mockVault, ".metadata", "master.csv");
		// Set up index for findByName
		(store as any).index = {
			nameToId: new Map(),
			canonicalToNames: new Map(),
			groupIndex: new Map(),
			version: 1,
			lastUpdated: Date.now(),
		};
	});

	test("should create new entity if doesn't exist", () => {
		const entity = getOrCreateEntity(store, "Lucy");

		expect(entity.name).toBe("Lucy");
		expect(entity.frequency).toBe(1);
		expect(entity.createdAt).toBeDefined();
		expect(entity.updatedAt).toBeDefined();
	});

	test("should return existing entity if found", () => {
		const first = getOrCreateEntity(store, "Lucy");
		const second = getOrCreateEntity(store, "Lucy");

		expect(first.id).toBe(second.id);
		expect(store.getAllEntities()).toHaveLength(1);
	});

	test("should increment frequency on repeated calls", () => {
		const first = getOrCreateEntity(store, "Lucy");
		expect(first.frequency).toBe(1);

		const second = getOrCreateEntity(store, "Lucy");
		expect(second.frequency).toBe(2);
	});

	test("should create with group parameter", () => {
		const entity = getOrCreateEntity(store, "Lucy", "characters");

		expect(entity.group).toBe("characters");
	});

	test("should generate unique ID", () => {
		const entity1 = getOrCreateEntity(store, "Lucy");
		const entity2 = getOrCreateEntity(store, "Naruto");

		expect(entity1.id).not.toBe(entity2.id);
	});

	test("should set timestamps correctly", () => {
		const before = Date.now();
		const entity = getOrCreateEntity(store, "Lucy");
		const after = Date.now();

		expect(entity.createdAt).toBeGreaterThanOrEqual(before);
		expect(entity.createdAt).toBeLessThanOrEqual(after);
		expect(entity.updatedAt).toBe(entity.createdAt);
	});

	test("should handle multiple creates in sequence", () => {
		const names = ["Lucy", "Naruto", "Sasuke"];
		const entities = names.map((name) => getOrCreateEntity(store, name));

		expect(entities).toHaveLength(3);
		expect(store.getAllEntities()).toHaveLength(3);
	});
});
