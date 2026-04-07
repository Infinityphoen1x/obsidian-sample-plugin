import { Plugin, Notice, MarkdownView, TFile } from "obsidian";
import { PluginSettings } from "../../types";
import { EntityStore } from "../../core/metadata/entityStore";
import { TimelineManager } from "../../core/metadata/timelineManager";
import { HubManager } from "../../core/metadata/hubManager";
import { GlossaryManager } from "../../core/metadata/glossaryManager";
import { BlacklistManager } from "../../core/scanner/blacklistManager";
import { handleDocumentScan } from "../../core/scanner/scannerHandlers";
import { handleMetadataReview, handleSubMetadata, handleTimeline } from "../handlers/modalHandlers";
import { TimelineEvent } from "../../types";

export interface MetadataCommandContext {
	plugin: Plugin;
	settings: PluginSettings;
	entityStore: EntityStore | null;
	timelineManager: TimelineManager | null;
	hubManager: HubManager | null;
	glossaryManager: GlossaryManager | null;
	blacklistManager: BlacklistManager | null;
}

/**
 * Register metadata-related commands
 */
export function registerMetadataCommands(context: MetadataCommandContext): void {
	const { plugin, settings, entityStore, timelineManager, hubManager, glossaryManager, blacklistManager } = context;

	// Scan Document command
	plugin.addCommand({
		id: "metadata-organizer-scan-document",
		name: "Scan document for metadata",
		checkCallback: (checking: boolean) => {
			console.debug("[Command] Scan document checkCallback called, checking:", checking);
			
			// Try to get active file (works for both md and docx)
			let file = plugin.app.workspace.getActiveFile();
			console.debug("[Command] getActiveFile() result:", file);
			
			// If no active file, try to get from markdown view or any file view
			if (!file) {
				const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (view?.file) {
					file = view.file;
					console.debug("[Command] Got file from MarkdownView:", file);
				}
			}
			
			if (!file) {
				console.debug("[Command] No active file found in any view");
				if (!checking) {
					new Notice("No file open. Open a markdown or docx file first.");
				}
				return false;
			}

			const supportedExtensions = ["md", "docx"];
			const isSupported = supportedExtensions.includes(file.extension);
			console.debug("[Command] File extension:", file.extension, "Supported:", isSupported);
			
			if (!checking && isSupported) {
				console.debug("[Command] Starting document scan for:", file.path);
				void (async () => {
					try {
						await scanDocument(file, plugin, settings, entityStore, hubManager, glossaryManager, blacklistManager);
						console.debug("[Command] Document scan completed");
					} catch (error) {
						console.error("[Command] Error during scan:", error);
						new Notice(`❌ Error scanning document: ${error}`);
					}
				})();
			}
			
			if (!checking && !isSupported) {
				new Notice(`Unsupported file type: ${file.extension}. Use .md or .docx files.`);
			}
			
			return isSupported;
		},
	});

	// Metadata Review command
	plugin.addCommand({
		id: "metadata-organizer-review",
		name: "Review and organize metadata",
		callback: async () => {
			if (!entityStore) {
				new Notice("Entity store not initialized");
				return;
			}

			const entities = entityStore.getAllEntities();
			if (entities.length === 0) {
				new Notice("No entities found. Scan a document first.");
				return;
			}

			await handleMetadataReview(
				plugin.app,
				plugin.app.vault,
				entities,
				settings,
				entityStore,
				glossaryManager
			);
		},
	});

	// Sub-metadata command
	plugin.addCommand({
		id: "metadata-organizer-sub-metadata",
		name: "Create entity notes",
		checkCallback: (checking: boolean) => {
			const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView && markdownView.file) {
				if (!checking) {
					console.debug("[Sub-metadata Command] Executing for file:", markdownView.file.path);
					void handleSubMetadataCommand(markdownView.file, plugin, settings, entityStore);
				}
				return true;
			}
			return false;
		},
	});

	// Timeline command
	plugin.addCommand({
		id: "metadata-organizer-timeline",
		name: "Open timeline editor",
		checkCallback: (checking: boolean) => {
			const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
			if (markdownView && markdownView.file) {
				if (!checking) {
					console.debug("[Timeline Command] Executing for file:", markdownView.file.path);
					void handleTimelineCommandExecution(markdownView.file, plugin, settings, timelineManager);
				}
				return true;
			}
			return false;
		},
	});
}

async function scanDocument(
	file: TFile,
	plugin: Plugin,
	settings: PluginSettings,
	entityStore: EntityStore | null,
	hubManager: HubManager | null,
	glossaryManager: GlossaryManager | null,
	blacklistManager: BlacklistManager | null
): Promise<void> {
	if (!entityStore) {
		new Notice("❌ Entity store not initialized");
		return;
	}

	await handleDocumentScan(
		plugin.app,
		plugin.app.vault,
		file,
		settings,
		entityStore,
		hubManager,
		glossaryManager,
		blacklistManager
	);
}

async function handleSubMetadataCommand(
	file: TFile,
	plugin: Plugin,
	settings: PluginSettings,
	entityStore: EntityStore | null
): Promise<void> {
	if (!entityStore) {
		new Notice("❌ Entity store not initialized");
		return;
	}

	const entities = entityStore.getAllEntities();
	if (entities.length === 0) {
		new Notice("⚠️ No entities found. Scan a document first.");
		return;
	}

	const folder = file.parent?.path || "entities";

	await handleSubMetadata(
		plugin.app,
		plugin.app.vault,
		entities,
		folder + "/",
		file.path,
		settings
	);
}

async function handleTimelineCommandExecution(
	file: TFile,
	plugin: Plugin,
	settings: PluginSettings,
	timelineManager: TimelineManager | null
): Promise<void> {
	// Create mock timeline events from document
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
		plugin.app,
		plugin.app.vault,
		mockEvents,
		file.path,
		settings,
		timelineManager || undefined
	);
}
