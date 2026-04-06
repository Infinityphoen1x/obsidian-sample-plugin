/**
 * Folder Combobox Component
 *
 * Auto-fill combobox for selecting folders from the vault.
 * Provides filtering, keyboard navigation, and folder path display.
 */

import { App, TAbstractFile, TFolder } from "obsidian";

export interface FolderComboboxOptions {
	onSelect: (folderPath: string) => void;
	onCancel: () => void;
	excludePaths?: string[]; // Folders to exclude from selection
}

export class FolderCombobox {
	private app: App;
	private folders: TFolder[] = [];
	private filteredFolders: TFolder[] = [];
	private selectedIndex: number = -1;
	private options: FolderComboboxOptions;
	private rootEl: HTMLElement | null = null;
	private inputEl: HTMLInputElement | null = null;
	private dropdownEl: HTMLElement | null = null;
	private isOpen: boolean = false;

	constructor(app: App, options: FolderComboboxOptions) {
		this.app = app;
		this.options = options;
		this.initializeFolders();
	}

	/**
	 * Initialize list of available folders from vault
	 */
	private initializeFolders(): void {
		this.folders = [];
		const folderSet = new Set<string>();

		// Traverse vault to find all folders
		const traverse = (file: TAbstractFile) => {
			if (file instanceof TFolder) {
				const path = file.path;
				if (!this.options.excludePaths?.includes(path)) {
					folderSet.add(path);
				}
				file.children.forEach(traverse);
			}
		};

		// Start traversal from vault root
		this.app.vault.getRoot().children.forEach(traverse);

		// Convert to folder array and sort
		folderSet.forEach((path) => {
			const folder = this.app.vault.getFolderByPath(path);
			if (folder instanceof TFolder) {
				this.folders.push(folder);
			}
		});

		this.folders.sort((a, b) => a.path.localeCompare(b.path));
	}

	/**
	 * Filter folders by search term
	 */
	private filterFolders(searchTerm: string): void {
		if (!searchTerm) {
			this.filteredFolders = [...this.folders];
		} else {
			const lowerSearch = searchTerm.toLowerCase();
			this.filteredFolders = this.folders.filter((folder) =>
				folder.path.toLowerCase().includes(lowerSearch) ||
				folder.name.toLowerCase().includes(lowerSearch)
			);
		}
		this.selectedIndex = this.filteredFolders.length > 0 ? 0 : -1;
	}

	/**
	 * Render the combobox UI
	 */
	render(containerEl: HTMLElement): void {
		this.rootEl = containerEl;

		// Input field
		this.inputEl = containerEl.createEl("input", {
			type: "text",
			placeholder: "Select folder...",
		});
		this.inputEl.style.cssText = "width: 100%; padding: 0.5rem; margin-bottom: 0.5rem;";

		// Dropdown container
		this.dropdownEl = containerEl.createDiv();
		this.dropdownEl.style.cssText =
			"max-height: 250px; overflow-y: auto; border: 1px solid var(--divider-color); border-radius: 4px; display: none;";

		// Event listeners
		this.inputEl.addEventListener("input", (e) => this.handleInputChange(e));
		this.inputEl.addEventListener("focus", () => this.openDropdown());
		this.inputEl.addEventListener("blur", () => setTimeout(() => this.closeDropdown(), 200));
		this.inputEl.addEventListener("keydown", (e) => this.handleKeyDown(e));

		// Initialize with all folders
		this.filterFolders("");
		this.renderDropdown();
	}

	/**
	 * Handle input change for filtering
	 */
	private handleInputChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		this.filterFolders(input.value);
		this.renderDropdown();
		if (!this.isOpen) {
			this.openDropdown();
		}
	}

	/**
	 * Handle keyboard navigation
	 */
	private handleKeyDown(event: KeyboardEvent): void {
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				this.selectNext();
				break;
			case "ArrowUp":
				event.preventDefault();
				this.selectPrevious();
				break;
			case "Enter":
				event.preventDefault();
				if (this.selectedIndex >= 0 && this.filteredFolders[this.selectedIndex]) {
					const folder = this.filteredFolders[this.selectedIndex] as TFolder;
					this.selectFolder(folder);
				}
				break;
			case "Escape":
				event.preventDefault();
				this.closeDropdown();
				this.options.onCancel();
				break;
		}
	}

	/**
	 * Move selection to next folder
	 */
	private selectNext(): void {
		if (this.selectedIndex < this.filteredFolders.length - 1) {
			this.selectedIndex++;
			this.renderDropdown();
			this.scrollIntoView();
		}
	}

	/**
	 * Move selection to previous folder
	 */
	private selectPrevious(): void {
		if (this.selectedIndex > 0) {
			this.selectedIndex--;
			this.renderDropdown();
			this.scrollIntoView();
		}
	}

	/**
	 * Scroll selected item into view
	 */
	private scrollIntoView(): void {
		if (!this.dropdownEl) return;
		const items = this.dropdownEl.querySelectorAll(".folder-item");
		if (this.selectedIndex < items.length) {
			const item = items[this.selectedIndex] as HTMLElement;
			item.scrollIntoView({ block: "nearest" });
		}
	}

	/**
	 * Render dropdown items
	 */
	private renderDropdown(): void {
		if (!this.dropdownEl) return;

		this.dropdownEl.empty();

		if (this.filteredFolders.length === 0) {
			this.dropdownEl.createEl("div", {
				text: "No folders found",
				cls: "folder-item-empty",
			});
			return;
		}

		this.filteredFolders.forEach((folder: TFolder, index: number) => {
			const itemEl = this.dropdownEl!.createEl("div", {
				text: folder.path || "/",
				cls: "folder-item",
			});

			itemEl.style.cssText =
				"padding: 0.5rem; cursor: pointer; border-bottom: 1px solid var(--divider-color);";

			if (index === this.selectedIndex) {
				itemEl.style.backgroundColor = "var(--background-secondary)";
				itemEl.style.fontWeight = "bold";
			}

			itemEl.addEventListener("click", () => this.selectFolder(folder));
			itemEl.addEventListener("mouseenter", () => {
				this.selectedIndex = index;
				this.renderDropdown();
			});
		});
	}

	/**
	 * Select a folder
	 */
	private selectFolder(folder: TFolder): void {
		if (this.inputEl) {
			this.inputEl.value = folder.path || "/";
		}
		this.closeDropdown();
		this.options.onSelect(folder.path);
	}

	/**
	 * Open dropdown
	 */
	private openDropdown(): void {
		if (this.dropdownEl) {
			this.dropdownEl.style.display = "block";
			this.isOpen = true;
		}
	}

	/**
	 * Close dropdown
	 */
	private closeDropdown(): void {
		if (this.dropdownEl) {
			this.dropdownEl.style.display = "none";
			this.isOpen = false;
		}
	}

	/**
	 * Get currently selected folder path
	 */
	getSelectedPath(): string {
		return this.inputEl?.value || "";
	}

	/**
	 * Set folder path programmatically
	 */
	setPath(path: string): void {
		if (this.inputEl) {
			this.inputEl.value = path;
			this.filterFolders(path);
		}
	}
}
