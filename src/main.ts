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
	isInitialized: boolean = false;
	private initializationCallbacks: Array<() => void> = [];


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

		// **Register commands EARLY** - before heavy file I/O
		// This ensures hotkeys.json can be accessed without contention
		registerMainCommands(this);
		
		// Defer heavy initialization to after workspace is ready
		// This prevents blocking hotkey registration during plugin load
		this.app.workspace.onLayoutReady(async () => {
			try {
				// Initialize protocol folder
				await initializeProtocolFolder(this.app.vault, this.settings);

				// Initialize all managers (parallelized where possible)
				this.managers = await initializeManagers(this.app.vault, this.settings);

				// Register metadata-specific commands (requires managers)
				registerMetadataCommands({
					plugin: this,
					settings: this.settings,
					entityStore: this.managers.entityStore,
					timelineManager: this.managers.timelineManager,
					hubManager: this.managers.hubManager,
					glossaryManager: this.managers.glossaryManager,
					blacklistManager: this.managers.blacklistManager,
				});

				// Register context menus (requires managers)
				registerDescriptionContextMenu(this, this.settings, this.managers.entityStore);

				// Auto-open main panel
				await this.openMainPanel();

				// Mark as initialized and notify all listeners
				this.isInitialized = true;
				this.notifyInitializationComplete();

				console.debug("Metadata Organizer Plugin fully initialized");
			} catch (error) {
				console.error("Error during deferred initialization:", error);
				new Notice("Error initializing Metadata Organizer. Check console for details.");
			}
		});

		console.debug("Metadata Organizer Plugin loaded (managers will initialize after layout ready)");
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

	/**
	 * Subscribe to initialization completion
	 * @param callback Called when plugin is fully initialized
	 */
	onInitializationComplete(callback: () => void): void {
		if (this.isInitialized) {
			// If already initialized, call immediately
			callback();
		} else {
			// Otherwise, queue the callback
			this.initializationCallbacks.push(callback);
		}
	}

	/**
	 * Notify all listeners that initialization is complete
	 */
	private notifyInitializationComplete(): void {
		while (this.initializationCallbacks.length > 0) {
			const callback = this.initializationCallbacks.shift();
			if (callback) {
				try {
					callback();
				} catch (error) {
					console.error("Error in initialization callback:", error);
				}
			}
		}
	}
}
