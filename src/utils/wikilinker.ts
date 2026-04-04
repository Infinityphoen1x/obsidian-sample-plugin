/**
 * Wikilink injection utilities
 *
 * Methods for injecting wikilinks into markdown text.
 * Handles case-insensitive matching and aliasing.
 */

/**
 * Inject wikilinks for a set of terms into text
 * Wraps all occurrences in [[term]] format.
 * @param text The text to modify
 * @param terms Array of terms to wikilink
 * @returns Modified text with wikilinks
 */
export function injectWikilinks(text: string, terms: string[]): string {
	let result = text;

	// Sort terms by length (longest first) to avoid partial matches
	const sortedTerms = [...terms].sort((a, b) => b.length - a.length);

	for (const term of sortedTerms) {
		result = linkAllOccurrences(result, term);
	}

	return result;
}

/**
 * Link all occurrences of a single term
 * @param text The text to modify
 * @param term The term to link
 * @returns Modified text
 */
function linkAllOccurrences(text: string, term: string): string {
	// Create regex that matches term with word boundaries, case-insensitive
	// But not if already in wikilinks
	const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(`\\b${escapedTerm}\\b`, "gi");

	return text.replace(regex, (match) => {
		// Check if already wikilinked by looking at surrounding context
		const pos = text.indexOf(match);
		if (pos > 1 && text[pos - 1] === "[" && text[pos - 2] === "[") {
			return match; // Already wikilinked
		}
		return `[[${match}]]`;
	});
}

/**
 * Check if a term is already wikilinked in text
 * @param text The text to check
 * @param term The term to look for
 * @returns True if term is wikilinked somewhere
 */
export function isTermWikilinked(text: string, term: string): boolean {
	const regex = new RegExp(`\\[\\[${term}\\]\\]`, "i");
	return regex.test(text);
}

/**
 * Extract all wikilinks from text
 * @param text The text to parse
 * @returns Array of wikilinked terms (without brackets)
 */
export function extractWikilinks(text: string): string[] {
	const regex = /\[\[([^\[\]]+)\]\]/g;
	const links: string[] = [];
	let match;

	while ((match = regex.exec(text)) !== null) {
		links.push(match?.[1] ?? "");
	}

	return links;
}
