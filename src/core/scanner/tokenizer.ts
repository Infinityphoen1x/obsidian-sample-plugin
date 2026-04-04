/**
 * Text tokenization and frequency analysis
 *
 * Extracts meaningful tokens from text and calculates their frequency.
 * Filters out stop words and low-value tokens.
 */

import { Token } from "../../types";

// Common stop words in English
const STOP_WORDS = new Set([
	"a", "an", "and", "are", "as", "at", "be", "but", "by", "for",
	"if", "in", "into", "is", "it", "no", "not", "of", "on", "or",
	"such", "that", "the", "their", "then", "there", "these", "they",
	"this", "to", "was", "will", "with", "i", "me", "you", "he", "she",
	"we", "them", "us", "my", "his", "her", "your", "our", "its",
	"can", "could", "would", "should", "may", "might", "must", "do",
	"does", "did", "have", "has", "had", "been", "being",
]);

/**
 * Extract and count tokens from text
 * @param text The text to tokenize
 * @returns Array of tokens sorted by frequency (descending)
 */
export function extractTokens(text: string): Token[] {
	const tokens = new Map<string, { count: number; positions: number[] }>();

	// Split on whitespace and punctuation
	const words = text.match(/\b\w+\b/gi) || [];

	let currentPos = 0;
	for (const word of words) {
		const normalized = word.toLowerCase();

		// Skip stop words and very short words
		if (STOP_WORDS.has(normalized) || normalized.length < 2) {
			currentPos += word.length + 1;
			continue;
		}

		const existing = tokens.get(normalized) || { count: 0, positions: [] };
		existing.count++;
		existing.positions.push(text.indexOf(word, currentPos));

		tokens.set(normalized, existing);
		currentPos += word.length + 1;
	}

	// Convert to Token array and sort by frequency
	const result: Token[] = Array.from(tokens.entries()).map(([word, data]) => ({
		word,
		frequency: data.count,
		positions: data.positions,
	}));

	result.sort((a, b) => b.frequency - a.frequency);
	return result;
}

/**
 * Filter tokens by minimum frequency
 * @param tokens Array of tokens
 * @param minFrequency Minimum frequency threshold
 * @returns Filtered tokens
 */
export function filterByFrequency(tokens: Token[], minFrequency: number): Token[] {
	return tokens.filter((t) => t.frequency >= minFrequency);
}

/**
 * Get top N most frequent tokens
 * @param tokens Array of tokens (should be pre-sorted)
 * @param topN Number of top tokens to return
 * @returns Top N tokens
 */
export function getTopTokens(tokens: Token[], topN: number): Token[] {
	return tokens.slice(0, topN);
}
