/**
 * Document Scanner Handlers
 *
 * Integration layer for document scanning with key term selection.
 * Handles full workflow: scan → select key terms → apply → persist entities.
 */

import { App, Notice, TFile, Vault } from 'obsidian';
import { PluginSettings } from '../../types';
import { scanMarkdown, generateFrontmatter, prependFrontmatter } from '../scanner/documentScanner';
import { wikiLinkTemporalTerms } from '../scanner/temporalTagger';
import { convertDocxToMarkdown } from '../scanner/docxConverter';
import { KeyTermModal } from '../../ui/modals/keyTermModal';
import { log } from '../../protocol/logManager';
import { EntityStore, getOrCreateEntity } from '../metadata/entityStore';
import { BlacklistManager } from '../scanner/blacklistManager';

/**
 * Handle complete document scanning workflow
 * 1. Scan document for tokens and temporal terms
 * 2. Show KeyTermModal for user selection
 * 3. Create entities for selected key terms
 * 4. Wikilink temporal terms
 * 5. Generate and prepend frontmatter
 * 6. Save file with updates
 */
export async function handleDocumentScan(
	app: App,
	vault: Vault,
	file: TFile,
	settings: PluginSettings,
	entityStore?: EntityStore,
	blacklistManager?: BlacklistManager | null
): Promise<void> {
	try {
		let content: string;
		let sourceFile = file;
		
		// Handle DOCX files
		if (file.extension === 'docx') {
			new Notice(`📄 Converting "${file.basename}.docx" to markdown...`);
			
			try {
				// Read DOCX file as binary
				const docxBuffer = await vault.readBinary(file);
				
				// Convert DOCX to Markdown
				content = await convertDocxToMarkdown(docxBuffer, file.basename);
				
				if (!content || content.length === 0) {
					new Notice('❌ Failed to convert DOCX file - result is empty');
					return;
				}
				
				// Create markdown file in vault with same name
				const mdFileName = file.basename + '.md';
				const mdPath = file.parent ? file.parent.path + '/' + mdFileName : mdFileName;
				
				try {
					// Check if markdown file already exists
					const existingMd = vault.getFileByPath(mdPath);
					if (existingMd) {
						// Update existing markdown
						await vault.modify(existingMd, content);
						sourceFile = existingMd;
					} else {
						// Create new markdown file
						const newMd = await vault.create(mdPath, content);
						sourceFile = newMd;
				
						// Open the new markdown file in active editor
						const leaf = app.workspace.getLeaf(false);
						await leaf?.openFile(newMd);
					}
				} catch (error) {
					console.error('Error creating markdown file:', error);
					new Notice('⚠️ Converted content. Could not save markdown file.');
					// Continue with scanning anyway - content is in memory
				}
			} catch (error) {
				console.error('Error converting DOCX:', error);
				new Notice(`❌ Failed to convert DOCX file: ${error}`);
				return;
			}
		} else if (file.extension === 'md') {
			// Handle regular markdown files
			content = await vault.read(file);
		} else {
			new Notice(`⚠️ Unsupported file type: ${file.extension}`);
			return;
		}
		
		if (!content) {
			new Notice('⚠️ File is empty');
			return;
		}

		new Notice(`📄 Scanning "${sourceFile.basename}"...`);

		// Log scanning initiation
		await log(
			vault,
			settings,
			'document-scanning',
			`Started scanning document: ${sourceFile.basename}`,
			{
				filename: sourceFile.basename,
				path: sourceFile.path,
				extension: sourceFile.extension,
			}
		).catch(err => console.warn("Failed to log scan start:", err));

		// Scan the document
		const scanResult = await scanMarkdown(sourceFile, content);

		// Get top tokens by frequency for suggestions
		const suggestedTerms = scanResult.tokens.slice(0, 50).map(t => t.word);

		if (suggestedTerms.length === 0) {
			new Notice('⚠️ No tokens found to suggest');
			return;
		}

		// Show KeyTermModal for user selection
		await showKeyTermSelectionModal(
			app,
			suggestedTerms,
			scanResult.wordCount,
			async (selectedKeyTerms) => {
				// Process selected key terms
				await processKeyTermSelection(
					app,
					vault,
					sourceFile,
					content,
					scanResult,
					selectedKeyTerms,
					settings,
					entityStore
				);
			},
			() => {
				// On cancel
				new Notice('Document scanning cancelled');
			},
			settings,
			blacklistManager
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error('Error scanning document:', error);
		new Notice(`❌ Error scanning document: ${errorMessage}`);
		
		// Log the error
		await log(
			vault,
			settings,
			'document-scanning',
			`❌ Error during document scan: ${errorMessage}`,
			{
				filename: file.basename,
				path: file.path,
				errorStack: error instanceof Error ? error.stack : undefined,
			}
		).catch(err => console.error('Failed to log scan error:', err));
	}
}

/**
 * Show key term selection modal
 */
function showKeyTermSelectionModal(
	app: App,
	suggestedTerms: string[],
	wordCount: number,
	onApply: (selectedTerms: Set<string>) => Promise<void>,
	onCancel: () => void,
	settings: PluginSettings,
	blacklistManager?: BlacklistManager | null
): Promise<void> {
	return new Promise((resolve) => {
		const modal = new KeyTermModal(
			app,
			suggestedTerms,
			settings.chunkSize,
			async (selection) => {
				if (selection.selected.size > 0) {
					await onApply(selection.selected);
				} else {
					new Notice('⚠️ No key terms selected');
				}
				resolve();
			},
			() => {
				onCancel();
				resolve();
			},
			blacklistManager
		);

		// Add info header to modal
		modal.contentEl.prepend(
			(() => {
				const header = document.createElement('div');
				header.style.cssText = 'margin-bottom: 1rem; padding: 0.5rem; background: var(--background-secondary); border-radius: 4px;';
				header.innerHTML = `
					<small style="color: var(--text-muted);">
						<strong>Document scan results:</strong><br>
						Word count: ${wordCount.toLocaleString()}<br>
						Suggested key terms: ${suggestedTerms.length}
					</small>
				`;
				return header;
			})()
		);

		modal.open();
	});
}

/**
 * Process selected key terms and update document
 */
async function processKeyTermSelection(
	app: App,
	vault: Vault,
	file: TFile,
	content: string,
	scanResult: any,
	selectedKeyTerms: Set<string>,
	settings: PluginSettings,
	entityStore?: EntityStore
): Promise<void> {
	try {
		let updatedContent = content;

		// Wikilink temporal terms
		if (scanResult.temporalTerms.length > 0) {
			updatedContent = wikiLinkTemporalTerms(updatedContent, scanResult.temporalTerms);
		}

		// Wikilink selected key terms
		for (const term of selectedKeyTerms) {
			const regex = new RegExp(`\\b${term}\\b`, 'gi');
			const matches = Array.from(updatedContent.matchAll(regex));

			// Replace in reverse order to maintain positions
			for (let i = matches.length - 1; i >= 0; i--) {
				const match = matches[i];
				if (match && match.index !== undefined) {
					const start = match.index;
					const end = match.index + match[0].length;
					const before = updatedContent.substring(0, start);
					const after = updatedContent.substring(end);
					updatedContent = `${before}[[${term}]]${after}`;
				}
			}
		}

		// Generate frontmatter with selected key terms
		const frontmatter = generateFrontmatter(scanResult, Array.from(selectedKeyTerms));

		// Prepend frontmatter to content
		updatedContent = frontmatter + updatedContent;

		// Write updated content back to file
		await vault.modify(file, updatedContent);

		// Create/update entities in entity store
		if (entityStore) {
			let newCount = 0;
			let updatedCount = 0;

			for (const keyTerm of selectedKeyTerms) {
				const existing = entityStore.findByName(keyTerm);
				if (!existing) {
					const entity = getOrCreateEntity(entityStore, keyTerm);
					entity.sources = [{
						document: file.path,
						lineNumbers: scanResult.tokens
							.find((t: any) => t.word === keyTerm)
							?.positions.map((p: number) => content.substring(0, p).split('\n').length) || [1],
					}];
					entity.tags = [...(scanResult.isChapter ? ['chapter'] : ['document']), ...scanResult.temporalTerms.map((t: any) => `temporal:${t.term}`)];
					entityStore.updateEntity(entity.id, entity);
					newCount++;
				} else {
					existing.frequency = (existing.frequency || 1) + 1;
					existing.sources.push({
						document: file.path,
						lineNumbers: scanResult.tokens
							.find((t: any) => t.word === keyTerm)
							?.positions.map((p: number) => content.substring(0, p).split('\n').length) || [1],
					});
					entityStore.updateEntity(existing.id, existing);
					updatedCount++;
				}
			}

			// Persist entities
			await entityStore.persist();

			// Log the scan
			await log(
				vault,
				settings,
				'document-scanning',
				`Scanned and processed "${file.basename}"`,
				{
					filePath: file.path,
					wordCount: scanResult.wordCount,
					keyTermsSelected: selectedKeyTerms.size,
					temporalTermsFound: scanResult.temporalTerms.length,
					newEntities: newCount,
					updatedEntities: updatedCount,
					isChapter: scanResult.isChapter,
				}
			);

			new Notice(`✅ Scan complete: ${newCount} new, ${updatedCount} updated entities, ${Array.from(selectedKeyTerms).length} key terms wikilinked`);
		} else {
			new Notice(`✅ Document updated: ${Array.from(selectedKeyTerms).length} key terms wikilinked, frontmatter added`);
		}
	} catch (error) {
		console.error('Error processing key terms:', error);
		new Notice(`❌ Error processing key terms: ${error}`);
	}
}
