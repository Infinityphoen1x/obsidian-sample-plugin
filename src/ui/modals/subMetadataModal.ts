/**
 * Sub Metadata Modal
 *
 * Modal for creating child notes from selected keywords in a group.
 * Child notes have frontmatter, tags, parent wikilink, source table, and description section.
 */

import { App, Modal, Setting } from 'obsidian';
import { Entity } from '../../types';

export interface ChildNoteConfig {
	keyword: Entity;
	folderPath: string;
	parentNotePath: string;
	sources: Array<{ document: string; lineNumbers: number[] }>;
	tags: string[];
}

export interface SubMetadataResult {
	childNotes: ChildNoteConfig[];
	cancelled: boolean;
}

export class SubMetadataModal extends Modal {
	availableKeywords: Entity[];
	selectedKeywords: Set<string> = new Set();
	currentPage: number = 0;
	itemsPerPage: number = 50;
	folderPath: string;
	parentNotePath: string;
	parentKeywords: Entity[];
	private onApply: (result: SubMetadataResult) => Promise<void>;
	private onCancel: () => void;

	constructor(
		app: App,
		keywords: Entity[],
		folderPath: string,
		parentNotePath: string,
		onApply: (result: SubMetadataResult) => Promise<void> = async () => {},
		onCancel: () => void = () => {}
	) {
		super(app);
		this.availableKeywords = keywords;
		this.parentKeywords = keywords;
		this.folderPath = folderPath;
		this.parentNotePath = parentNotePath;
		this.itemsPerPage = Math.max(50, Math.min(200, 100));
		this.onApply = onApply;
		this.onCancel = onCancel;
	}

	/**
	 * Select a keyword for child note creation
	 */
	selectKeyword(keyword: Entity): void {
		this.selectedKeywords.add(keyword.id);
	}

	/**
	 * Deselect a keyword
	 */
	deselectKeyword(keyword: Entity): void {
		this.selectedKeywords.delete(keyword.id);
	}

	/**
	 * Check if keyword is selected
	 */
	isKeywordSelected(keyword: Entity): boolean {
		return this.selectedKeywords.has(keyword.id);
	}

	/**
	 * Select all keywords on current page
	 */
	selectAllOnPage(): void {
		const page = this.getPageKeywords();
		page.forEach((keyword) => {
			this.selectedKeywords.add(keyword.id);
		});
	}

	/**
	 * Deselect all keywords on current page
	 */
	deselectAllOnPage(): void {
		const page = this.getPageKeywords();
		page.forEach((keyword) => {
			this.selectedKeywords.delete(keyword.id);
		});
	}

	/**
	 * Select all keywords
	 */
	selectAll(): void {
		this.availableKeywords.forEach((keyword) => {
			this.selectedKeywords.add(keyword.id);
		});
	}

	/**
	 * Deselect all keywords
	 */
	deselectAll(): void {
		this.selectedKeywords.clear();
	}

	/**
	 * Get keywords for current page
	 */
	getPageKeywords(): Entity[] {
		const start = this.currentPage * this.itemsPerPage;
		const end = start + this.itemsPerPage;
		return this.availableKeywords.slice(start, end);
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
		const maxPage = Math.ceil(
			this.availableKeywords.length / this.itemsPerPage
		);
		if (this.currentPage < maxPage - 1) {
			this.currentPage++;
		}
	}

	/**
	 * Go to specific page
	 */
	goToPage(pageNum: number): void {
		const maxPage = Math.ceil(
			this.availableKeywords.length / this.itemsPerPage
		);
		if (pageNum >= 0 && pageNum < maxPage) {
			this.currentPage = pageNum;
		}
	}

	/**
	 * Get total page count
	 */
	getTotalPages(): number {
		return Math.max(
			1,
			Math.ceil(this.availableKeywords.length / this.itemsPerPage)
		);
	}

	/**
	 * Get count of selected keywords
	 */
	getSelectedCount(): number {
		return this.selectedKeywords.size;
	}

