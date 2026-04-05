/**
 * Wikilink injection utilities
 *
 * Methods for injecting wikilinks into markdown text.
 * Handles case-insensitive matching, word boundaries, and aliases.
 */

/**
 * Inject wikilinks for a set of terms into text
 * Wraps all occurrences in [[term]] format.
 * Skips terms that are already wikilinked or inside code blocks.
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
 * Link all occurrences of a single term, avoiding existing wikilinks
 * @param text The text to modify
 * @param term The term to link
 * @returns Modified text
 */
function linkAllOccurrences(text: string, term: string): string {
	// Escape special regex characters
	const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	// Regex that matches the term with word boundaries, case-insensitive
	const regex = new RegExp(`\\b${escapedTerm}\\b`, "gi");

	// Track positions of already-wikilinked terms to skip them
	const wikilinkedPositions = new Set<number>();
	const wikiLinkRegex = /\[\[([^\[\]]+)\]\]/g;
	let wikiMatch: RegExpExecArray | null;

	while ((wikiMatch = wikiLinkRegex.exec(text)) !== null) {
		// Mark entire wikilink range as protected
		for (let i = wikiMatch.index; i < wikiMatch.index + wikiMatch[0].length; i++) {
			wikilinkedPositions.add(i);
		}
	}

	// Also protect code blocks (backticks and triple backticks)
	const codeBlockRegex = /`[^`]*`|```[\s\S]*?```/g;
	let codeMatch: RegExpExecArray | null;

	while ((codeMatch = codeBlockRegex.exec(text)) !== null) {
		for (let i = codeMatch.index; i < codeMatch.index + codeMatch[0].length; i++) {
			wikilinkedPositions.add(i);
		}
	}

	// Replace only matches that are NOT inside wikilinks or code blocks
	let result = "";
	let lastIndex = 0;
	let termMatch: RegExpExecArray | null;

	while ((termMatch = regex.exec(text)) !== null) {
		const matchLength = termMatch[0]?.length ?? 0;
		const matchIndex = termMatch.index ?? 0;

		// Check if this match position is protected
		const isProtected = Array.from({ length: matchLength }, (_, i) => i + matchIndex).some(
			(pos) => wikilinkedPositions.has(pos)
		);

		if (!isProtected) {
			// Add text before match
			result += text.slice(lastIndex, matchIndex);
			// Add wikilinked term
			result += `[[${termMatch[0]}]]`;
			lastIndex = matchIndex + matchLength;
		}
	}

	// Add remaining text
	result += text.slice(lastIndex);
	return result;
}

/**
 * Check if a term is already wikilinked in text
 * @param text The text to check
 * @param term The term to look for
 * @returns True if term is wikilinked somewhere
 */
export function isTermWikilinked(text: string, term: string): boolean {
	// Match exact wikilink: [[term]] or [[term|alias]]
	const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(`\\[\\[${escapedTerm}(?:\\|[^\\]]*)?\\]\\]`, "i");
	return regex.test(text);
}

/**
 * Extract all wikilinks from text
 * @param text The text to parse
 * @returns Array of wikilinked terms (without brackets, includes aliases)
 */
export function extractWikilinks(text: string): string[] {
	const regex = /\[\[([^\[\]]+)\]\]/g;
	const links: string[] = [];
	let match;

	while ((match = regex.exec(text)) !== null) {
		if (match[1]) {
			links.push(match[1]);
		}
	}

	return links;
}

/**
 * Extract the base term from a wikilink (before any alias)
 * [[term|alias]] → term
 * [[term]] → term
 * @param wikilink The wikilink content (without brackets)
 * @returns The base term
 */
export function getTermFromWikilink(wikilink: string): string {
	const parts = wikilink.split("|");
	return parts[0]?.trim() ?? "";
}

/**
 * Count occurrences of a term in text (including wikilinked)
 * @param text The text to search
 * @param term The term to count
 * @returns Number of occurrences
 */
export function countTermOccurrences(text: string, term: string): number {
	const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(`\\b${escapedTerm}\\b`, "gi");
	const matches = text.match(regex);
	return matches ? matches.length : 0;
}

/**
 * Count wikilinked occurrences of a term
 * @param text The text to search
 * @param term The term to count
 * @returns Number of wikilinked occurrences
 */
export function countWikilinkedOccurrences(text: string, term: string): number {
	const wikilinks = extractWikilinks(text);
	const baseTerm = term.toLowerCase();
	return wikilinks.filter((link) => getTermFromWikilink(link).toLowerCase() === baseTerm).length;
}

/**
 * Remove all wikilinks from text (keep the link content)
 * [[term]] → term
 * [[term|alias]] → alias
 * @param text The text to process
 * @returns Text with wikilinks removed
 */
export function removeWikilinks(text: string): string {
	return text.replace(/\[\[([^\[\]]+)\]\]/g, (match, content) => {
		const parts = content.split("|");
		return parts.length > 1 ? parts[1]! : parts[0]!;
	});
}

/**
 * Replace a wikilinked term with a new term
 * @param text The text to process
 * @param oldTerm The term to replace
 * @param newTerm The new term
 * @returns Modified text
 */
export function replaceWikilinkedTerm(text: string, oldTerm: string, newTerm: string): string {
	const escapedTerm = oldTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const regex = new RegExp(`\\[\\[${escapedTerm}(?:\\|([^\\]]*))?\\]\\]`, "gi");
	return text.replace(regex, (match, alias) => {
		if (alias) {
			return `[[${newTerm}|${alias}]]`;
		}
		return `[[${newTerm}]]`;
	});
}
