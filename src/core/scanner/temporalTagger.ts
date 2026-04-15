/**
 * Temporal term detection and tagging
 *
 * Identifies temporal markers in text and converts them to wikilinks.
 * Temporal terms are later used for timeline generation.
 */

import { TemporalTerm } from "../../types";

// Temporal keywords organized by category
const TEMPORAL_KEYWORDS = {
	past: ["past", "before", "ago", "previously", "earlier", "once", "when", "used to"],
	future: ["future", "later", "after", "eventually", "next", "will", "shall", "upcoming"],
	present: ["present", "now", "currently", "at the moment", "immediately", "right now"],
	relative: ["then", "today", "tonight", "tomorrow", "yesterday", "soon"],
	sequence: ["first", "second", "third", "finally", "meanwhile", "afterward"],
	duration: ["during", "throughout", "while", "meanwhile", "whilst", "for a time"],
};

/**
 * Find all temporal terms in text
 * @param text The text to search
 * @returns Array of temporal terms with positions
 */
export function extractTemporalTerms(text: string): TemporalTerm[] {
	const terms: TemporalTerm[] = [];
	const lines = text.split("\n");
	let lineNumber = 0;
	let offset = 0;
	const wikilinkRanges = getWikilinkRanges(text);

	// First pass: count frequency of each term
	const termFrequency = new Map<string, number>();
	for (const line of lines) {
		const lineLower = line.toLowerCase();
		for (const [, keywords] of Object.entries(TEMPORAL_KEYWORDS)) {
			for (const keyword of keywords) {
				const regex = new RegExp(`\\b${keyword}\\b`, "gi");
				let match;
				while ((match = regex.exec(lineLower)) !== null) {
					const absoluteIndex = offset + (match.index ?? 0);
					const isWikilinked = isIndexInsideRange(
						wikilinkRanges,
						absoluteIndex
					);
					if (!isWikilinked) {
						const keyLower = keyword.toLowerCase();
						termFrequency.set(keyLower, (termFrequency.get(keyLower) ?? 0) + 1);
					}
				}
			}
		}
		offset += line.length + 1;
	}

	// Second pass: create entries with frequency
	lineNumber = 0;
	offset = 0;
	for (const line of lines) {
		lineNumber++;
		const lineLower = line.toLowerCase();

		for (const [, keywords] of Object.entries(TEMPORAL_KEYWORDS)) {
			for (const keyword of keywords) {
				const regex = new RegExp(`\\b${keyword}\\b`, "gi");
				let match;

				while ((match = regex.exec(lineLower)) !== null) {
					const absoluteIndex = offset + (match.index ?? 0);
					const isWikilinked = isIndexInsideRange(
						wikilinkRanges,
						absoluteIndex
					);

					if (!isWikilinked) {
						const keyLower = keyword.toLowerCase();
						terms.push({
							term: keyLower,
							position: absoluteIndex,
							lineNumber,
							frequency: termFrequency.get(keyLower) ?? 0,
							wikilinked: false,
						});
					}
				}
			}
		}
		offset += line.length + 1;
	}

	return terms;
}

/**
 * Convert temporal terms in text to wikilinks
 * @param text The text to modify
 * @param terms The temporal terms to wikilink
 * @returns Modified text with wikilinks
 */
export function wikiLinkTemporalTerms(text: string, terms: TemporalTerm[]): string {
	let result = text;
	let offset = 0;
	const wikilinkRanges = getWikilinkRanges(text);

	// Sort by position to apply replacements correctly
	const sortedTerms = [...terms].sort((a, b) => a.position - b.position);

	for (const term of sortedTerms) {
		if (term.wikilinked) continue;

		const searchStr = term.term;
		const replaceStr = `[[${term.term}]]`;
		const position = term.position + offset;
		if (isIndexInsideRange(wikilinkRanges, position)) {
			continue;
		}

		// Check bounds
		if (position >= 0 && position + searchStr.length <= result.length) {
			result = result.substring(0, position) + replaceStr + result.substring(position + searchStr.length);
			offset += replaceStr.length - searchStr.length;
		}
	}

	return result;
}

function getWikilinkRanges(text: string): Array<{ start: number; end: number }> {
	const ranges: Array<{ start: number; end: number }> = [];
	const regex = /\[\[[^\[\]]+\]\]/g;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		ranges.push({ start: match.index, end: match.index + match[0].length });
	}

	return ranges;
}

function isIndexInsideRange(
	ranges: Array<{ start: number; end: number }>,
	index: number
): boolean {
	return ranges.some((range) => index >= range.start && index < range.end);
}

/**
 * Generate temporal tags for frontmatter
 * @param terms Array of temporal terms found
 * @returns Array of tag strings for frontmatter
 */
export function generateTemporalTags(terms: TemporalTerm[]): string[] {
	const tags = new Set<string>();

	for (const term of terms) {
		for (const [category, keywords] of Object.entries(TEMPORAL_KEYWORDS)) {
			if (keywords.includes(term.term.toLowerCase())) {
				tags.add(`temporal:${category}`);
				break;
			}
		}
	}

	return Array.from(tags);
}
