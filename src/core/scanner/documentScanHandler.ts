/**
 * Document Scan Handler - Encapsulates document scanning workflow
 *
 * Responsibilities:
 * - DOCX conversion and markdown file creation
 * - Key term selection modal display
 * - Entity creation and persistence
 * - Hub/glossary updates
 * - File modifications and logging
 */

import { App, Notice, TFile, Vault } from 'obsidian';
import { PluginSettings, DocScanResult } from '../../types';
import { scanMarkdown, generateFrontmatter } from '../scanner/documentScanner';
import { wikiLinkTemporalTerms } from '../scanner/temporalTagger';
import { convertDocxToMarkdown } from '../scanner/docxConverter';
import { KeyTermModal } from '../../ui/modals/keyTermModal';
import { log, logScanError, logEntityError, logScanSummary, ScanErrorType } from '../../protocol/logManager';
import { EntityStore, getOrCreateEntity } from '../metadata/entityStore';
import { HubManager } from '../metadata/hubManager';
import { GlossaryManager } from '../metadata/glossaryManager';
import { BlacklistManager } from '../scanner/blacklistManager';

interface ScanMetrics {
	startTime: number;
	warnings: Array<{ type: string; message: string; count?: number }>;
	errors: Array<{ type: ScanErrorType; message: string; context?: Record<string, unknown> }>;
	newEntitiesCount: number;
	updatedEntitiesCount: number;
	hubsDetected: number;
	docxConverted: boolean;
	markdownCreated: boolean;
}

export class DocumentScanHandler {
	private app: App;
	private vault: Vault;
	private settings: PluginSettings;
	private entityStore?: EntityStore;
	private hubManager?: HubManager | null;
	private glossaryManager?: GlossaryManager | null;
	private blacklistManager?: BlacklistManager | null;
	private scanMetrics: ScanMetrics = {
		startTime: 0,
		warnings: [],
		errors: [],
		newEntitiesCount: 0,
		updatedEntitiesCount: 0,
		hubsDetected: 0,
		docxConverted: false,
		markdownCreated: false,
	};

	constructor(
		app: App,
		vault: Vault,
		settings: PluginSettings,
		entityStore?: EntityStore,
		hubManager?: HubManager | null,
		glossaryManager?: GlossaryManager | null,
		blacklistManager?: BlacklistManager | null
	) {
		this.app = app;
		this.vault = vault;
		this.settings = settings;
		this.entityStore = entityStore;
		this.hubManager = hubManager;
		this.glossaryManager = glossaryManager;
		this.blacklistManager = blacklistManager;
	}

	/**
	 * Main entry point: execute complete document scanning workflow
	 */
	async scan(file: TFile): Promise<void> {
		// Initialize metrics for this scan
		this.scanMetrics = {
			startTime: Date.now(),
			warnings: [],
			errors: [],
			newEntitiesCount: 0,
			updatedEntitiesCount: 0,
			hubsDetected: 0,
			docxConverted: false,
			markdownCreated: false,
		};

		try {
			let content: string;
			let sourceFile = file;

			// Step 1: Convert DOCX if needed, get markdown content
			const conversionResult = await this.convertDocxIfNeeded(file);
			if (!conversionResult) {
				this.scanMetrics.errors.push({
					type: "docx-conversion",
					message: "DOCX conversion failed or file type unsupported",
					context: { attemptedFile: file.path },
				});
				await this.finalizeScan(file, 0, 0, 0);
				return;
			}

			content = conversionResult.content;
			sourceFile = conversionResult.file;

			if (!content) {
				new Notice('File is empty');
				this.scanMetrics.warnings.push({
					type: "empty-file",
					message: `File "${file.basename}" is empty`,
				});
				await this.finalizeScan(file, 0, 0, 0);
				return;
			}

			// Step 2: Scan document for tokens and temporal terms
			const scanResult = await scanMarkdown(sourceFile, content);

			// Step 3: Show key term selection modal
			await this.showKeyTermModal(sourceFile, content, scanResult);
		} catch (error) {
			this.scanMetrics.errors.push({
				type: "unknown",
				message: error instanceof Error ? error.message : String(error),
				context: { stackTrace: error instanceof Error ? error.stack : undefined },
			});
			await this.handleError(file, error);
			await this.finalizeScan(file, 0, 0, 0);
		}
	}

