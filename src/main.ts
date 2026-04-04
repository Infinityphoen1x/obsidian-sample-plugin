import { Plugin, Platform, Notice, MarkdownView, TFile } from "obsidian";
import { PluginSettings, DEFAULT_SETTINGS } from "./types";
import { MetadataOrganizerSettingTab } from "./settings";
import { initializeProtocolFolder } from "./protocol/protocolManager";
import { log } from "./protocol/logManager";
import { scanMarkdown } from "./core/scanner/documentScanner";
import { EntityStore, getOrCreateEntity } from "./core/metadata/entityStore";
import { buildIndex, saveIndex } from "./core/metadata/indexFile";

/**
 * Metadata Organizer Plugin
 *
 * A visual metadata management system for Obsidian that allows users to:
 * - Scan documents for key terms and entities
 * - Organize entities into groups
 * - Generate linked parent/child notes
 * - Create and manage timelines with temporal tagging
 * - Cross-reference entities and create relationship maps
 */
export default class MetadataOrganizerPlugin extends Plugin {
	settings: PluginSettings;
	entityStore: EntityStore | null = null;

	async onload() {
		console.log("Loading Metadata Organizer Plugin...");

		// Load settings
		await this.loadSettings();

		// Register settings tab
		this.addSettingTab(new MetadataOrganizerSettingTab(this.app, this));

		// Show mobile warning if applicable
		if (Platform.isMobile && this.settings.mobileWarning) {
			new Notice(
				"⚠️ Metadata Organizer has limited mobile support. " +
				"Many features are Desktop-only. " +
				"See Settings for alternatives.",
				5000
			);
		}

		// Initialize protocol folder
		try {
			await initializeProtocolFolder(this.app.vault, this.settings);
		} catch (error) {
			console.error("Failed to initialize protocol folder:", error);
			new Notice("❌ Failed to initialize protocol folder. Check console.");
		}

		// Initialize entity store
		try {
			this.entityStore = new EntityStore(
				this.app.vault,
				this.settings.protocolFolderName,
				this.settings.masterMetadataFile
			);
			await this.entityStore.loadEntities();
			console.log("Entity store initialized with cached entities");
		} catch (error) {
			console.error("Failed to initialize entity store:", error);
		}

		// Register commands
		this.registerCommands();

		console.log("Metadata Organizer Plugin loaded successfully");
	}

	onunload() {
		console.log("Unloading Metadata Organizer Plugin");
		// Cleanup: unregister listeners, save state
	}

	private registerCommands(): void {
		// Scan Document command
		this.addCommand({
			id: "metadata-organizer-scan-document",
			name: "Scan document for metadata",
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView && markdownView.file) {
					if (!checking) {
						this.scanDocument(markdownView.file);
					}
					return true;
				}
				return false;
			},
		});

		// Metadata Review command (Phase 2)
		this.addCommand({
			id: "metadata-organizer-review",
			name: "Review and organize metadata",
			callback: () => {
				new Notice("Metadata review modal - coming in Phase 2");
			},
		});

		// Sub-metadata command (Phase 3)
		this.addCommand({
			id: "metadata-organizer-sub-metadata",
			name: "Create entity notes",
			callback: () => {
				new Notice("Entity note creation - coming in Phase 3");
			},
		});

		// Timeline command (Phase 4)
		this.addCommand({
			id: "metadata-organizer-timeline",
			name: "Open timeline editor",
			callback: () => {
				new Notice("Timeline editor - coming in Phase 4");
			},
		});
	}

	private async scanDocument(file: TFile): Promise<void> {
		if (!this.entityStore) {
			new Notice("❌ Entity store not initialized");
			return;
		}

		try {
			// Read file content
			const content = await this.app.vault.read(file);
			if (!content) {
				new Notice("⚠️ File is empty");
				return;
			}

			// Show scanning notice
			new Notice(`📄 Scanning "${file.basename}"...`);

			// Scan the document
			const scanResult = await scanMarkdown(file, content);

			// Get top tokens by frequency
			const topTokens = scanResult.tokens.slice(0, 50); // Top 50 terms
			let newEntitiesCount = 0;
			let updatedEntitiesCount = 0;

			// Create or update entities
			for (const token of topTokens) {
				const existing = this.entityStore.findByName(token.word);
				if (!existing) {
					const entity = getOrCreateEntity(this.entityStore, token.word);
					// Update frequency and sources
					entity.frequency = token.frequency;
					entity.sources = [
						{
							document: file.path,
							lineNumbers: token.positions.map((p) => {
								// Estimate line number (rough approximation)
								return content.substring(0, p).split("\n").length;
							}),
						},
					];
					entity.tags = scanResult.isChapter ? ["chapter"] : ["document"];
					this.entityStore.updateEntity(entity.id, entity);
					newEntitiesCount++;
				} else {
					// Update existing entity with new frequency and sources
					existing.frequency += token.frequency;
					existing.sources.push({
						document: file.path,
						lineNumbers: token.positions.map((p) => {
							return content.substring(0, p).split("\n").length;
						}),
					});
					this.entityStore.updateEntity(existing.id, existing);
					updatedEntitiesCount++;
				}
			}

			// Persist entities
			await this.entityStore.persist();

			// Log the scan session
			await log(
				this.app.vault,
				this.settings,
				"document-scanning",
				`Scanned "${file.basename}"`,
				{
					filePath: file.path,
					wordCount: scanResult.wordCount,
					tokensFound: scanResult.uniqueTokenCount,
					newEntities: newEntitiesCount,
					updatedEntities: updatedEntitiesCount,
					isChapter: scanResult.isChapter,
					temporalTermsFound: scanResult.temporalTerms.length,
				}
			);

			// Show completion notice
			new Notice(
				`✅ Scan complete: ${newEntitiesCount} new, ${updatedEntitiesCount} updated`
			);

			console.log(
				`Scanned ${file.basename}: ${newEntitiesCount} new entities, ` +
				`${updatedEntitiesCount} updated`
			);
		} catch (error) {
			console.error("Error scanning document:", error);
			new Notice(`❌ Error scanning document: ${error}`);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
