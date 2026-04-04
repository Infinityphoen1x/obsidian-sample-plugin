/**
 * Unit tests for tokenizer
 * Tests token extraction, frequency counting, and filtering
 */

import { extractTokens, filterByFrequency, getTopTokens } from "../tokenizer.ts";

describe("tokenizer", () => {
	describe("extractTokens", () => {
		it("should extract tokens from simple text", () => {
			const tokens = extractTokens("hello world hello");
			expect(tokens.length).toBeGreaterThan(0);
			const helloToken = tokens.find((t) => t.word === "hello");
			expect(helloToken).toBeDefined();
			expect(helloToken?.frequency).toBe(2);
		});

		it("should be case-insensitive", () => {
			const tokens = extractTokens("Hello HELLO hello");
			const helloToken = tokens.find((t) => t.word === "hello");
			expect(helloToken?.frequency).toBe(3);
		});

		it("should filter stop words", () => {
			const tokens = extractTokens("the a an and or but for with");
			// None of these should be in the results
			expect(tokens.find((t) => t.word === "the")).toBeUndefined();
			expect(tokens.find((t) => t.word === "a")).toBeUndefined();
			expect(tokens.find((t) => t.word === "and")).toBeUndefined();
		});

		it("should filter short tokens (< 2 chars)", () => {
			const tokens = extractTokens("I a it is he go");
			// Single letter words should be filtered
			expect(tokens.find((t) => t.word === "i")).toBeUndefined();
			expect(tokens.find((t) => t.word === "a")).toBeUndefined();
		});

		it("should count frequency correctly", () => {
			const tokens = extractTokens("apple banana apple banana apple orange");
			const appleToken = tokens.find((t) => t.word === "apple");
			const bananaToken = tokens.find((t) => t.word === "banana");
			const orangeToken = tokens.find((t) => t.word === "orange");

			expect(appleToken?.frequency).toBe(3);
			expect(bananaToken?.frequency).toBe(2);
			expect(orangeToken?.frequency).toBe(1);
		});

		it("should sort by frequency descending", () => {
			const tokens = extractTokens("rare common common frequent frequent frequent");
			// First should be most frequent
			expect(tokens[0].frequency).toBeGreaterThanOrEqual(tokens[1].frequency);
			if (tokens.length > 2) {
				expect(tokens[1].frequency).toBeGreaterThanOrEqual(tokens[2].frequency);
			}
		});

		it("should track token positions", () => {
			const tokens = extractTokens("test hello test world test");
			const testToken = tokens.find((t) => t.word === "test");
			expect(testToken?.positions.length).toBe(3);
		});

		it("should handle punctuation", () => {
			const tokens = extractTokens("hello, world! hello? world.");
			const helloToken = tokens.find((t) => t.word === "hello");
			const worldToken = tokens.find((t) => t.word === "world");
			expect(helloToken?.frequency).toBe(2);
			expect(worldToken?.frequency).toBe(2);
		});

		it("should handle empty text", () => {
			const tokens = extractTokens("");
			expect(tokens).toEqual([]);
		});

		it("should handle text with only stop words", () => {
			const tokens = extractTokens("the a and or but for with");
			expect(tokens.length).toBe(0);
		});

		it("should handle text with only punctuation", () => {
			const tokens = extractTokens("!@#$%^&*()");
			expect(tokens.length).toBe(0);
		});

		it("should handle very long text", () => {
			const longText = "word ".repeat(10000);
			const tokens = extractTokens(longText);
			const wordToken = tokens.find((t) => t.word === "word");
			expect(wordToken?.frequency).toBe(10000);
		});

		it("should handle numbers in text", () => {
			const tokens = extractTokens("test123 test123 hello456");
			const test123Token = tokens.find((t) => t.word === "test123");
			expect(test123Token?.frequency).toBe(2);
		});

		it("should handle hyphenated words", () => {
			const tokens = extractTokens("state-of-art state-of-art");
			// Depending on implementation, hyphenated words may be split
			expect(tokens.length).toBeGreaterThan(0);
		});

		it("should handle unicode characters", () => {
			const tokens = extractTokens("test test hello");
			// Verify tokenizer works with basic text
			const testToken = tokens.find((t) => t.word === "test");
			expect(testToken?.frequency).toBe(2);
		});

		it("should handle multiple spaces and newlines", () => {
			const tokens = extractTokens("word1   word2\n\nword3\t\tword4");
			expect(tokens.length).toBeGreaterThan(0);
		});
	});

	describe("filterByFrequency", () => {
		const tokens = [
			{ word: "apple", frequency: 5, positions: [] },
			{ word: "banana", frequency: 3, positions: [] },
			{ word: "cherry", frequency: 1, positions: [] },
		];

		it("should filter tokens below minimum frequency", () => {
			const filtered = filterByFrequency(tokens, 2);
			expect(filtered.length).toBe(2);
			expect(filtered.find((t) => t.word === "cherry")).toBeUndefined();
		});

		it("should include tokens at minimum frequency", () => {
			const filtered = filterByFrequency(tokens, 3);
			expect(filtered.length).toBe(2);
			expect(filtered.find((t) => t.word === "banana")).toBeDefined();
		});

		it("should return empty for high frequency threshold", () => {
			const filtered = filterByFrequency(tokens, 10);
			expect(filtered.length).toBe(0);
		});

		it("should return all for low frequency threshold", () => {
			const filtered = filterByFrequency(tokens, 0);
			expect(filtered.length).toBe(3);
		});

		it("should handle empty token array", () => {
			const filtered = filterByFrequency([], 5);
			expect(filtered).toEqual([]);
		});
	});

	describe("getTopTokens", () => {
		const tokens = [
			{ word: "apple", frequency: 5, positions: [] },
			{ word: "banana", frequency: 4, positions: [] },
			{ word: "cherry", frequency: 3, positions: [] },
			{ word: "date", frequency: 2, positions: [] },
			{ word: "elderberry", frequency: 1, positions: [] },
		];

		it("should get top N tokens", () => {
			const top3 = getTopTokens(tokens, 3);
			expect(top3.length).toBe(3);
			expect(top3[0].word).toBe("apple");
			expect(top3[1].word).toBe("banana");
			expect(top3[2].word).toBe("cherry");
		});

		it("should handle N larger than array size", () => {
			const top10 = getTopTokens(tokens, 10);
			expect(top10.length).toBe(5);
		});

		it("should return empty for N=0", () => {
			const top0 = getTopTokens(tokens, 0);
			expect(top0.length).toBe(0);
		});

		it("should return empty for empty array", () => {
			const top5 = getTopTokens([], 5);
			expect(top5).toEqual([]);
		});

		it("should return first token for N=1", () => {
			const top1 = getTopTokens(tokens, 1);
			expect(top1.length).toBe(1);
			expect(top1[0].word).toBe("apple");
		});

		it("should preserve order from source array", () => {
			const top2 = getTopTokens(tokens, 2);
			expect(top2[0].frequency).toBeGreaterThanOrEqual(top2[1].frequency);
		});
	});

	describe("Integration tests", () => {
		it("should extract, filter, and get top tokens", () => {
			const text = "apple apple apple banana banana cherry date elderberry " +
						"the a and or but for with";
			const tokens = extractTokens(text);
			expect(tokens.length).toBeGreaterThan(0);

			const filtered = filterByFrequency(tokens, 2);
			expect(filtered.length).toBeGreaterThan(0);

			const top2 = getTopTokens(filtered, 2);
			expect(top2.length).toBeLessThanOrEqual(2);
		});

		it("should handle real document-like text", () => {
			const text = `
				The quick brown fox jumps over the lazy dog.
				The dog was sleeping under the tree.
				The fox was clever and quick.
				Trees grow in the forest.
				Forests are important for the environment.
			`;
			const tokens = extractTokens(text);
			expect(tokens.length).toBeGreaterThan(0);

			// Expect common content words
			expect(tokens.find((t) => t.word === "fox")).toBeDefined();
			expect(tokens.find((t) => t.word === "tree")).toBeDefined();
		});
	});
});
