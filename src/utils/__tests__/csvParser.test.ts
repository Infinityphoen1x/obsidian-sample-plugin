/**
 * Unit tests for CSV parser
 * Tests CSV parsing and serialization with edge cases
 */

import { parseCSV, serializeCSV } from "../../utils/csvParser.ts";
import { Entity } from "../../types.ts";

describe("csvParser", () => {
	const sampleEntity: Entity = {
		id: "ent_abc123_0001",
		name: "TestEntity",
		canonical: "test-entity",
		frequency: 5,
		sources: [
			{
				document: "docs/test.md",
				lineNumbers: [10, 20, 30],
			},
		],
		group: "TestGroup",
		tags: ["tag1", "tag2"],
		createdAt: 1609459200000,
		updatedAt: 1609459200001,
		description: "Test description",
	};

	describe("serializeCSV", () => {
		it("should serialize a single entity", () => {
			const csv = serializeCSV([sampleEntity]);
			expect(csv).toContain("ent_abc123_0001");
			expect(csv).toContain("TestEntity");
		});

		it("should include CSV headers", () => {
			const csv = serializeCSV([sampleEntity]);
			const lines = csv.split("\n");
			expect(lines[0]).toContain("id");
			expect(lines[0]).toContain("name");
			expect(lines[0]).toContain("frequency");
		});

		it("should serialize multiple entities", () => {
			const entities: Entity[] = [sampleEntity, { ...sampleEntity, id: "ent_def456_0002", name: "Entity2" }];
			const csv = serializeCSV(entities);
			expect(csv).toContain("Entity2");
			expect(csv).toContain("ent_def456_0002");
		});

		it("should handle entities with special characters in name", () => {
			const entity: Entity = { ...sampleEntity, name: 'Entity "With" Quotes' };
			const csv = serializeCSV([entity]);
			expect(csv).toContain("Entity");
		});

		it("should handle entities with commas in fields", () => {
			const entity: Entity = { ...sampleEntity, name: "Entity, With, Commas" };
			const csv = serializeCSV([entity]);
			const parsed = parseCSV(csv);
			expect(parsed[0].name).toBe("Entity, With, Commas");
		});

		it("should serialize multiple tags separated by pipe", () => {
			const entity: Entity = { ...sampleEntity, tags: ["tag1", "tag2", "tag3"] };
			const csv = serializeCSV([entity]);
			expect(csv).toContain("tag1");
			expect(csv).toContain("tag2");
		});

		it("should serialize multiple sources separated by pipe", () => {
			const entity: Entity = {
				...sampleEntity,
				sources: [
					{ document: "file1.md", lineNumbers: [1, 2] },
					{ document: "file2.md", lineNumbers: [3, 4] },
				],
			};
			const csv = serializeCSV([entity]);
			expect(csv).toContain("file1.md");
			expect(csv).toContain("file2.md");
		});

		it("should handle empty arrays", () => {
			const csv = serializeCSV([]);
			const lines = csv.split("\n");
			expect(lines[0]).toContain("id"); // Should still have headers
		});

		it("should handle null canonical", () => {
			const entity: Entity = { ...sampleEntity, canonical: undefined };
			const csv = serializeCSV([entity]);
			const parsed = parseCSV(csv);
			expect(parsed[0].canonical).toBeUndefined();
		});

		it("should handle null group", () => {
			const entity: Entity = { ...sampleEntity, group: undefined };
			const csv = serializeCSV([entity]);
			const parsed = parseCSV(csv);
			expect(parsed[0].group).toBeUndefined();
		});

		it("should handle null description", () => {
			const entity: Entity = { ...sampleEntity, description: undefined };
			const csv = serializeCSV([entity]);
			const parsed = parseCSV(csv);
			expect(parsed[0].description).toBeUndefined();
		});

		it("should preserve timestamps", () => {
			const entity: Entity = {
				...sampleEntity,
				createdAt: 1609459200000,
				updatedAt: 1609459300000,
			};
			const csv = serializeCSV([entity]);
			const parsed = parseCSV(csv);
			expect(parsed[0].createdAt).toBe(1609459200000);
			expect(parsed[0].updatedAt).toBe(1609459300000);
		});
	});

	describe("parseCSV", () => {
		it("should parse serialized CSV back to entities", () => {
			const csv = serializeCSV([sampleEntity]);
			const parsed = parseCSV(csv);
			expect(parsed.length).toBe(1);
			expect(parsed[0].id).toBe(sampleEntity.id);
			expect(parsed[0].name).toBe(sampleEntity.name);
		});

		it("should parse multiple entities", () => {
			const entities: Entity[] = [
				sampleEntity,
				{ ...sampleEntity, id: "ent_xyz789_0003", name: "Entity3" },
			];
			const csv = serializeCSV(entities);
			const parsed = parseCSV(csv);
			expect(parsed.length).toBe(2);
		});

		it("should handle quoted fields", () => {
			const csv = `id,name,canonical,frequency,group,tags,sources,createdAt,updatedAt
"ent_test_0001","Test Entity","test","5","","tag1|tag2","docs/test.md:1,2,3","1609459200000","1609459200001"`;
			const parsed = parseCSV(csv);
			expect(parsed.length).toBe(1);
			expect(parsed[0].name).toBe("Test Entity");
		});

		it("should handle empty tags", () => {
			const entity: Entity = { ...sampleEntity, tags: [] };
			const csv = serializeCSV([entity]);
			const parsed = parseCSV(csv);
			expect(parsed[0].tags).toEqual([]);
		});

		it("should handle empty sources", () => {
			const entity: Entity = { ...sampleEntity, sources: [] };
			const csv = serializeCSV([entity]);
			const parsed = parseCSV(csv);
			expect(parsed[0].sources).toEqual([]);
		});

		it("should skip empty lines", () => {
			const csv = `id,name,canonical,frequency,group,tags,sources,createdAt,updatedAt
"ent_test1_0001","Entity1","","0","","","","0","0"

"ent_test2_0001","Entity2","","0","","","","0","0"`;
			const parsed = parseCSV(csv);
			expect(parsed.length).toBe(2);
		});

		it("should handle empty CSV", () => {
			const parsed = parseCSV("");
			expect(parsed).toEqual([]);
		});

		it("should handle header-only CSV", () => {
			const csv = "id,name,canonical,frequency,group,tags,sources,createdAt,updatedAt";
			const parsed = parseCSV(csv);
			expect(parsed).toEqual([]);
		});

		it("should handle missing optional fields", () => {
			const csv = `id,name,canonical,frequency,group,tags,sources,createdAt,updatedAt
"ent_test_0001","Test","","5","","","","","";`;
			const parsed = parseCSV(csv);
			expect(parsed[0].name).toBe("Test");
			expect(parsed[0].canonical).toBeUndefined();
			expect(parsed[0].group).toBeUndefined();
		});

		it("should handle line numbers with multiple entries", () => {
			const entity: Entity = {
				...sampleEntity,
				sources: [{ document: "test.md", lineNumbers: [1, 5, 10, 15, 20] }],
			};
			const csv = serializeCSV([entity]);
			const parsed = parseCSV(csv);
			expect(parsed[0].sources[0].lineNumbers).toEqual([1, 5, 10, 15, 20]);
		});
	});

	describe("Round-trip conversion", () => {
		it("should preserve entity data through serialize/parse cycle", () => {
			const original = sampleEntity;
			const csv = serializeCSV([original]);
			const parsed = parseCSV(csv);
			const result = parsed[0];

			expect(result.id).toBe(original.id);
			expect(result.name).toBe(original.name);
			expect(result.canonical).toBe(original.canonical);
			expect(result.frequency).toBe(original.frequency);
			expect(result.group).toBe(original.group);
			expect(result.tags).toEqual(original.tags);
			expect(result.createdAt).toBe(original.createdAt);
			expect(result.updatedAt).toBe(original.updatedAt);
		});

		it("should handle complex entities with multiple sources and tags", () => {
			const complex: Entity = {
				id: "ent_complex_0001",
				name: "Complex Entity",
				canonical: "complex-entity",
				frequency: 100,
				sources: [
					{ document: "file1.md", lineNumbers: [1, 2, 3] },
					{ document: "file2.md", lineNumbers: [10, 20] },
					{ document: "file3.md", lineNumbers: [5] },
				],
				group: "ComplexGroup",
				tags: ["important", "research", "draft"],
				createdAt: 1000000000000,
				updatedAt: 2000000000000,
			};

			const csv = serializeCSV([complex]);
			const parsed = parseCSV(csv);
			const result = parsed[0];

			expect(result.id).toBe(complex.id);
			expect(result.sources.length).toBe(3);
			expect(result.tags.length).toBe(3);
		});

		it("should handle entities with special characters", () => {
			const special: Entity = {
				...sampleEntity,
				id: "ent_special_0001",
				name: 'Entity "With" Special <Chars> & More',
				canonical: "entity-with-special",
				group: "Group (With) [Brackets]",
				tags: ['tag"with"quotes', "tag|with|pipes"],
			};

			const csv = serializeCSV([special]);
			const parsed = parseCSV(csv);
			const result = parsed[0];

			expect(result.name).toContain('With');
			expect(result.group).toContain('Brackets');
		});

		it("should handle large entity lists", () => {
			const largeList: Entity[] = Array.from({ length: 1000 }, (_, i) => ({
				...sampleEntity,
				id: `ent_large_${String(i).padStart(4, "0")}`,
				name: `Entity${i}`,
			}));

			const csv = serializeCSV(largeList);
			const parsed = parseCSV(csv);

			expect(parsed.length).toBe(1000);
			expect(parsed[0]?.name).toBe("Entity0");
			expect(parsed[999]?.name).toBe("Entity999");
		});
	});
});
