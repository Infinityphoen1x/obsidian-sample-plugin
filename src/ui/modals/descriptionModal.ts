/**
 * Description Modal
 *
 * Modal for adding or editing descriptions for entities.
 * Allows user to search for an entity and add/update its description.
 */

import { App, Modal, Setting, Notice } from "obsidian";
import { Entity } from "../../types";

export interface DescriptionModalResult {
	entityId: string;
	entityName: string;
	description: string;
	cancelled: boolean;
}

export class DescriptionModal extends Modal {
	private highlightedText: string;
	private availableEntities: Entity[];
	private selectedEntity: Entity | null = null;
	private descriptionText: string = "";
	private onApply: (result: DescriptionModalResult) => Promise<void>;
	private onCancel: () => void;
	private searchResults: Entity[] = [];

	constructor(
		app: App,
		highlightedText: string,
		entities: Entity[],
		onApply: (result: DescriptionModalResult) => Promise<void> = async () => {},
		onCancel: () => void = () => {}
	) {
		super(app);
		this.highlightedText = highlightedText;
		this.availableEntities = entities;
		this.onApply = onApply;
		this.onCancel = onCancel;
	}

	onOpen(): void {
		this.render();
	}

	onClose(): void {
		// Cleanup
	}

	private render(): void {
		this.contentEl.empty();

		// Title
		this.contentEl.createEl("h2", {
			text: "Add Entity Description",
		});

		// Highlighted text display
		const textSection = this.contentEl.createDiv("description-modal-section");
		textSection.createEl("h3", { text: "Selected text:" });
		const textBox = textSection.createDiv("description-modal-text-box");
		textBox.textContent = this.highlightedText;
		textBox.style.cssText =
			"padding: 1rem; background: var(--background-secondary); border-radius: 4px; margin-bottom: 1rem; overflow-wrap: break-word;";

		// Entity search section
		const searchSection = this.contentEl.createDiv("description-modal-section");
		searchSection.createEl("h3", { text: "Select entity:" });

		let searchInput: HTMLInputElement;
		new Setting(searchSection)
			.addText((text) => {
				searchInput = text.inputEl;
				text
					.setPlaceholder("Search entities...")
					.onChange((value) => {
						this.filterEntities(value);
						this.renderSearchResults();
					});
			});

		// Search results container
		const resultsContainer = searchSection.createDiv("description-modal-results");
		resultsContainer.style.cssText =
			"max-height: 200px; overflow-y: auto; border: 1px solid var(--divider-color); border-radius: 4px; margin-bottom: 1rem;";

		this.renderSearchResults();

		// Description input section
		const descSection = this.contentEl.createDiv("description-modal-section");
		descSection.createEl("h3", {
			text: this.selectedEntity ? `Description for "${this.selectedEntity.name}":` : "Description:",
		});

		let descriptionInput: HTMLTextAreaElement;
		new Setting(descSection)
			.addTextArea((text) => {
				descriptionInput = text.inputEl;
				text
					.setPlaceholder("Enter entity description...")
					.setValue(this.descriptionText)
					.onChange((value) => {
						this.descriptionText = value;
					});
				descriptionInput.rows = 6;
				descriptionInput.style.cssText = "width: 100%; font-family: monospace;";
			});

		// Action buttons
		const actionSection = this.contentEl.createDiv("description-modal-actions");
		new Setting(actionSection)
			.addButton((btn) =>
				btn
					.setButtonText("Apply")
					.setCta()
					.setDisabled(!this.selectedEntity)
					.onClick(async () => {
						if (!this.selectedEntity) {
							new Notice("❌ Please select an entity");
							return;
						}

						await this.onApply({
							entityId: this.selectedEntity!.id,
							entityName: this.selectedEntity!.name,
							description: this.descriptionText,
							cancelled: false,
						});

						this.close();
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.onCancel();
					this.close();
				})
			);
	}

	private filterEntities(searchTerm: string): void {
		if (!searchTerm.trim()) {
			this.searchResults = [];
			return;
		}

		const lowerSearch = searchTerm.toLowerCase();
		this.searchResults = this.availableEntities.filter((entity) =>
			entity.name.toLowerCase().includes(lowerSearch) ||
			entity.id.toLowerCase().includes(lowerSearch)
		);

		// Limit to 10 results
		this.searchResults = this.searchResults.slice(0, 10);
	}

	private renderSearchResults(): void {
		const resultsContainer = this.contentEl.querySelector(
			".description-modal-results"
		) as HTMLElement;

		if (!resultsContainer) return;

		resultsContainer.empty();

		if (this.searchResults.length === 0) {
			resultsContainer.createEl("div", {
				text: "No entities found",
				cls: "search-result-empty",
			});
			resultsContainer.style.padding = "1rem";
			return;
		}

		this.searchResults.forEach((entity) => {
			const resultEl = resultsContainer.createEl("div", {
				text: `${entity.name} (${entity.frequency}x)`,
				cls: "search-result-item",
			});

			resultEl.style.cssText =
				"padding: 0.75rem; cursor: pointer; border-bottom: 1px solid var(--divider-color); hover: background-color var(--background-secondary);";

			if (this.selectedEntity?.id === entity.id) {
				resultEl.style.backgroundColor = "var(--background-secondary)";
				resultEl.style.fontWeight = "bold";
			}

			resultEl.addEventListener("click", () => {
				this.selectedEntity = entity;
				this.descriptionText = entity.description || "";
				this.render();
			});

			resultEl.addEventListener("mouseenter", () => {
				resultEl.style.backgroundColor = "var(--background-secondary)";
			});

			resultEl.addEventListener("mouseleave", () => {
				if (this.selectedEntity?.id !== entity.id) {
					resultEl.style.backgroundColor = "";
				}
			});
		});
	}
}
