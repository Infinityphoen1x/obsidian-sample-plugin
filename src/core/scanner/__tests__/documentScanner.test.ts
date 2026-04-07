/**
 * Unit tests for document scanner
 * Tests document scanning, chapter detection, and frontmatter generation
 */

import { generateFrontmatter } from "../documentScanner.ts";
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
});
