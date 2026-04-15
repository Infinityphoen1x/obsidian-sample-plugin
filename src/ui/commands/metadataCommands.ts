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
import { scanMarkdown } from "../../core/scanner/documentScanner";
import { parseFrontmatter } from "../../utils/frontmatterHelper";

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

			// Fallback for custom file views (e.g., docx preview)
			if (!file) {
				const activeLeaf = plugin.app.workspace.activeLeaf;
				const leafFile = (activeLeaf?.view as { file?: TFile } | undefined)?.file;
				if (leafFile) {
					file = leafFile;
					console.debug("[Command] Got file from active leaf view:", file);
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
	const content = await plugin.app.vault.read(file);
	const { content: bodyContent } = parseFrontmatter(content);
	const scanResult = await scanMarkdown(file, bodyContent);
	const events = buildTimelineEvents(bodyContent, scanResult.temporalTerms, file.path);

	if (events.length === 0) {
		new Notice("No temporal events found in this document");
		return;
	}

	await handleTimeline(
		plugin.app,
		plugin.app.vault,
		events,
		file.path,
		settings,
		timelineManager || undefined
	);
}

function buildTimelineEvents(
	content: string,
	temporalTerms: Array<{ term: string }>,
	sourceDocument: string
): TimelineEvent[] {
	const termSet = new Set(temporalTerms.map((t) => t.term));
	const terms = Array.from(termSet);
	if (terms.length === 0) return [];

	const lines = content.split("\n");
	const events: TimelineEvent[] = [];
	const baseId = Date.now();
	let order = 0;

	const termRegexes = terms.map((term) => ({
		term,
		re: new RegExp(`\\b${escapeRegExp(term)}\\b`, "i"),
	}));

	lines.forEach((line, lineIndex) => {
		const sentences = line.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
		sentences.forEach((sentence) => {
			const matchedTerms = termRegexes
				.filter(({ re }) => re.test(sentence))
				.map(({ term }) => term);

			if (matchedTerms.length > 0) {
				events.push({
					id: `evt_${baseId}_${order}`,
					sentence,
					text: sentence,
					source: { document: sourceDocument, line: lineIndex + 1 },
					sourceDocument,
					temporalTerms: matchedTerms,
					order,
					status: "draft",
					isCustom: false,
				});
				order++;
			}
		});
	});

	return events;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
