/**
 * Unit tests for ID generator
 * Tests deterministic ID generation, validation, and parsing
 */

import {
	hashTerm,
	generateEntityId,
	isValidEntityId,
	getHashFromId,
	getSeqFromId,
} from "../idGenerator.ts";

describe("idGenerator", () => {
	describe("hashTerm", () => {
		it("should generate a 6-character hash", () => {
			const hash = hashTerm("test");
			expect(hash).toHaveLength(6);
			expect(/^[a-f0-9]{6}$/.test(hash)).toBe(true);
		});

		it("should be case-insensitive", () => {
			const hash1 = hashTerm("Test");
			const hash2 = hashTerm("test");
			const hash3 = hashTerm("TEST");
			expect(hash1).toBe(hash2);
			expect(hash2).toBe(hash3);
		});

		it("should be deterministic", () => {
			const hash1 = hashTerm("elephant");
			const hash2 = hashTerm("elephant");
			expect(hash1).toBe(hash2);
		});

		it("should differ for different terms", () => {
			const hash1 = hashTerm("apple");
			const hash2 = hashTerm("banana");
			expect(hash1).not.toBe(hash2);
		});

		it("should handle empty string", () => {
			const hash = hashTerm("");
			expect(hash).toHaveLength(6);
		});

		it("should handle long strings", () => {
			const hash = hashTerm("a".repeat(1000));
			expect(hash).toHaveLength(6);
		});

		it("should handle special characters", () => {
			const hash1 = hashTerm("test@#$");
			const hash2 = hashTerm("test@#$");
			expect(hash1).toBe(hash2);
			expect(hash1).toHaveLength(6);
		});
	});

	describe("generateEntityId", () => {
		it("should generate valid entity ID format", () => {
			const id = generateEntityId("test");
			expect(/^ent_[a-f0-9]{6}_\d{4}$/.test(id)).toBe(true);
		});

		it("should be deterministic for same term and timestamp", () => {
			const timestamp = 1609459200000;
			const id1 = generateEntityId("test", timestamp);
			const id2 = generateEntityId("test", timestamp);
			expect(id1).toBe(id2);
		});

		it("should vary with different timestamps", () => {
			const id1 = generateEntityId("test", 1000);
			const id2 = generateEntityId("test", 2000);
			expect(id1).not.toBe(id2);
		});

		it("should use Date.now() when timestamp not provided", () => {
			const id = generateEntityId("test");
			expect(/^ent_[a-f0-9]{6}_\d{4}$/.test(id)).toBe(true);
		});

		it("should handle same term with different cases", () => {
			const timestamp = 1609459200000;
			const id1 = generateEntityId("Test", timestamp);
			const id2 = generateEntityId("test", timestamp);
			expect(id1).toBe(id2);
		});

		it("should produce consistent sequence number for same term", () => {
			const ids = [
				generateEntityId("term", 15234),
				generateEntityId("term", 25234),
				generateEntityId("term", 35234),
			];
			// All should have 5234 as sequence (timestamp % 10000)
			expect(ids[0]?.endsWith("_5234")).toBe(true);
			expect(ids[1]?.endsWith("_5234")).toBe(true);
			expect(ids[2]?.endsWith("_5234")).toBe(true);
		});
	});

	describe("isValidEntityId", () => {
		it("should validate correct entity ID format", () => {
			expect(isValidEntityId("ent_abc123_0001")).toBe(true);
			expect(isValidEntityId("ent_000000_0000")).toBe(true);
			expect(isValidEntityId("ent_ffffff_9999")).toBe(true);
		});

		it("should reject invalid formats", () => {
			expect(isValidEntityId("ent_123_001")).toBe(false); // Wrong hash length
			expect(isValidEntityId("ent_abcdefg_0001")).toBe(false); // Hash too long
			expect(isValidEntityId("ent_abc123_00001")).toBe(false); // Seq too long
			expect(isValidEntityId("ent_abc123")).toBe(false); // Missing seq
			expect(isValidEntityId("abc123_0001")).toBe(false); // Missing prefix
			expect(isValidEntityId("ent_ABCDEF_0001")).toBe(false); // Uppercase hash
			expect(isValidEntityId("ent_abc123_abcd")).toBe(false); // Non-numeric seq
		});

		it("should reject empty string", () => {
			expect(isValidEntityId("")).toBe(false);
		});

		it("should reject null-like strings", () => {
			expect(isValidEntityId("null")).toBe(false);
			expect(isValidEntityId("undefined")).toBe(false);
		});
	});

	describe("getHashFromId", () => {
		it("should extract hash from valid ID", () => {
			const hash = getHashFromId("ent_abc123_0001");
			expect(hash).toBe("abc123");
		});

		it("should handle different hashes", () => {
			expect(getHashFromId("ent_000000_0001")).toBe("000000");
			expect(getHashFromId("ent_ffffff_0001")).toBe("ffffff");
		});

		it("should return empty string for invalid ID", () => {
			expect(getHashFromId("invalid")).toBe("");
			expect(getHashFromId("")).toBe("");
			expect(getHashFromId("ent_123_0001")).toBe("");
		});
	});

	describe("getSeqFromId", () => {
		it("should extract sequence from valid ID", () => {
			const seq = getSeqFromId("ent_abc123_0001");
			expect(seq).toBe("0001");
		});

		it("should handle different sequences", () => {
			expect(getSeqFromId("ent_abc123_0000")).toBe("0000");
			expect(getSeqFromId("ent_abc123_9999")).toBe("9999");
		});

		it("should return empty string for invalid ID", () => {
			expect(getSeqFromId("invalid")).toBe("");
			expect(getSeqFromId("")).toBe("");
			expect(getSeqFromId("ent_abc123_00001")).toBe("");
		});
	});

	describe("Determinism and Collision Avoidance", () => {
		it("should not collide for different terms", () => {
			const ids = new Set([
				generateEntityId("apple", 12345),
				generateEntityId("banana", 12345),
				generateEntityId("cherry", 12345),
				generateEntityId("date", 12345),
				generateEntityId("elderberry", 12345),
			]);
			expect(ids.size).toBe(5);
		});

		it("should handle entity name variations", () => {
			const id1 = generateEntityId("Metadata Organizer", 54321);
			const id2 = generateEntityId("metadata organizer", 54321);
			const id3 = generateEntityId("METADATA ORGANIZER", 54321);
			expect(id1).toBe(id2);
			expect(id2).toBe(id3);
		});

		it("should produce same ID on rescan of same entity", () => {
			const timestamp = 99999;
			const term = "SystemDesign";
			const id1 = generateEntityId(term, timestamp);
			const id2 = generateEntityId(term, timestamp);
			expect(id1).toBe(id2);
		});
	});
});