	/**
	 * Convert DOCX file to markdown if needed
	 */
	private async convertDocxIfNeeded(
		file: TFile
	): Promise<{ content: string; file: TFile } | null> {
		if (file.extension === 'docx') {
			new Notice(`Converting ${file.basename}.docx to markdown...`);
			try {
				const docxBuffer = await this.vault.readBinary(file);
				const content = await convertDocxToMarkdown(docxBuffer, file.basename);

				if (!content || content.length === 0) {
					const errorMsg = 'DOCX conversion returned empty content';
					new Notice('Failed to convert DOCX file - result is empty');
					this.scanMetrics.errors.push({
						type: "docx-conversion",
						message: errorMsg,
						context: { fileName: file.basename },
					});
					await logScanError(
						this.vault,
						this.settings,
						"docx-conversion",
						errorMsg,
						{ fileName: file.basename, filePath: file.path }
					).catch(() => {});
					return null;
				}

				const mdFileName = file.basename + '.md';
				const mdPath = file.parent ? file.parent.path + '/' + mdFileName : mdFileName;

				try {
					const existingMd = this.vault.getFileByPath(mdPath);
					if (existingMd) {
						await this.vault.modify(existingMd, content);
						this.scanMetrics.docxConverted = true;
						return { content, file: existingMd };
					} else {
						const newMd = await this.vault.create(mdPath, content);
						this.scanMetrics.docxConverted = true;
						this.scanMetrics.markdownCreated = true;
						const leaf = this.app.workspace.getLeaf(false);
						await leaf?.openFile(newMd);
						return { content, file: newMd };
					}
				} catch (error) {
					const errorMsg = `Failed to create/modify markdown file: ${error instanceof Error ? error.message : String(error)}`;
					console.error('Error creating markdown file:', error);
					new Notice('Converted content. Could not save markdown file.');
					this.scanMetrics.warnings.push({
						type: "markdown-creation",
						message: errorMsg,
					});
					await logScanError(
						this.vault,
						this.settings,
						"markdown-creation",
						errorMsg,
						{
							fileName: file.basename,
							filePath: file.path,
							errorStack: error instanceof Error ? error.stack : undefined,
						}
					).catch(() => {});
					return { content, file };
				}
			} catch (error) {
				const errorMsg = `DOCX conversion failed: ${error instanceof Error ? error.message : String(error)}`;
				console.error('Error converting DOCX:', error);
				new Notice(`Failed to convert DOCX file: ${error}`);
				this.scanMetrics.errors.push({
					type: "docx-conversion",
					message: errorMsg,
					context: { fileName: file.basename, errorStack: error instanceof Error ? error.stack : undefined },
				});
				await logScanError(
					this.vault,
					this.settings,
					"docx-conversion",
					errorMsg,
					{
						fileName: file.basename,
						filePath: file.path,
						errorStack: error instanceof Error ? error.stack : undefined,
					}
				).catch(() => {});
				return null;
			}
		} else if (file.extension === 'md') {
			const content = await this.vault.read(file);
			return { content, file };
		} else {
			const errorMsg = `Unsupported file type: ${file.extension}`;
			new Notice(errorMsg);
			this.scanMetrics.errors.push({
				type: "docx-conversion",
				message: errorMsg,
				context: { fileName: file.basename, fileExtension: file.extension },
			});
			await logScanError(
				this.vault,
				this.settings,
				"docx-conversion",
				errorMsg,
				{ fileName: file.basename, filePath: file.path }
			).catch(() => {});
			return null;
		}
	}

