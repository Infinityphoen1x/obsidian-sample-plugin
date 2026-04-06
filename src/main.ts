import { Plugin, Platform, Notice, MarkdownView, TFile } from "obsidian";
import { PluginSettings, DEFAULT_SETTINGS } from "./types";
import { MetadataOrganizerSettingTab } from "./settings";
import { initializeProtocolFolder } from "./protocol/protocolManager";
import { log } from "./protocol/logManager";
import { handleDocumentScan } from "./core/scanner/scannerHandlers";
import { EntityStore, getOrCreateEntity } from "./core/metadata/entityStore";
import { TimelineManager } from "./core/metadata/timelineManager";
import { HubManager } from "./core/metadata/hubManager";
import { GlossaryManager } from "./core/metadata/glossaryManager";
import { buildIndex, saveIndex } from "./core/metadata/indexFile";
import { handleMetadataReview, handleSubMetadata, handleTimeline, handleDescriptionModal } from "./ui/handlers/modalHandlers";
import { TimelineEvent } from "./types";
import { TimelineView } from "./ui/views/timelineView";
import { MainPanelView } from "./ui/views/mainPanelView";

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
	timelineManager: TimelineManager | null = null;
	hubManager: HubManager | null = null;
	glossaryManager: GlossaryManager | null = null;

	async onload() {
		console.log("Loading Metadata Organizer Plugin...");

		// Load settings
		await this.loadSettings();

		// Register settings tab
		this.addSettingTab(new MetadataOrganizerSettingTab(this.app, this));

		// Register views
		this.registerView(
			TimelineView.VIEW_TYPE,
			(leaf) => new TimelineView(leaf)
		);
		this.registerView(
			MainPanelView.VIEW_TYPE,
			(leaf) => new MainPanelView(leaf)
		);

		// Show mobile warning if applicable
		if (Platform.isMobile && this.settings.mobileWarning) {
			new Notice(
				"⚠️ Metadata Organizer has limited mobile support. " +
				"Many features are Desktop-only. " +
				"See Settings for alternatives.",
				5000
			);
			
			// Auto-downgrade timeline mode to static on mobile
			if (this.settings.timelineMode === "interactive") {
				this.settings.timelineMode = "static";
				await this.saveSettings();
			}
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

		// Initialize timeline manager
		try {
			this.timelineManager = new TimelineManager(this.app.vault, this.settings.protocolFolderName);
			await this.timelineManager.loadTimeline();
			console.log("Timeline manager initialized with cached snapshots");
		} catch (error) {
			console.error("Failed to initialize timeline manager:", error);
		}

		// Initialize hub manager
		try {
			this.hubManager = new HubManager(this.app.vault, this.settings.protocolFolderName, this.settings);
			await this.hubManager.loadHub();
			console.log("Hub manager initialized with cached cross-references");
		} catch (error) {
			console.error("Failed to initialize hub manager:", error);
		}

		// Initialize glossary manager
		try {
			this.glossaryManager = new GlossaryManager(this.app.vault, this.settings.protocolFolderName, this.settings);
			await this.glossaryManager.loadGlossary();
			console.log("Glossary manager initialized");
		} catch (error) {
			console.error("Failed to initialize glossary manager:", error);
		}

		// Register commands
		this.registerCommands();

		// Register context menu for description editing
		this.registerDescriptionContextMenu();

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

		// Metadata Review command
		this.addCommand({
			id: "metadata-organizer-review",
			name: "Review and organize metadata",
			callback: async () => {
				if (!this.entityStore) {
					new Notice("❌ Entity store not initialized");
					return;
				}

				const entities = this.entityStore.getAllEntities();
				if (entities.length === 0) {
					new Notice("⚠️ No entities found. Scan a document first.");
					return;
				}

				await handleMetadataReview(
					this.app,
					this.app.vault,
					entities,
					this.settings,
					this.entityStore
				);
			},
		});

		// Sub-metadata command
		this.addCommand({
			id: "metadata-organizer-sub-metadata",
			name: "Create entity notes",
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView && markdownView.file) {
					// Check if file is a parent note (has type: parent in frontmatter)
					if (!checking) {
						this.handleSubMetadataCommand(markdownView.file);
					}
					return true;
				}
				return false;
			},
		});

		// Timeline command
		this.addCommand({
			id: "metadata-organizer-timeline",
			name: "Open timeline editor",
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView && markdownView.file) {
					if (!checking) {
						this.handleTimelineCommand(markdownView.file);
					}
					return true;
				}
				return false;
			},
		});
	}

	private async scanDocument(file: TFile): Promise<void> {
		if (!this.entityStore) {
			new Notice("❌ Entity store not initialized");
			return;
		}

		await handleDocumentScan(
			this.app,
			this.app.vault,
			file,
			this.settings,
			this.entityStore
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<PluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handleSubMetadataCommand(file: TFile): Promise<void> {
		if (!this.entityStore) {
			new Notice("❌ Entity store not initialized");
			return;
		}

		// For now, get all entities as keywords
		// In production: parse frontmatter to get group-specific keywords
		const entities = this.entityStore.getAllEntities();
		if (entities.length === 0) {
			new Notice("⚠️ No entities found. Scan a document first.");
			return;
		}

		// Determine folder from file path
		const folder = file.parent?.path || "entities";

		await handleSubMetadata(
			this.app,
			this.app.vault,
			entities,
			folder + "/",
			file.path,
			this.settings
		);
	}

	private async handleTimelineCommand(file: TFile): Promise<void> {
		// Create mock timeline events from document
		// In production: parse temporal terms from document scan
		const mockEvents: TimelineEvent[] = [
			{
				id: "evt_1",
				sentence: "First event in the story",
				text: "First event in the story",
				source: { document: file.path, line: 1 },
				temporalTerms: ["once"],
				order: 0,
				status: "draft",
				isCustom: false,
			},
			{
				id: "evt_2",
				sentence: "Second event unfolds",
				text: "Second event unfolds",
				source: { document: file.path, line: 10 },
				temporalTerms: ["then"],
				order: 1,
				status: "draft",
				isCustom: false,
			},
		];

		await handleTimeline(
			this.app,
			this.app.vault,
			mockEvents,
			file.path,
			this.settings,
			this.timelineManager || undefined
		);
	}

	private registerDescriptionContextMenu(): void {
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				// Get selected text
				const selectedText = editor.getSelection().trim();

				if (selectedText.length === 0) {
					return; // No text selected
				}

				if (!this.entityStore) {
					return; // Entity store not ready
				}

				// Get all entities - in production could filter based on selected text
				const entities = this.entityStore.getAllEntities();

				if (entities.length === 0) {
					return; // No entities to edit
				}

				// Add context menu item
				menu.addItem((item) => {
					item
						.setTitle("Edit description (Metadata Organizer)")
						.setIcon("pencil")
						.onClick(async () => {
							if (!this.entityStore) {
								new Notice("❌ Entity store not initialized");
								return;
							}

							await handleDescriptionModal(
								this.app,
								this.app.vault,
								selectedText,
								entities,
								this.entityStore,
								this.settings
							);
						});
				});
			})
		);
	}
}
