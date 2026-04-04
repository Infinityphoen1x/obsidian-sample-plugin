/**
 * Document scanner module
 *
 * Main scanner for markdown documents.
 * Extracts tokens, detects chapter status, and generates frontmatter.
 */

import { TFile } from "obsidian";
import { DocScanResult } from "../../types";
import { extractTokens } from "./tokenizer";
import { extractTemporalTerms, generateTemporalTags } from "./temporalTagger";

/**
 * Detect if a document is likely a "chapter"
 * Heuristics:
 * - Filename contains CH, Chapter, Part, Act, Episode, etc.
 * - Mostly prose (not heavily formatted)
 * - Few special characters
 * - Moderate length (500+ words)
 */
function detectChapter(fileName: string, content: string): boolean {
	const chapterIndicators = ["ch", "chapter", "part", "act", "episode", "scene"];
	const fileNameLower = fileName.toLowerCase();

	// Check filename
	for (const indicator of chapterIndicators) {
		if (fileNameLower.includes(indicator)) {
			return true;
		}
	}

	// Check content characteristics
	const wordCount = content.split(/\s+/).length;
	if (wordCount < 500) return false; // Too short to be a meaningful chapter

	// Count special formatting (markdown syntax)
	const markdownSyntax = (content.match(/#+\s|```|~~|==|\*\*|__/g) || []).length;
	const syntaxRatio = markdownSyntax / wordCount;

	// If syntax ratio is very high, probably not a narrative chapter
	if (syntaxRatio > 0.05) return false;

	// Count special characters
	const specialChars = (content.match(/[{}[\]<>|\\~!@#$%^&*()\-_+=]/g) || []).length;
	const charRatio = specialChars / wordCount;

	// Prose chapters have few special characters
	return charRatio < 0.02;
}

/**
 * Scan a markdown file for metadata
 * @param file The file to scan
 * @param content The file content
 * @returns Scan results with tokens and metadata
 */
export async function scanMarkdown(file: TFile, content: string): Promise<DocScanResult> {
	const wordCount = content.split(/\s+/).length;
	const tokens = extractTokens(content);
	const temporalTerms = extractTemporalTerms(content);
	const isChapter = detectChapter(file.basename, content);

	return {
		document: file.path,
		tokens,
		temporalTerms,
		isChapter,
		wordCount,
		uniqueTokenCount: tokens.length,
	};
}

/**
 * Generate frontmatter for a scanned document
 * @param scanResult Result from document scan
 * @param additionalTags Extra tags to add
 * @returns YAML frontmatter string
 */
export function generateFrontmatter(
	scanResult: DocScanResult,
	additionalTags: string[] = []
): string {
	const temporalTags = generateTemporalTags(scanResult.temporalTerms);
	const allTags = [...temporalTags, ...additionalTags];

	const frontmatter: Record<string, any> = {
		type: "document",
		scanned_date: new Date().toISOString(),
		is_chapter: scanResult.isChapter,
		word_count: scanResult.wordCount,
		tags: allTags.length > 0 ? allTags : null,
	};

	let yaml = "---\n";
	for (const [key, value] of Object.entries(frontmatter)) {
		if (value === null) continue;

		if (Array.isArray(value)) {
			yaml += `${key}:\n`;
			value.forEach((v) => {
				yaml += `  - ${v}\n`;
			});
		} else if (typeof value === "string") {
			yaml += `${key}: "${value}"\n`;
		} else {
			yaml += `${key}: ${value}\n`;
		}
	}
	yaml += "---\n";

	return yaml;
}

/**
 * Prepend frontmatter to document content
 * @param content Original content
 * @param frontmatter Frontmatter to add
 * @returns Content with frontmatter prepended
 */
export function prependFrontmatter(content: string, frontmatter: string): string {
	// Remove existing frontmatter if present
	if (content.startsWith("---")) {
		const endMarker = content.indexOf("---", 3);
		if (endMarker > 3) {
			content = content.substring(endMarker + 3).trim();
		}
	}

	return frontmatter + "\n" + content;
}