	/**
	 * Show key term selection modal and process selection
	 */
	private async showKeyTermModal(
		file: TFile,
		content: string,
		scanResult: DocScanResult
	): Promise<void> {
		// Get top tokens by frequency for suggestions
		const suggestedTerms = scanResult.tokens.slice(0, 50).map((t) => t.word);

		if (suggestedTerms.length === 0) {
			new Notice('No tokens found to suggest');
			return;
		}

		return new Promise((resolve) => {
			const modal = new KeyTermModal(
				this.app,
				suggestedTerms,
				this.settings.chunkSize,
				async (selection) => {
					if (selection.selected.size > 0) {
						await this.processKeyTermSelection(
							file,
							content,
							scanResult,
							selection.selected
						);
					} else {
						new Notice('No key terms selected');
					}
					resolve();
				},
				() => {
					new Notice('Scanning cancelled');
					resolve();
				},
				this.blacklistManager,
				scanResult.wordCount
			);

			modal.open();
		});
	}

	/**
	 * Process selected key terms: wikilink, update frontmatter, persist entities
	 */
	private async processKeyTermSelection(
		file: TFile,
		content: string,
		scanResult: DocScanResult,
		selectedKeyTerms: Set<string>
	): Promise<void> {
		try {
			let updatedContent = content;

			// Wikilink temporal terms
			if (scanResult.temporalTerms.length > 0) {
				updatedContent = wikiLinkTemporalTerms(updatedContent, scanResult.temporalTerms);
			}

			// Wikilink selected key terms
			updatedContent = this.wikiLinkKeyTerms(updatedContent, selectedKeyTerms);

			// Generate and prepend frontmatter
			const frontmatter = generateFrontmatter(
				scanResult,
				Array.from(selectedKeyTerms)
			);
			updatedContent = frontmatter + updatedContent;

			// Write updated content to file
			try {
				await this.vault.modify(file, updatedContent);
			} catch (error) {
				const errorMsg = `Failed to write updated content to file: ${error instanceof Error ? error.message : String(error)}`;
				this.scanMetrics.errors.push({
					type: "persistence",
					message: errorMsg,
					context: { filePath: file.path },
				});
				new Notice(`Failed to save file: ${errorMsg}`);
				await logScanError(
					this.vault,
					this.settings,
					"persistence",
					errorMsg,
					{
						fileName: file.basename,
						filePath: file.path,
						errorStack: error instanceof Error ? error.stack : undefined,
					}
				).catch(() => {});
				throw error;
			}

			// Create/update entities and track counts
			const { newCount, updatedCount } = await this.createAndUpdateEntities(
				file,
				content,
				scanResult,
				selectedKeyTerms
			);

			// Detect hubs (co-occurrences)
			await this.detectHubs(updatedContent, selectedKeyTerms, file);

			// Log and notify
			await this.logScan(file, scanResult, selectedKeyTerms, newCount, updatedCount);
			this.notifyCompletion(newCount, updatedCount, selectedKeyTerms.size);

			// Finalize and log summary
			await this.finalizeScan(file, newCount, updatedCount, updatedContent.length);
		} catch (error) {

			console.error('Error processing key term selection:', error);
			await this.finalizeScan(file, 0, 0, 0);
		}
	}

	/**
	 * Wikilink selected key terms in content
	 */
	private wikiLinkKeyTerms(content: string, terms: Set<string>): string {
		let result = content;

		for (const term of terms) {
			const regex = new RegExp(`\\b${term}\\b`, 'gi');
			const matches = Array.from(result.matchAll(regex));

			// Replace in reverse order to maintain positions
			for (let i = matches.length - 1; i >= 0; i--) {
				const match = matches[i];
				if (match && match.index !== undefined) {
					const start = match.index;
					const end = match.index + match[0].length;
					const before = result.substring(0, start);
					const after = result.substring(end);
					result = `${before}[[${term}]]${after}`;
				}
			}
		}

		return result;
	}

