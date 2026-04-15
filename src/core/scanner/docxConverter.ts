/**
 * DOCX to Markdown conversion
 *
 * Uses mammoth.js library to convert .docx files to markdown.
 * This markdown becomes the source document for scanning.
 */

import { Vault } from "obsidian";
import * as mammoth from "mammoth";

/**
 * Convert DOCX file to Markdown
 * Uses mammoth to convert .docx to HTML, then HTML to Markdown
 * @param docxArrayBuffer The DOCX file as ArrayBuffer
 * @param filename Output filename (for logging)
 * @returns Markdown string
 */
export async function convertDocxToMarkdown(
	docxArrayBuffer: ArrayBuffer,
	filename: string
): Promise<string> {
	try {
		// Convert DOCX to HTML first
		const result = await mammoth.convertToHtml({ arrayBuffer: docxArrayBuffer });
		const html = result.value;
		
		// Convert HTML to Markdown
		const markdown = htmlToMarkdown(html);
		
		console.log(`Successfully converted DOCX file: ${filename}`);
		return markdown;
	} catch (error) {
		console.error(`Error converting DOCX file ${filename}:`, error);
		throw error;
	}
}

/**
 * Simple HTML to Markdown converter
 * Handles common HTML tags used in DOCX conversions
 */
function htmlToMarkdown(html: string): string {
	let markdown = html;
	
	// Convert HTML headers
	markdown = markdown.replace(/<h1\b[^>]*>(.*?)<\/h1>/gi, "# $1\n");
	markdown = markdown.replace(/<h2\b[^>]*>(.*?)<\/h2>/gi, "## $1\n");
	markdown = markdown.replace(/<h3\b[^>]*>(.*?)<\/h3>/gi, "### $1\n");
	markdown = markdown.replace(/<h4\b[^>]*>(.*?)<\/h4>/gi, "#### $1\n");
	markdown = markdown.replace(/<h5\b[^>]*>(.*?)<\/h5>/gi, "##### $1\n");
	markdown = markdown.replace(/<h6\b[^>]*>(.*?)<\/h6>/gi, "###### $1\n");
	
	// Convert bold
	markdown = markdown.replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, "**$1**");
	markdown = markdown.replace(/<b\b[^>]*>(.*?)<\/b>/gi, "**$1**");
	
	// Convert italic
	markdown = markdown.replace(/<em\b[^>]*>(.*?)<\/em>/gi, "*$1*");
	markdown = markdown.replace(/<i\b[^>]*>(.*?)<\/i>/gi, "*$1*");
	
	// Convert underline (no markdown equiv, use bold)
	markdown = markdown.replace(/<u\b[^>]*>(.*?)<\/u>/gi, "**$1**");
	
	// Convert lists
	markdown = markdown.replace(/<ul\b[^>]*>/gi, "\n");
	markdown = markdown.replace(/<\/ul>/gi, "\n");
	markdown = markdown.replace(/<li\b[^>]*>(.*?)<\/li>/gi, "- $1\n");
	
	// Convert ol
	markdown = markdown.replace(/<ol\b[^>]*>/gi, "\n");
	markdown = markdown.replace(/<\/ol>/gi, "\n");
	let olCounter = 1;
	markdown = markdown.replace(/<li\b[^>]*>(.*?)<\/li>/gi, () => {
		return `${olCounter++}. $1\n`;
	});
	
	// Convert paragraphs
	markdown = markdown.replace(/<p\b[^>]*>(.*?)<\/p>/gi, "$1\n\n");
	
	// Convert line breaks
	markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
	markdown = markdown.replace(/<hr\s*\/?>/gi, "---\n");
	
	// Convert links
	markdown = markdown.replace(/<a\s+href=["']([^"']*)["']\b[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
	
	// Remove remaining HTML tags
	markdown = markdown.replace(/<[^>]+>/g, "");
	
	// Decode HTML entities
	markdown = markdown
		.replace(/&nbsp;/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, "&");
	
	// Clean up whitespace
	markdown = markdown.replace(/\n\n\n+/g, "\n\n").trim();
	
	return markdown;
}

/**
 * Create markdown file from DOCX in vault
 * @param vault Obsidian Vault
 * @param docxArrayBuffer DOCX file data
 * @param filename Target filename (without extension)
 * @returns Created file path
 */
export async function createMarkdownFromDocx(
	vault: Vault,
	docxArrayBuffer: ArrayBuffer,
	filename: string
): Promise<string> {
	try {
		const markdown = await convertDocxToMarkdown(docxArrayBuffer, filename);
		const filePath = `${filename}.md`;
		
		const file = vault.getFileByPath(filePath);
		if (file) {
			await vault.modify(file, markdown);
		} else {
			await vault.create(filePath, markdown);
		}

		return filePath;
	} catch (error) {
		console.error(`Error creating markdown from DOCX ${filename}:`, error);
		throw error;
	}
}
