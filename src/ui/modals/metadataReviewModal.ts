/**
 * Metadata Review Modal
 *
 * Modal for grouping entities and managing organization.
 * Supports chunked pagination, group management, tag assignment, and confirmation.
 */

import { App, Modal, Setting, TAbstractFile, TFolder } from "obsidian";
import { Entity } from "../../types";

export interface EntityGroup {
	name: string;
	folderPath?: string;
	entities: Entity[];
	tags: string[];
	isConfirmed: boolean;
}

export interface MetadataReviewResult {
	groups: EntityGroup[];
	cancelled: boolean;
}

export class MetadataReviewModal extends Modal {
	availableEntities: Entity[];
	groups: EntityGroup[] = [];
	currentPage: number = 0;
	itemsPerPage: number = 100;
	private folders: TFolder[] = [];
	private onApply: (result: MetadataReviewResult) => Promise<void>;
	private onCancel: () => void;

	constructor(
		app: App,
		entities: Entity[],
		onApply: (result: MetadataReviewResult) => Promise<void> = async () => {},
		onCancel: () => void = () => {}
	) {
		super(app);
		this.availableEntities = entities;
		this.itemsPerPage = Math.max(50, Math.min(200, 100));
		this.onApply = onApply;
		this.onCancel = onCancel;
		this.initializeFolders();
	}

	/**
	 * Initialize list of available folders
	 */
	private initializeFolders(): void {
		this.folders = [];
		const traverse = (folder: TAbstractFile) => {
			if (folder instanceof TFolder) {
				this.folders.push(folder);
				folder.children.forEach(traverse);
			}
		};

		// Get all folders from vault
		const allFiles = this.app.vault.getFiles();
		const folderSet = new Set<string>();

		allFiles.forEach((file) => {
			let path = file.parent?.path;
			while (path) {
				folderSet.add(path);
				path = this.app.vault.getFileByPath(path)?.parent?.path;
			}
		});

		// Convert to folder objects
		folderSet.forEach((path) => {
			const folder = this.app.vault.getFolderByPath(path);
			if (folder) {
				this.folders.push(folder);
			}
		});

		// Sort folders by path
		this.folders.sort((a, b) => a.path.localeCompare(b.path));
	}

	/**
	 * Create a new group
	 */
	createGroup(name: string): EntityGroup {
		const group: EntityGroup = {
			name,
			entities: [],
			tags: [],
			isConfirmed: false,
		};
		this.groups.push(group);
		return group;
	}

	/**
	 * Rename a group
	 */
	renameGroup(group: EntityGroup, newName: string): void {
		group.name = newName;
	}

	/**
	 * Add entity to group (avoids duplicates)
	 */
	addEntityToGroup(group: EntityGroup, entity: Entity): void {
		if (!group.entities.find((e) => e.id === entity.id)) {
			group.entities.push(entity);
		}
	}

	/**
	 * Remove entity from group
	 */
	removeEntityFromGroup(group: EntityGroup, entity: Entity): void {
		group.entities = group.entities.filter((e) => e.id !== entity.id);
	}

	/**
	 * Set folder for group
	 */
	setGroupFolder(group: EntityGroup, folderPath: string): void {
		group.folderPath = folderPath;
	}

	/**
	 * Confirm group
	 */
	confirmGroup(group: EntityGroup): void {
		group.isConfirmed = true;
	}

	/**
	 * Add tag to group (avoids duplicates)
	 */
	addTagToGroup(group: EntityGroup, tag: string): void {
		if (!group.tags.includes(tag)) {
			group.tags.push(tag);
		}
	}

	/**
	 * Remove tag from group
	 */
	removeTagFromGroup(group: EntityGroup, tag: string): void {
		group.tags = group.tags.filter((t) => t !== tag);
	}

	/**
	 * Get entities for a specific page
	 */
	getPageEntities(group: EntityGroup, pageNum: number): Entity[] {
		const start = pageNum * this.itemsPerPage;
		const end = start + this.itemsPerPage;
		return group.entities.slice(start, end);
	}