	/**
	 * Create new entities and update existing ones
	 */
	private async createAndUpdateEntities(
		file: TFile,
		content: string,
		scanResult: DocScanResult,
		selectedKeyTerms: Set<string>
	): Promise<{ newCount: number; updatedCount: number }> {
		let newCount = 0;
		let updatedCount = 0;
		const failedEntities: Array<{ name: string; reason: string }> = [];

		if (!this.entityStore) return { newCount, updatedCount };

		for (const keyTerm of selectedKeyTerms) {
			try {
				const existing = this.entityStore.findByName(keyTerm);
				const token = scanResult.tokens.find((t) => t.word === keyTerm);
				const lineNumbers = token
					? token.positions.map(
							(p: number) => content.substring(0, p).split('\n').length
					  )
					: [1];

				if (!existing) {
					try {
						const entity = getOrCreateEntity(this.entityStore, keyTerm);
						entity.sources = [
							{
								document: file.path,
								lineNumbers,
							},
						];
						entity.tags = [
							...(scanResult.isChapter ? ['chapter'] : ['document']),
							...scanResult.temporalTerms.map((t) => `temporal:${t.term}`),
						];
						this.entityStore.updateEntity(entity.id, entity);
						newCount++;
					} catch (error) {
						const errorMsg = error instanceof Error ? error.message : String(error);
						failedEntities.push({ name: keyTerm, reason: `Creation failed: ${errorMsg}` });
						await logEntityError(
							this.vault,
							this.settings,
							"create",
							keyTerm,
							errorMsg
						).catch(() => {});
					}
				} else {
					try {
						existing.frequency = (existing.frequency || 1) + 1;
						existing.sources.push({
							document: file.path,
							lineNumbers,
						});
						this.entityStore.updateEntity(existing.id, existing);
						updatedCount++;
					} catch (error) {
						const errorMsg = error instanceof Error ? error.message : String(error);
						failedEntities.push({ name: keyTerm, reason: `Update failed: ${errorMsg}` });
						await logEntityError(
							this.vault,
							this.settings,
							"update",
							keyTerm,
							errorMsg
						).catch(() => {});
					}
				}
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				failedEntities.push({ name: keyTerm, reason: `Processing failed: ${errorMsg}` });
			}
		}

		// Track metrics
		this.scanMetrics.newEntitiesCount = newCount;
		this.scanMetrics.updatedEntitiesCount = updatedCount;

		// Log failures if any occurred
		if (failedEntities.length > 0) {
			this.scanMetrics.warnings.push({
				type: "entity-creation-partial",
				message: `${failedEntities.length} entities failed to create/update`,
				count: failedEntities.length,
			});
			await logScanError(
				this.vault,
				this.settings,
				"entity-creation",
				`Partial failure creating/updating entities`,
				{
					fileName: file.basename,
					filePath: file.path,
					failedEntities: failedEntities.map((e) => e.name),
					partialSuccess: newCount > 0 || updatedCount > 0,
					successCount: newCount + updatedCount,
					failureCount: failedEntities.length,
					additionalInfo: {
						failures: failedEntities.map((e) => ({ entity: e.name, reason: e.reason })),
					},
				}
			).catch(() => {});
		}

		try {
			await this.entityStore.persist();
		} catch (error) {
			const errorMsg = `Failed to persist entities: ${error instanceof Error ? error.message : String(error)}`;
			this.scanMetrics.errors.push({
				type: "persistence",
				message: errorMsg,
				context: { filePath: file.path },
			});
			await logScanError(
				this.vault,
				this.settings,
				"persistence",
				errorMsg,
				{
					fileName: file.basename,
					filePath: file.path,
					successCount: newCount + updatedCount,
					errorStack: error instanceof Error ? error.stack : undefined,
				}
			).catch(() => {});
		}

		return { newCount, updatedCount };
	}

