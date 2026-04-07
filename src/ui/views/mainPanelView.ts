/**
 * Main panel view
 *
 * Control center for plugin operations
 * Displays buttons for scanning, organizing, and editing metadata
 */

import { ItemView, WorkspaceLeaf, Notice, Plugin, TFile } from "obsidian";
import { parseFrontmatter } from "../../utils/frontmatterHelper";

export class MainPanelView extends ItemView {
	static readonly VIEW_TYPE = "metadata-organizer-main";
	private plugin?: Plugin;
	private isInitialized: boolean = false;
	private contentContainer?: HTMLElement;
	private activeFile: TFile | null = null;
	private frontmatterCache: Record<string, string[]> = {}; // Cache for tags

	constructor(leaf: WorkspaceLeaf, plugin?: Plugin) {
		super(leaf);
		this.plugin = plugin;
		this.setupFileChangeListener();
	}

	getViewType(): string {
		return MainPanelView.VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Metadata Organizer";
	}

	getIcon(): string {
		return "layout-grid";
	}

	/**
	 * Setup listener for active file changes
	 */
	private setupFileChangeListener(): void {
		if (!this.plugin?.app) return;

		// Track active file on initial open
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (activeFile instanceof TFile) {
			this.activeFile = activeFile;
		}

		// Listen for file changes
		this.registerEvent(
			this.plugin.app.workspace.on("active-leaf-change", () => {
				const file = this.plugin?.app.workspace.getActiveFile();
				if (file instanceof TFile) {
					this.activeFile = file;
					// Refresh UI to reflect new file's tags
					if (this.contentContainer) {
						this.renderContent(this.contentContainer);
					}
				}
			})
		);
	}