	/**
	 * Build child note configurations for selected keywords
	 */
	buildChildNoteConfigs(): ChildNoteConfig[] {
		const configs: ChildNoteConfig[] = [];

		this.selectedKeywords.forEach((keywordId) => {
			const keyword = this.availableKeywords.find(
				(k) => k.id === keywordId
			);
			if (keyword) {
				configs.push({
					keyword,
					folderPath: this.folderPath,
					parentNotePath: this.parentNotePath,
					sources: keyword.sources,
					tags: keyword.tags,
				});
			}
		});

		return configs;
	}

	/**
	 * Apply changes and create child notes
	 */
	applyChanges(): SubMetadataResult {
		return {
			childNotes: this.buildChildNoteConfigs(),
			cancelled: false,
		};
	}

	/**
	 * Cancel and discard changes
	 */
	cancelChanges(): void {
		this.selectedKeywords.clear();
		this.onCancel();
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: 'Create Child Notes' });

		// Page counter
		const pageInfo = contentEl.createEl('div', { cls: 'page-info' });
		pageInfo.textContent = `Page ${this.currentPage + 1} of ${this.getTotalPages()}`;

		// Parent info
		const infoEl = contentEl.createEl('div', { cls: 'info-section' });
		infoEl.createEl('p', {
			text: `Parent: ${this.parentNotePath}`,
		});
		infoEl.createEl('p', {
			text: `Folder: ${this.folderPath}`,
		});
		infoEl.createEl('p', {
			text: `Selected: ${this.getSelectedCount()} of ${this.availableKeywords.length}`,
		});

		// Keywords list
		const keywordsEl = contentEl.createEl('div', { cls: 'keywords-list' });
		keywordsEl.createEl('h3', { text: 'Keywords' });

		const pageKeywords = this.getPageKeywords();
		pageKeywords.forEach((keyword) => {
			const keywordEl = keywordsEl.createEl('div', {
				cls: 'keyword-item',
			});

			const checkbox = keywordEl.createEl('input', {
				type: 'checkbox',
			});
			checkbox.checked = this.isKeywordSelected(keyword);
			checkbox.addEventListener('change', (e) => {
				if ((e.target as HTMLInputElement).checked) {
					this.selectKeyword(keyword);
				} else {
					this.deselectKeyword(keyword);
				}
			});

			const label = keywordEl.createEl('label', {
				text: keyword.name,
			});
			label.addEventListener('click', () => {
				checkbox.click();
			});

			// Source count
			const sourceCount = Array.isArray(keyword.sources)
				? keyword.sources.length
				: 0;
			keywordEl.createEl('span', {
				text: ` (${sourceCount} sources)`,
				cls: 'source-count',
			});
		});

		// Bulk selection buttons
		const bulkEl = contentEl.createEl('div', { cls: 'bulk-actions' });
		new Setting(bulkEl)
			.addButton((btn) =>
				btn.setButtonText('Select Page').onClick(() => {
					this.selectAllOnPage();
				})
			)
			.addButton((btn) =>
				btn.setButtonText('Deselect Page').onClick(() => {
					this.deselectAllOnPage();
				})
			)
			.addButton((btn) =>
				btn.setButtonText('Select All').onClick(() => {
					this.selectAll();
				})
			)
			.addButton((btn) =>
				btn.setButtonText('Deselect All').onClick(() => {
					this.deselectAll();
				})
			);

		// Navigation
		const navEl = contentEl.createEl('div', { cls: 'navigation' });
		new Setting(navEl)
			.addButton((btn) =>
				btn.setButtonText('← Previous').onClick(() => {
					this.previousPage();
				})
			)
			.addButton((btn) =>
				btn.setButtonText('Next →').onClick(() => {
					this.nextPage();
				})
			);

		// Final actions
		const actionsEl = contentEl.createEl('div', { cls: 'actions' });
		new Setting(actionsEl)
			.addButton((btn) =>
				btn
					.setButtonText('Create Notes')
					.setCta()
					.onClick(async () => {
						if (this.selectedKeywords.size === 0) {
							alert('Please select at least one keyword');
							return;
						}
						await this.onApply(this.applyChanges());
						this.close();
					})
			)
			.addButton((btn) =>
				btn.setButtonText('Cancel').onClick(() => {
					this.cancelChanges();
					this.close();
				})
			);
	}

	onClose(): void {
		// Cleanup
	}
}