	/**
	 * Detect entity co-occurrences for hub building
	 */
	private async detectHubs(
		content: string,
		selectedKeyTerms: Set<string>,
		file: TFile
	): Promise<void> {
		if (!this.hubManager || selectedKeyTerms.size === 0) return;

		try {
			const sentences = content
				.split(/[.!?]+/)
				.filter((s) => s.trim().length > 0);
			const sentenceEntities = new Map<string, string[]>();

			for (const sentence of sentences) {
				const entityIds = new Set<string>();
				for (const term of selectedKeyTerms) {
					if (sentence.toLowerCase().includes(term.toLowerCase())) {
						const entity = this.entityStore?.findByName(term);
						if (entity?.id) {
							entityIds.add(entity.id);
						}
					}
				}
				// Only track sentences with 2+ entities
				if (entityIds.size >= 2) {
					sentenceEntities.set(sentence.trim(), Array.from(entityIds));
				}
			}

			if (sentenceEntities.size > 0) {
				await this.hubManager.detectCoOccurrences(
					sentenceEntities,
					file.path
				);
				this.scanMetrics.hubsDetected = sentenceEntities.size;
				console.debug(
					`Hub: Detected co-occurrences in ${sentenceEntities.size} sentences`
				);
			}
		} catch (error) {
			const errorMsg = `Hub detection failed: ${error instanceof Error ? error.message : String(error)}`;
			console.warn('Hub detection error (non-fatal):', error);
			this.scanMetrics.warnings.push({
				type: "hub-detection",
				message: errorMsg,
			});
			await logScanError(
				this.vault,
				this.settings,
				"hub-detection",
				errorMsg,
				{
					fileName: file.basename,
					filePath: file.path,
					errorStack: error instanceof Error ? error.stack : undefined,
				}
			).catch(() => {});
		}
	}

	/**
	 * Log the scan operation
	 */
	private async logScan(
		file: TFile,
		scanResult: DocScanResult,
		selectedKeyTerms: Set<string>,
		newCount: number,
		updatedCount: number
	): Promise<void> {
		if (!this.entityStore) return;

		await log(
			this.vault,
			this.settings,
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
	}

	/**
	 * Show completion notification
	 */
	private notifyCompletion(
		newCount: number,
		updatedCount: number,
		termsCount: number
	): void {
		if (this.entityStore) {
			new Notice(
				`✅ Scan complete: ${newCount} new, ${updatedCount} updated entities, ${termsCount} key terms wikilinked`
			);
		} else {
			new Notice(
				`✅ Document updated: ${termsCount} key terms wikilinked, frontmatter added`
			);
		}
	}

	/**
	 * Handle and log errors
	 */
	private async handleError(file: TFile, error: unknown): Promise<void> {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		console.error('Error scanning document:', error);
		new Notice(`Error scanning document: ${errorMessage}`);

		await logScanError(
			this.vault,
			this.settings,
			"unknown",
			errorMessage,
			{
				fileName: file.basename,
				filePath: file.path,
				errorStack: error instanceof Error ? error.stack : undefined,
			}
		).catch((err) => console.error('Failed to log scan error:', err));
	}

	/**
	 * Finalize scan and log comprehensive summary
	 */
	private async finalizeScan(
		file: TFile,
		newEntities: number,
		updatedEntities: number,
		fileSize: number
	): Promise<void> {
		const executionTimeMs = Date.now() - this.scanMetrics.startTime;

		try {
			// Calculate total processed (entities created/updated)
			const totalProcessed = newEntities + updatedEntities;

			await logScanSummary(
				this.vault,
				this.settings,
				file.path,
				file.basename,
				{
					totalProcessed,
					newEntities,
					updatedEntities,
					keyTermsWikilinked: totalProcessed > 0 ? totalProcessed : 0,
					temporalTermsFound: 0, // Could be enhanced with actual count
					hubsDetected: this.scanMetrics.hubsDetected,
					docxConverted: this.scanMetrics.docxConverted,
					markdownCreated: this.scanMetrics.markdownCreated,
					warnings: this.scanMetrics.warnings,
					errors: this.scanMetrics.errors,
					executionTimeMs,
				}
			).catch((err) => console.error('Failed to log scan summary:', err));
		} catch (error) {
			console.error('Error finalizing scan:', error);
		}
	}
}
