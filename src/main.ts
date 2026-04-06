import { Plugin, Platform, Notice } from "obsidian";
import { PluginSettings, DEFAULT_SETTINGS } from "./types";
import { MetadataOrganizerSettingTab } from "./settings";
import { initializeProtocolFolder } from "./protocol/protocolManager";
import { registerViews, activateMainPanel } from "./initialization/initializeViews";
import { initializeManagers, Managers } from "./initialization/initializeManagers";
import { registerMainCommands } from "./ui/commands/mainCommands";
import { registerMetadataCommands } from "./ui/commands/metadataCommands";
import { registerDescriptionContextMenu } from "./ui/contextMenu/descriptionContextMenu";

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
	managers: Managers;


	async onload() {
		console.debug("Loading Metadata Organizer Plugin...");

		// Load settings
		await this.loadSettings();

		// Register settings tab
		this.addSettingTab(new MetadataOrganizerSettingTab(this.app, this));

		// Register custom views
		registerViews(this);

		// Handle mobile warnings
		this.handleMobileWarning();

		// Initialize protocol folder
		try {
			await initializeProtocolFolder(this.app.vault, this.settings);
		} catch (error) {
			console.error("Warning initializing protocol folder:", error);
		}

		// Initialize all managers
		this.managers = await initializeManagers(this.app.vault, this.settings);

		// Register commands
		this.registerAllCommands();

		// Auto-open main panel on first load
		this.app.workspace.onLayoutReady(() => {
			void this.openMainPanel();
		});

		console.debug("Metadata Organizer Plugin loaded successfully");
	}

	onunload() {
		console.debug("Unloading Metadata Organizer Plugin");
		// Clear all manager references
		this.managers = {
			blacklistManager: null,
			entityStore: null,
			timelineManager: null,
			hubManager: null,
			glossaryManager: null,
		};
	}

	private handleMobileWarning(): void {
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
				this.saveSettings().catch((err) =>
					console.error("Failed to save mobile settings:", err)
				);
			}
		}
	}

	private registerAllCommands(): void {
		registerMainCommands(this);
		registerMetadataCommands({
			plugin: this,
			settings: this.settings,
			entityStore: this.managers.entityStore,
			timelineManager: this.managers.timelineManager,
			blacklistManager: this.managers.blacklistManager,
		});
		registerDescriptionContextMenu(this, this.settings, this.managers.entityStore);
	}

	private async openMainPanel(): Promise<void> {
		await activateMainPanel(this);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData() as Partial<PluginSettings>
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
