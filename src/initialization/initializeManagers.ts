import { Vault } from "obsidian";
import { PluginSettings } from "../types";
import { BlacklistManager } from "../core/scanner/blacklistManager";
import { setBlacklistManager } from "../core/scanner/tokenizer";
import { EntityStore } from "../core/metadata/entityStore";
import { TimelineManager } from "../core/metadata/timelineManager";
import { HubManager } from "../core/metadata/hubManager";
import { GlossaryManager } from "../core/metadata/glossaryManager";

export interface Managers {
	blacklistManager: BlacklistManager | null;
	entityStore: EntityStore | null;
	timelineManager: TimelineManager | null;
	hubManager: HubManager | null;
	glossaryManager: GlossaryManager | null;
}

/**
 * Initialize all managers with error handling
 */
export async function initializeManagers(
	vault: Vault,
	settings: PluginSettings
): Promise<Managers> {
	const managers: Managers = {
		blacklistManager: null,
		entityStore: null,
		timelineManager: null,
		hubManager: null,
		glossaryManager: null,
	};

	// Initialize blacklist manager
	try {
		managers.blacklistManager = new BlacklistManager(
			vault,
			settings.protocolFolderName
		);
		await managers.blacklistManager.loadBlacklist();
		setBlacklistManager(managers.blacklistManager);
		console.log(
			`Blacklist manager initialized with ${managers.blacklistManager.size()} blacklisted words`
		);
	} catch (error) {
		console.error("Failed to initialize blacklist manager:", error);
	}

	// Initialize entity store
	try {
		managers.entityStore = new EntityStore(
			vault,
			settings.protocolFolderName,
			settings.masterMetadataFile
		);
		await managers.entityStore.loadEntities();
		console.log("Entity store initialized with cached entities");
	} catch (error) {
		console.error("Failed to initialize entity store:", error);
	}

	// Initialize timeline manager
	try {
		managers.timelineManager = new TimelineManager(
			vault,
			settings.protocolFolderName
		);
		await managers.timelineManager.loadTimeline();
		console.log("Timeline manager initialized with cached snapshots");
	} catch (error) {
		console.error("Failed to initialize timeline manager:", error);
	}

	// Initialize hub manager
	try {
		managers.hubManager = new HubManager(
			vault,
			settings.protocolFolderName,
			settings
		);
		await managers.hubManager.loadHub();
		console.log("Hub manager initialized with cached cross-references");
	} catch (error) {
		console.error("Failed to initialize hub manager:", error);
	}

	// Initialize glossary manager
	try {
		managers.glossaryManager = new GlossaryManager(
			vault,
			settings.protocolFolderName,
			settings
		);
		await managers.glossaryManager.loadGlossary();
		console.log("Glossary manager initialized");
	} catch (error) {
		console.error("Failed to initialize glossary manager:", error);
	}

	return managers;
}
