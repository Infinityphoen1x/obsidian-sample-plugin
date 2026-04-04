/**
 * DOCX to Markdown conversion
 *
 * Uses mammoth.js library to convert .docx files to markdown.
 * This markdown becomes the source document for scanning.
 */

import { Vault } from "obsidian";

/**
 * Convert DOCX file to Markdown
 * @param docxArrayBuffer The DOCX file as ArrayBuffer
 * @param filename Output filename (for logging)
 * @returns Markdown string
 */
export async function convertDocxToMarkdown(
	docxArrayBuffer: ArrayBuffer,
	filename: string
): Promise<string> {
	try {
		// TODO: Phase 2 - Implement mammoth.js integration
		// const result = await mammoth.convertToMarkdown({ arrayBuffer: docxArrayBuffer });
		// return result.value;
		
		console.warn(`DOCX conversion for ${filename} not yet implemented`);
		return "";
	} catch (error) {
		console.error(`Error converting DOCX file ${filename}:`, error);
		throw error;
	}
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
