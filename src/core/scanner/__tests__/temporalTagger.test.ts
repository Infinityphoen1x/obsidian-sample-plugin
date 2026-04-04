/**
 * Unit tests for temporal tagger
 * Tests temporal term detection, wikilink conversion, and tag generation
 */

import {
	extractTemporalTerms,
	wikiLinkTemporalTerms,
	generateTemporalTags,
} from "../temporalTagger.ts";

describe("temporalTagger", () => {
	describe("extractTemporalTerms", () => {
		it("should extract temporal terms from text", () => {
			const text = "In the past, I will do this in the future.";
			const terms = extractTemporalTerms(text);
			expect(terms.length).toBeGreaterThan(0);
			expect(terms.some((t) => t.term === "past")).toBe(true);
		});

		it("should detect past-tense temporal terms", () => {
			const text = "Before yesterday, I used to go there.";
			const terms = extractTemporalTerms(text);
			const pastTerms = terms.filter((t) => t.term.includes("before") || t.term.includes("ago"));
			expect(pastTerms.length).toBeGreaterThan(0);
		});

		it("should detect future-tense temporal terms", () => {
			const text = "Later tonight, we will meet for future planning.";
			const terms = extractTemporalTerms(text);
			expect(terms.some((t) => ["later", "future"].includes(t.term))).toBe(true);
		});

		it("should detect present-tense temporal terms", () => {
			const text = "Right now at the moment, we are here.";
			const terms = extractTemporalTerms(text);
			expect(terms.some((t) => t.term === "now")).toBe(true);
		});

		it("should detect sequence temporal terms", () => {
			const text = "First we did this, second we did that, finally we finished.";
			const terms = extractTemporalTerms(text);
			expect(terms.some((t) => ["first", "second", "finally"].includes(t.term))).toBe(true);
		});

		it("should detect duration temporal terms", () => {
			const text = "During the meeting, meanwhile we discussed, throughout the day.";
			const terms = extractTemporalTerms(text);
			expect(terms.some((t) => ["during", "meanwhile", "throughout"].includes(t.term))).toBe(true);
		});

		it("should be case-insensitive", () => {
			const text = "PAST and Past and past";
			const terms = extractTemporalTerms(text);
			expect(terms.filter((t) => t.term.toLowerCase() === "past").length).toBeGreaterThanOrEqual(3);
		});

		it("should track line numbers", () => {
			const text = "Line1\nLine2 with past\nLine3";
			const terms = extractTemporalTerms(text);
			const pastTerms = terms.filter((t) => t.term === "past");
			expect(pastTerms[0].lineNumber).toBe(2);
		});

		it("should handle multiple instances of same term", () => {
			const text = "Before and before, after and after";
			const terms = extractTemporalTerms(text);
			expect(terms.filter((t) => t.term === "before").length).toBeGreaterThanOrEqual(2);
		});

		it("should not extract already wikilinked terms", () => {
			const text = "[[past]] and past are different";
			const terms = extractTemporalTerms(text);
			// Should only catch the non-wikilinked "past"
			expect(terms.some((t) => t.term === "past" && !t.wikilinked)).toBe(true);
		});

		it("should handle empty text", () => {
			const terms = extractTemporalTerms("");
			expect(terms).toEqual([]);
		});

		it("should handle text with no temporal terms", () => {
			const terms = extractTemporalTerms("This is a regular document with no time markers.");
			expect(terms.length).toBe(0);
		});

		it("should track positions", () => {
			const text = "Let's plan this after the meeting.";
			const terms = extractTemporalTerms(text);
			expect(terms.length).toBeGreaterThan(0);
			expect(terms[0].position).toBeGreaterThanOrEqual(0);
		});

		it("should mark terms as not wikilinked by default", () => {
			const text = "We did it before and after.";
			const terms = extractTemporalTerms(text);
			expect(terms.every((t) => t.wikilinked === false)).toBe(true);
		});
	});

	describe("wikiLinkTemporalTerms", () => {
		it("should convert temporal terms to wikilinks", () => {
			const text = "We did this before and after.";
			const terms = extractTemporalTerms(text);
			const result = wikiLinkTemporalTerms(text, terms);
			expect(result).toContain("[[before]]");
			expect(result).toContain("[[after]]");
		});

		it("should preserve non-temporal text", () => {
			const text = "We did this before and after.";
			const terms = extractTemporalTerms(text);
			const result = wikiLinkTemporalTerms(text, terms);
			expect(result).toContain("We did this");
		});

		it("should not double-link already wikilinked terms", () => {
			const text = "We did [[before]] and after.";
			const terms = extractTemporalTerms(text);
			const result = wikiLinkTemporalTerms(text, terms);
			// Should not have [[[before]]]
			expect(result).not.toContain("[[[");
		});

		it("should handle multiple temporal terms", () => {
			const text = "First we started, then we progressed, finally we finished.";
			const terms = extractTemporalTerms(text);
			const result = wikiLinkTemporalTerms(text, terms);
			expect(result).toContain("[[first]]");
			expect(result).toContain("[[then]]");
			expect(result).toContain("[[finally]]");
		});

		it("should handle overlapping positions", () => {
			const text = "After after after, before before before.";
			const terms = extractTemporalTerms(text);
			const result = wikiLinkTemporalTerms(text, terms);
			const afterCount = (result.match(/\[\[after\]\]/g) || []).length;
			expect(afterCount).toBe(3);
		});

		it("should handle empty terms array", () => {
			const text = "Some regular text.";
			const result = wikiLinkTemporalTerms(text, []);
			expect(result).toBe(text);
		});

		it("should handle empty text", () => {
			const result = wikiLinkTemporalTerms("", []);
			expect(result).toBe("");
		});

		it("should maintain text structure", () => {
			const text = "We go before and after.";
			const terms = extractTemporalTerms(text);
			const result = wikiLinkTemporalTerms(text, terms);
			// Temporal terms should be wikilinked
			expect(result).toContain("[[before]]");
			expect(result).toContain("We go");
		});

		it("should handle case variations in wikilinks", () => {
			const text = "Before BEFORE beFore";
			const terms = extractTemporalTerms(text);
			const result = wikiLinkTemporalTerms(text, terms);
			expect(result).toContain("[[before]]");
		});
	});

	describe("generateTemporalTags", () => {
		it("should generate tags from temporal terms", () => {
			const text = "Before and after";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			expect(tags.length).toBeGreaterThan(0);
		});

		it("should generate past category tag", () => {
			const text = "In the past, we did this before.";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			expect(tags).toContain("temporal:past");
		});

		it("should generate future category tag", () => {
			const text = "In the future, we will do this later.";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			expect(tags).toContain("temporal:future");
		});

		it("should generate present category tag", () => {
			const text = "Right now we are present.";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			expect(tags).toContain("temporal:present");
		});

		it("should generate sequence category tag", () => {
			const text = "First we did this, finally we finished.";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			expect(tags).toContain("temporal:sequence");
		});

		it("should generate duration category tag", () => {
			const text = "During the event, while we worked.";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			expect(tags).toContain("temporal:duration");
		});

		it("should generate relative category tag", () => {
			const text = "Today we are working tomorrow.";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			expect(tags.some((t) => t.includes("temporal:relative"))).toBe(true);
		});

		it("should not generate duplicate tags", () => {
			const text = "Before before before ago ago.";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			const pastTags = tags.filter((t) => t === "temporal:past");
			expect(pastTags.length).toBe(1);
		});

		it("should handle empty terms array", () => {
			const tags = generateTemporalTags([]);
			expect(tags).toEqual([]);
		});

		it("should handle mixed category terms", () => {
			const text = "Before and after, during and finally.";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			expect(tags.length).toBeGreaterThanOrEqual(3);
		});

		it("should use consistent tag format", () => {
			const text = "Past future present";
			const terms = extractTemporalTerms(text);
			const tags = generateTemporalTags(terms);
			expect(tags.every((t) => t.startsWith("temporal:"))).toBe(true);
		});
	});

	describe("Integration tests", () => {
		it("should extract, wikilink, and generate tags", () => {
			const text = "In the past we did many things. Before this happened, we prepared. " +
						"After the event finished, we documented everything. " +
						"In the future, we will review the results.";

			const terms = extractTemporalTerms(text);
			expect(terms.length).toBeGreaterThan(0);

			const wikilinked = wikiLinkTemporalTerms(text, terms);
			expect(wikilinked).toContain("[[");
			expect(wikilinked).toContain("]]");

			const tags = generateTemporalTags(terms);
			expect(tags.length).toBeGreaterThan(0);
			expect(tags.some((t) => t.includes("past"))).toBe(true);
			expect(tags.some((t) => t.includes("future"))).toBe(true);
		});

		it("should handle complex narrative with multiple temporal references", () => {
			const text = `
				## Timeline of Events

				Initially, in 2020, we started this project. Before we began, we spent months preparing.
				During the first year, we made significant progress. Meanwhile, the market changed.
				After that period, we adapted our strategy. Later in 2021, we saw improvements.
				
				Currently, we are in the execution phase. Right now, the team is working hard.
				Soon we will reach the next milestone. Eventually, we will achieve our goals.
				
				In retrospect, the journey has been valuable. Previously, we learned many lessons.
				Looking forward, the future looks promising.
			`;

			const terms = extractTemporalTerms(text);
			expect(terms.length).toBeGreaterThan(10);

			const tags = generateTemporalTags(terms);
			expect(tags).toContain("temporal:past");
			expect(tags).toContain("temporal:present");
			expect(tags).toContain("temporal:future");
		});
	});
});