	/**
	 * Get tags from the active file's frontmatter
	 */
	private async getFileTagsAsync(): Promise<string[]> {
		if (!this.activeFile || !(this.activeFile instanceof TFile)) {
			return [];
		}

		try {
			// Check cache first
			const cachedTags = this.frontmatterCache[this.activeFile.path];
			if (cachedTags !== undefined) {
				return cachedTags;
			}

			const content = await this.plugin?.app.vault.read(this.activeFile);
			if (!content) return [];

			const { frontmatter } = parseFrontmatter(content);
			let tags: string[] = [];

			if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
				tags = frontmatter.tags as string[];
			} else if (frontmatter.tags && typeof frontmatter.tags === "string") {
				tags = (frontmatter.tags as string).split(",").map((t) => t.trim());
			}

			// Cache the tags
			this.frontmatterCache[this.activeFile.path] = tags;
			return tags;
		} catch (error) {
			console.warn("Error reading file tags:", error);
			return [];
		}
	}

	/**
	 * Check if active file has a specific tag
	 */
	private hasTag(tags: string[], tagName: string): boolean {
		return tags.some((tag) => tag.toLowerCase() === tagName.toLowerCase());
	}

	async onOpen(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();

		// Check initialization status
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pluginAny = this.plugin as any;
		this.isInitialized = pluginAny?.isInitialized || false;

		// Create wrapper container
		const wrapperEl = containerEl.createDiv({ cls: "main-panel-wrapper" });

		if (!this.isInitialized) {
			this.showLoadingState(wrapperEl);

			// Subscribe to initialization completion
			if (pluginAny?.onInitializationComplete) {
				pluginAny.onInitializationComplete(() => {
					this.isInitialized = true;
					wrapperEl.empty();
					this.renderContent(wrapperEl);
				});
			}
		} else {
			this.renderContent(wrapperEl);
		}

		this.contentContainer = wrapperEl;
	}

	private showLoadingState(container: HTMLElement): void {
		const loadingEl = container.createDiv({ cls: "main-panel-loading" });
		loadingEl.style.padding = "20px";
		loadingEl.style.textAlign = "center";
		loadingEl.style.minHeight = "200px";
		loadingEl.style.display = "flex";
		loadingEl.style.flexDirection = "column";
		loadingEl.style.alignItems = "center";
		loadingEl.style.justifyContent = "center";

		// Spinner animation
		const spinnerEl = loadingEl.createDiv({ cls: "loading-spinner" });
		spinnerEl.innerHTML = `
			<svg width="48" height="48" viewBox="0 0 48 48" style="margin-bottom: 16px; animation: spin 1s linear infinite;">
				<style>
					@keyframes spin {
						from { transform: rotate(0deg); }
						to { transform: rotate(360deg); }
					}
				</style>
				<circle cx="24" cy="24" r="20" stroke="#457B9D" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="30 50"/>
			</svg>
		`;

		// Message
		const titleEl = loadingEl.createEl("h3", { text: "Initializing Plugin...", cls: "loading-title" });
		titleEl.style.marginTop = "0";
		titleEl.style.color = "#333";
		titleEl.style.fontSize = "16px";
		titleEl.style.fontWeight = "600";

		const messageEl = loadingEl.createEl("p", { text: "Loading managers and scanning caches...", cls: "loading-message" });
		messageEl.style.color = "#666";
		messageEl.style.fontSize = "13px";
		messageEl.style.marginTop = "8px";

		// Subtext
		const subtextEl = loadingEl.createEl("small", { text: "This may take a few moments", cls: "loading-subtext" });
		subtextEl.style.color = "#999";
		subtextEl.style.fontSize = "12px";
		subtextEl.style.marginTop = "12px";
	}

	private renderContent(container: HTMLElement): void {
		container.empty();

		// Main container
		const mainEl = container.createDiv({ cls: "main-panel-container" });
		mainEl.style.padding = "20px";

		// Title
		const titleEl = mainEl.createEl("h2", { text: "Metadata Organizer", cls: "panel-title" });
		titleEl.style.marginTop = "0";
		titleEl.style.marginBottom = "20px";
		titleEl.style.color = "#333";

		// Ready indicator
		const readyEl = mainEl.createDiv({ cls: "ready-indicator" });
		readyEl.style.display = "flex";
		readyEl.style.alignItems = "center";
		readyEl.style.marginBottom = "20px";
		readyEl.style.padding = "8px 12px";
		readyEl.style.backgroundColor = "#e8f5e9";
		readyEl.style.borderRadius = "4px";
		readyEl.style.fontSize = "12px";
		readyEl.style.color = "#2e7d32";
		readyEl.innerHTML = `
			<span style="display: inline-block; width: 8px; height: 8px; background: #4caf50; border-radius: 50%; margin-right: 8px;"></span>
			<span>✓ Ready to use</span>
		`;

		// Description
		const descEl = mainEl.createEl("p", { text: "Organize your documents and manage metadata", cls: "panel-description" });
		descEl.style.color = "#666";
		descEl.style.marginBottom = "24px";

		// Load and render buttons based on file tags
		void this.renderButtonGroups(mainEl);
	}

	/**
	 * Render button groups with proper availability based on file tags
	 */
	private async renderButtonGroups(mainEl: HTMLElement): Promise<void> {
		const tags = await this.getFileTagsAsync();
		const hasParentTag = this.hasTag(tags, "parent");

		// Document Scanning
		this.createButtonGroup(mainEl, "Document Scanning", [
			{
				label: "📄 Scan Document",
				command: "metadata-organizer-scan-document",
				description: "Extract entities from active document",
				enabled: true,
			},
		]);

		// Organization
		this.createButtonGroup(mainEl, "Organization", [
			{
				label: "🏷️ Review Metadata",
				command: "metadata-organizer-review",
				description: "Organize entities into groups",
				enabled: true,
			},
			{
				label: "📝 Create Entity Notes",
				command: "metadata-organizer-sub-metadata",
				description: "Generate child notes for entities",
				enabled: hasParentTag,
				disabledReason: hasParentTag ? undefined : "Only available for parent documents",
			},
		]);

		// Timeline
		this.createButtonGroup(mainEl, "Timeline", [
			{
				label: "📅 Open Timeline Editor",
				command: "metadata-organizer-timeline",
				description: "Create and manage timeline snapshots",
				enabled: true,
			},
		]);

		// Info section
		const infoEl = mainEl.createDiv({ cls: "panel-info" });
		infoEl.style.marginTop = "32px";
		infoEl.style.padding = "12px";
		infoEl.style.backgroundColor = "#f0f4f8";
		infoEl.style.borderRadius = "4px";
		infoEl.style.fontSize = "13px";
		infoEl.style.color = "#555";
		infoEl.innerHTML = `
			<strong>📖 Getting Started</strong><br>
			<ul style="margin: 8px 0 0 12px; padding: 0;">
				<li>Open a document and click "Scan Document"</li>
				<li>Review and organize entities</li>
				<li>Create entity notes for linked references</li>
				<li>Build timelines from temporal terms</li>
			</ul>
		`;
	}

	private createButtonGroup(
		container: HTMLElement,
		title: string,
		buttons: Array<{
			label: string;
			command: string;
			description?: string;
			enabled?: boolean;
			disabledReason?: string;
		}>
	): void {
		const groupEl = container.createDiv({ cls: "button-group" });
		groupEl.style.marginBottom = "20px";

		const titleEl = groupEl.createEl("h4", { text: title, cls: "group-title" });
		titleEl.style.margin = "0 0 12px 0";
		titleEl.style.fontSize = "13px";
		titleEl.style.fontWeight = "600";
		titleEl.style.color = "#333";
		titleEl.style.textTransform = "uppercase";
		titleEl.style.letterSpacing = "0.5px";

		buttons.forEach((btn) => {
			this.createButton(
				groupEl,
				btn.label,
				btn.command,
				btn.description,
				btn.enabled !== false,
				btn.disabledReason
			);
		});
	}

	private createButton(
		container: HTMLElement,
		label: string,
		command: string,
		description?: string,
		enabled: boolean = true,
		disabledReason?: string
	): void {
		const btnEl = container.createDiv({ cls: "button-wrapper" });
		btnEl.style.marginBottom = "10px";

		const btn = btnEl.createEl("button", { text: label, cls: "main-panel-button" });
		btn.style.width = "100%";
		btn.style.padding = "10px 12px";
		btn.style.color = "white";
		btn.style.border = "none";
		btn.style.borderRadius = "4px";
		btn.style.fontWeight = "500";
		btn.style.textAlign = "left";
		btn.style.transition = "background-color 0.2s";

		if (enabled) {
			btn.style.backgroundColor = "#457B9D";
			btn.style.cursor = "pointer";
			btn.disabled = false;

			btn.addEventListener("mouseenter", () => {
				btn.style.backgroundColor = "#386382";
			});

			btn.addEventListener("mouseleave", () => {
				btn.style.backgroundColor = "#457B9D";
			});

			btn.addEventListener("click", async () => {
				console.debug(`[Button Click] User clicked button for command: ${command}`);

				// Disable button during execution
				btn.disabled = true;
				const originalBgColor = btn.style.backgroundColor;
				btn.style.backgroundColor = "#999";
				btn.style.cursor = "not-allowed";
				const originalLabel = btn.textContent;
				btn.textContent = "Executing...";

				try {
					console.debug(`[Button] Attempting to execute command: ${command}`);

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const appAny = this.app as any;

					// Method 1: Use executeCommandById if available
					if (typeof appAny.commands?.executeCommandById === "function") {
						console.debug(`[Button] Command registry available, checking for: ${command}`);

						// Check if command is actually registered
						const commands = appAny.commands?.commands || {};
						if (!commands[command]) {
							throw new Error(`Command not registered: ${command}`);
						}

						console.debug(`[Button] Command found in registry, executing...`);
						const result = appAny.commands.executeCommandById(command);

						if (result instanceof Promise) {
							await result;
						}

						console.debug(`[Button] Command executed successfully`);
						new Notice(`✅ Executed: ${originalLabel}`);
					}
					// Method 2: Find and execute the command callback directly (fallback)
					else {
						console.debug(`[Button] Using fallback command execution method`);
						const commands = appAny.commands?.commands || {};
						const cmd = commands[command];

						if (!cmd) {
							throw new Error(`Command not found: ${command}`);
						}

						let executed = false;

						if (typeof cmd.callback === "function") {
							console.debug(`[Button] Executing command callback`);
							const result = cmd.callback();
							if (result instanceof Promise) {
								await result;
							}
							executed = true;
						} else if (typeof cmd.checkCallback === "function") {
							console.debug(`[Button] Executing command checkCallback`);
							const result = cmd.checkCallback(false);
							if (result instanceof Promise) {
								await result;
							}
							executed = true;
						} else {
							throw new Error(`Command has no valid callback: ${command}`);
						}

						if (!executed) {
							throw new Error(`Failed to execute command callback`);
						}

						console.debug(`[Button] Command executed successfully via fallback`);
						new Notice(`✅ Executed: ${originalLabel}`);
					}
				} catch (error) {
					const errorMsg = error instanceof Error ? error.message : String(error);
					console.error(`[Button] Error executing command ${command}:`, error);
					new Notice(`❌ Failed: ${errorMsg}`);
				} finally {
					// Re-enable button
					btn.disabled = false;
					btn.style.backgroundColor = originalBgColor;
					btn.style.cursor = "pointer";
					btn.textContent = originalLabel;
				}
			});
		} else {
			// Disabled state
			btn.style.backgroundColor = "#ccc";
			btn.style.cursor = "not-allowed";
			btn.disabled = true;
			btn.style.opacity = "0.6";
		}

		if (description) {
			const descEl = btnEl.createEl("small", { text: description, cls: "button-desc" });
			descEl.style.display = "block";
			descEl.style.marginTop = "4px";
			descEl.style.color = enabled ? "#999" : "#bbb";
			descEl.style.fontSize = "12px";
		}

		// Show disabled reason as a tooltip
		if (!enabled && disabledReason) {
			btn.title = disabledReason;
			const reasonEl = btnEl.createEl("small", { text: `ℹ️ ${disabledReason}`, cls: "disabled-reason" });
			reasonEl.style.display = "block";
			reasonEl.style.marginTop = "4px";
			reasonEl.style.color = "#e74c3c";
			reasonEl.style.fontSize = "11px";
			reasonEl.style.fontStyle = "italic";
		}
	}

	async onClose(): Promise<void> {
		// Cleanup
	}
}
