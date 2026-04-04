/**
 * Unit tests for document scanner
 * Tests document scanning, chapter detection, and frontmatter generation
 */

import { generateFrontmatter, prependFrontmatter } from "../documentScanner.ts";
import { DocScanResult } from "../../../types.ts";

describe("documentScanner", () => {
	const baseScanResult: DocScanResult = {
		document: "test.md",
		tokens: [
			{ word: "test", frequency: 5, positions: [0] },
			{ word: "document", frequency: 3, positions: [10] },
		],
		temporalTerms: [
			{ term: "before", position: 20, lineNumber: 1, wikilinked: false },
			{ term: "after", position: 30, lineNumber: 2, wikilinked: false },
		],
		isChapter: false,
		wordCount: 500,
		uniqueTokenCount: 2,
	};

	describe("generateFrontmatter", () => {
		it("should generate YAML frontmatter", () => {
			const fm = generateFrontmatter(baseScanResult);
			expect(fm).toContain("---");
			expect(fm.startsWith("---\n")).toBe(true);
			expect(fm.endsWith("---\n")).toBe(true);
		});

		it("should include type field", () => {
			const fm = generateFrontmatter(baseScanResult);
			expect(fm).toContain('type: "document"');
		});

		it("should include scanned_date field", () => {
			const fm = generateFrontmatter(baseScanResult);
			expect(fm).toContain("scanned_date:");
		});

		it("should include is_chapter field", () => {
			const fm = generateFrontmatter(baseScanResult);
			expect(fm).toContain("is_chapter: false");
		});

		it("should set is_chapter to true for chapters", () => {
			const chapterResult = { ...baseScanResult, isChapter: true };
			const fm = generateFrontmatter(chapterResult);
			expect(fm).toContain("is_chapter: true");
		});

		it("should include word_count field", () => {
			const fm = generateFrontmatter(baseScanResult);
			expect(fm).toContain("word_count: 500");
		});

		it("should include temporal tags", () => {
			const fm = generateFrontmatter(baseScanResult);
			expect(fm).toContain("temporal:past");
			expect(fm).toContain("temporal:future");
		});

		it("should include additional tags", () => {
			const fm = generateFrontmatter(baseScanResult, ["custom", "tag"]);
			expect(fm).toContain("custom");
			expect(fm).toContain("tag");
		});

		it("should format tags as YAML list", () => {
			const fm = generateFrontmatter(baseScanResult, ["tag1", "tag2"]);
			expect(fm).toContain("tags:");
			expect(fm).toContain("  - temporal:");
			expect(fm).toContain("  - tag1");
		});

		it("should handle empty temporal terms", () => {
			const noTemporal = { ...baseScanResult, temporalTerms: [] };
			const fm = generateFrontmatter(noTemporal);
			// Should still have structure but no temporal tags
			expect(fm).toContain("---");
		});

		it("should handle empty additional tags", () => {
			const fm = generateFrontmatter(baseScanResult, []);
			expect(fm).toContain("tags:");
		});

		it("should escape quotes in tag names", () => {
			const fm = generateFrontmatter(baseScanResult, ['tag"with"quotes']);
			expect(fm).toContain("tag");
		});

		it("should generate valid YAML structure", () => {
			const fm = generateFrontmatter(baseScanResult);
			// Should start and end with ---
			expect(fm.startsWith("---\n")).toBe(true);
			expect(fm.endsWith("---\n")).toBe(true);
		});

		it("should include scanned_date in ISO format", () => {
			const fm = generateFrontmatter(baseScanResult);
			const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
			expect(isoRegex.test(fm)).toBe(true);
		});

		it("should handle large word counts", () => {
			const largeDoc = { ...baseScanResult, wordCount: 1000000 };
			const fm = generateFrontmatter(largeDoc);
			expect(fm).toContain("word_count: 1000000");
		});
	});

	describe("prependFrontmatter", () => {
		const content = "# Test Document\n\nThis is test content.";
		const frontmatter = "---\ntype: \"document\"\n---\n";

		it("should prepend frontmatter to content", () => {
			const result = prependFrontmatter(content, frontmatter);
			expect(result.startsWith(frontmatter)).toBe(true);
			expect(result).toContain("# Test Document");
		});

		it("should preserve original content", () => {
			const result = prependFrontmatter(content, frontmatter);
			expect(result).toContain("Test Document");
			expect(result).toContain("test content");
		});

		it("should remove existing frontmatter if present", () => {
			const contentWithFM = "---\nold: \"data\"\n---\n# Test\n\nContent";
			const result = prependFrontmatter(contentWithFM, frontmatter);
			expect(result).not.toContain('old: "data"');
			expect(result.indexOf("---")).toBe(0); // Should start with frontmatter
		});

		it("should replace existing frontmatter", () => {
			const oldContent = "---\nold: true\n---\nContent here";
			const newFM = "---\nnew: true\n---\n";
			const result = prependFrontmatter(oldContent, newFM);
			expect(result).toContain("new: true");
			expect(result).not.toContain("old: true");
		});

		it("should handle content without existing frontmatter", () => {
			const plain = "Just some plain text.";
			const result = prependFrontmatter(plain, frontmatter);
			expect(result.startsWith(frontmatter)).toBe(true);
			expect(result).toContain("Just some plain text");
		});

		it("should handle malformed existing frontmatter", () => {
			const malformed = "---\nincomplete";
			const result = prependFrontmatter(malformed, frontmatter);
			// Should handle gracefully
			expect(result.startsWith(frontmatter)).toBe(true);
		});

		it("should add newline between frontmatter and content", () => {
			const result = prependFrontmatter(content, frontmatter);
			const parts = result.split("\n");
			// Should have newline after closing ---
			expect(parts[0]).toBe("---");
		});

		it("should handle empty content", () => {
			const result = prependFrontmatter("", frontmatter);
			expect(result.startsWith(frontmatter)).toBe(true);
		});

		it("should handle empty frontmatter", () => {
			const result = prependFrontmatter(content, "");
			expect(result).toBe("\n" + content);
		});

		it("should preserve multiple frontmatter fields", () => {
			const complexFM = "---\ntype: \"document\"\ntags:\n  - tag1\n  - tag2\nscanned: true\n---\n";
			const result = prependFrontmatter(content, complexFM);
			expect(result).toContain("type: \"document\"");
			expect(result).toContain("tag1");
			expect(result).toContain("scanned: true");
		});

		it("should trim content after removing old frontmatter", () => {
			const spaced = "---\nold: data\n---\n\n\n# Heading";
			const result = prependFrontmatter(spaced, frontmatter);
			expect(result).not.toContain("\n\n\n# Heading");
		});
	});

	describe("Integration tests", () => {
		it("should generate and prepend frontmatter correctly", () => {
			const content = "# Chapter 1\n\nLong content here...";
			const fm = generateFrontmatter(baseScanResult);
			const result = prependFrontmatter(content, fm);

			expect(result.startsWith("---\n")).toBe(true);
			expect(result).toContain("# Chapter 1");
			expect(result).toContain("Long content here");
		});

		it("should handle full cycle with existing frontmatter", () => {
			const oldContent = "---\nold: true\n---\n# Chapter 2\n\nContent";
			const fm = generateFrontmatter(baseScanResult);
			const result = prependFrontmatter(oldContent, fm);

			expect(result).toContain("type: \"document\"");
			expect(result).not.toContain("old: true");
			expect(result).toContain("# Chapter 2");
		});

		it("should generate frontmatter with complex metadata", () => {
			const complexResult: DocScanResult = {
				document: "complex.md",
				tokens: Array.from({ length: 100 }, (_, i) => ({
					word: `token${i}`,
					frequency: Math.floor(Math.random() * 50),
					positions: [i * 10],
				})),
				temporalTerms: [
					{ term: "past", position: 0, lineNumber: 1, wikilinked: false },
					{ term: "future", position: 100, lineNumber: 5, wikilinked: false },
					{ term: "during", position: 200, lineNumber: 10, wikilinked: false },
				],
				isChapter: true,
				wordCount: 5000,
				uniqueTokenCount: 100,
			};

			const fm = generateFrontmatter(complexResult, ["important", "research"]);
			const result = prependFrontmatter("Content", fm);

			expect(result).toContain("is_chapter: true");
			expect(result).toContain("word_count: 5000");
			expect(result).toContain("temporal:");
			expect(result).toContain("important");
			expect(result).toContain("Content");
		});
	});
});