	/**
	 * Navigate to previous page
	 */
	previousPage(): void {
		if (this.currentPage > 0) {
			this.currentPage--;
		}
	}

	/**
	 * Navigate to next page
	 */
	nextPage(): void {
		this.currentPage++;
	}

	/**
	 * Go to specific page
	 */
	goToPage(pageNum: number): void {
		if (pageNum >= 0) {
			this.currentPage = pageNum;
		}
	}

	/**
	 * Apply changes and return modified groups
	 */
	applyChanges(): EntityGroup[] {
		return this.groups;
	}

	/**
	 * Cancel changes and discard modifications
	 */
	cancelChanges(): void {
		this.groups = [];
		this.onCancel();
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Metadata Review" });

		// Page counter
		const pageInfo = contentEl.createEl("div", { cls: "page-info" });
		const pageCount =
			this.groups.length > 0
				? Math.ceil(this.groups.length / this.itemsPerPage)
				: 1;
		pageInfo.textContent = `Page ${this.currentPage + 1} of ${pageCount}`;

		// Groups section
		const groupsEl = contentEl.createEl("div", { cls: "groups-section" });
		groupsEl.createEl("h3", { text: "Groups" });

		// Add group button
		new Setting(groupsEl).addButton((btn) =>
			btn.setButtonText("Add Group").onClick(() => {
				const groupName = prompt("Enter group name:");
				if (groupName) {
					this.createGroup(groupName);
				}
			})
		);

		// Render groups on current page
		const startIdx = this.currentPage * this.itemsPerPage;
		const endIdx = startIdx + this.itemsPerPage;
		const pageGroups = this.groups.slice(startIdx, endIdx);

		pageGroups.forEach((group) => {
			const groupEl = groupsEl.createEl("div", { cls: "group-item" });
			groupEl.createEl("h4", { text: group.name });

			// Folder selection
			if (this.folders.length > 0) {
				new Setting(groupEl)
					.setName("Folder")
					.addDropdown((dropdown) => {
						dropdown.addOption("", "No folder");
						this.folders.forEach((folder) => {
							dropdown.addOption(folder.path, folder.path);
						});
						if (group.folderPath) {
							dropdown.setValue(group.folderPath);
						}
						dropdown.onChange((value) => {
							this.setGroupFolder(group, value);
						});
					});
			}

			// Tags section
			const tagsEl = groupEl.createEl("div", { cls: "tags-section" });
			tagsEl.createEl("p", { text: "Tags:" });
			group.tags.forEach((tag) => {
				const tagEl = tagsEl.createEl("span", { cls: "tag", text: tag });
				tagEl.addEventListener("click", () => {
					this.removeTagFromGroup(group, tag);
				});
			});

			// Add tag input
			new Setting(groupEl).addText((text) =>
				text
					.setPlaceholder("Add tag")
					.onChange((value) => {
						if (value) {
							this.addTagToGroup(group, value);
						}
					})
			);

			// Entity count
			groupEl.createEl("p", {
				text: `Entities: ${group.entities.length}`,
			});

			// Confirm button
			new Setting(groupEl).addButton((btn) =>
				btn
					.setButtonText(
						group.isConfirmed ? "Confirmed" : "Confirm Group"
					)
					.onClick(() => {
						this.confirmGroup(group);
					})
			);
		});

		// Navigation buttons
		const navEl = contentEl.createEl("div", { cls: "navigation" });
		new Setting(navEl)
			.addButton((btn) =>
				btn.setButtonText("Previous").onClick(() => {
					this.previousPage();
				})
			)
			.addButton((btn) =>
				btn.setButtonText("Next").onClick(() => {
					this.nextPage();
				})
			);

		// Apply and Cancel buttons
		const actionsEl = contentEl.createEl("div", { cls: "actions" });
		new Setting(actionsEl)
			.addButton((btn) =>
				btn
					.setButtonText("Apply")
					.setCta()
					.onClick(async () => {
						await this.onApply({
							groups: this.applyChanges(),
							cancelled: false,
						});
						this.close();
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.cancelChanges();
					this.close();
				})
			);
	}

	onClose(): void {
		// Cleanup
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.onOpen();
	}
}
