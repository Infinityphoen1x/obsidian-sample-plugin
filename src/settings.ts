/**
 * Plugin Settings definitions and defaults
 */

import { App, PluginSettingTab, Setting } from "obsidian";
import MetadataOrganizerPlugin from "./main";
import { PluginSettings, DEFAULT_SETTINGS } from "./types";

export class MetadataOrganizerSettingTab extends PluginSettingTab {
	plugin: MetadataOrganizerPlugin;

	constructor(app: App, plugin: MetadataOrganizerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// General Settings Section
		containerEl.createEl("h2", { text: "General Settings" });

		new Setting(containerEl)
			.setName("Protocol Folder Name")
			.setDesc("Name of the hidden folder for metadata storage (default: .metadata)")
			.addText((text) =>
				text
					.setPlaceholder(".metadata")
					.setValue(this.plugin.settings.protocolFolderName)
					.onChange(async (value) => {
						this.plugin.settings.protocolFolderName = value || ".metadata";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Chunk Size")
			.setDesc("Number of entities to display per modal page (50-200 recommended)")
			.addSlider((slider) =>
				slider
					.setLimits(50, 200, 10)
					.setValue(this.plugin.settings.chunkSize)
					.onChange(async (value) => {
						this.plugin.settings.chunkSize = value;
						await this.plugin.saveSettings();
					})
			);

		// Feature Flags
		containerEl.createEl("h2", { text: "Features" });

		new Setting(containerEl)
			.setName("Desktop Only Mode")
			.setDesc("Disable mobile features (drag-and-drop, timelines)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.desktopOnly)
					.onChange(async (value) => {
						this.plugin.settings.desktopOnly = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show Mobile Warning")
			.setDesc("Display warning when using on mobile vault")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.mobileWarning)
					.onChange(async (value) => {
						this.plugin.settings.mobileWarning = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show Entity Descriptions")
			.setDesc("Display descriptions in modals")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showDescriptions)
					.onChange(async (value) => {
						this.plugin.settings.showDescriptions = value;
						await this.plugin.saveSettings();
					})
			);

		// Logging Settings
		containerEl.createEl("h2", { text: "Logging & Debugging" });

		new Setting(containerEl)
			.setName("Log Level")
			.setDesc("Set verbosity of logs")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("debug", "Debug (Verbose)")
					.addOption("info", "Info (Standard)")
					.addOption("warn", "Warn (Quiet)")
					.setValue(this.plugin.settings.logLevel)
					.onChange(async (value) => {
						this.plugin.settings.logLevel = value as "debug" | "info" | "warn";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Enable Logging")
			.setDesc("Log all operations to protocol folder")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableLogging)
					.onChange(async (value) => {
						this.plugin.settings.enableLogging = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Log Retention Days")
			.setDesc("Number of days to keep logs before archiving")
			.addSlider((slider) =>
				slider
					.setLimits(1, 90, 1)
					.setValue(this.plugin.settings.logRetentionDays)
					.onChange(async (value) => {
						this.plugin.settings.logRetentionDays = value;
						await this.plugin.saveSettings();
					})
			);

		// Advanced Settings
		containerEl.createEl("h2", { text: "Advanced" });

		new Setting(containerEl)
			.setName("Auto-Format Frontmatter")
			.setDesc("Automatically format frontmatter on save")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoFormatFrontmatter)
					.onChange(async (value) => {
						this.plugin.settings.autoFormatFrontmatter = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Timeline Mode")
			.setDesc("Choose timeline interaction style")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("interactive", "Interactive (Drag-drop, colors)")
					.addOption("static", "Static (Arrows, numbers only)")
					.setValue(this.plugin.settings.timelineMode)
					.onChange(async (value) => {
						this.plugin.settings.timelineMode = value as "interactive" | "static";
						await this.plugin.saveSettings();
					})
			);

		// Reset to Defaults Button
		containerEl.createEl("hr");

		new Setting(containerEl)
			.addButton((btn) =>
				btn
					.setButtonText("Reset to Defaults")
					.setCta()
					.onClick(async () => {
						this.plugin.settings = { ...DEFAULT_SETTINGS };
						await this.plugin.saveSettings();
						this.display();
					})
			);
	}
}

export function getDefaultSettings(): PluginSettings {
	return { ...DEFAULT_SETTINGS };
}
