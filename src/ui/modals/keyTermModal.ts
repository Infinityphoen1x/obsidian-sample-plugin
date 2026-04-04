import { Modal, App, Setting } from "obsidian";

export interface KeyTermSelection {
	selected: Set<string>;
	rejected: Set<string>;
}

export class KeyTermModal extends Modal {
	private terms: string[];
	private selection: KeyTermSelection = {
		selected: new Set(),
		rejected: new Set(),
	};
	private currentPage: number = 0;
	private termsPerPage: number = 100;
	private onApply: (selection: KeyTermSelection) => void;
	private onCancel: () => void;

	constructor(
		app: App,
		terms: string[],
		termsPerPage: number = 100,
		onApply: (selection: KeyTermSelection) => void = () => {},
		onCancel: () => void = () => {}
	) {
		super(app);
		this.terms = terms;
		this.termsPerPage = Math.max(50, Math.min(200, termsPerPage)); // Clamp 50-200
		this.onApply = onApply;
		this.onCancel = onCancel;
	}

	/**
	 * Get total number of pages
	 */
	getTotalPages(): number {
		return Math.ceil(this.terms.length / this.termsPerPage);
	}

	/**
	 * Get terms for current page
	 */
	getPageTerms(): string[] {
		const start = this.currentPage * this.termsPerPage;
		const end = start + this.termsPerPage;
		return this.terms.slice(start, end);
	}

	/**
	 * Check if a term is selected on current page
	 */
	isTermSelected(term: string): boolean {
		return this.selection.selected.has(term);
	}

	/**
	 * Check if a term is rejected on current page
	 */
	isTermRejected(term: string): boolean {
		return this.selection.rejected.has(term);
	}

	/**
	 * Toggle term selection
	 */
	toggleTerm(term: string): void {
		if (this.selection.selected.has(term)) {
			this.selection.selected.delete(term);
		} else {
			this.selection.selected.add(term);
			this.selection.rejected.delete(term); // Remove from rejected if adding to selected
		}
	}

	/**
	 * Toggle term rejection
	 */
	toggleRejected(term: string): void {
		if (this.selection.rejected.has(term)) {
			this.selection.rejected.delete(term);
		} else {
			this.selection.rejected.add(term);
			this.selection.selected.delete(term); // Remove from selected if rejecting
		}
	}

	/**
	 * Select all terms on current page
	 */
	selectAllPage(): void {
		const pageTerms = this.getPageTerms();
		pageTerms.forEach((term) => {
			this.selection.selected.add(term);
			this.selection.rejected.delete(term);
		});
	}

	/**
	 * Deselect all terms on current page
	 */
	deselectAllPage(): void {
		const pageTerms = this.getPageTerms();
		pageTerms.forEach((term) => {
			this.selection.selected.delete(term);
		});
	}

	/**
	 * Reject all terms on current page
	 */
	rejectAllPage(): void {
		const pageTerms = this.getPageTerms();
		pageTerms.forEach((term) => {
			this.selection.rejected.add(term);
			this.selection.selected.delete(term);
		});
	}

	/**
	 * Navigate to previous page
	 */
	previousPage(): void {
		if (this.currentPage > 0) {
			this.currentPage--;
			this.render();
		}
	}

	/**
	 * Navigate to next page
	 */
	nextPage(): void {
		if (this.currentPage < this.getTotalPages() - 1) {
			this.currentPage++;
			this.render();
		}
	}

	/**
	 * Navigate to specific page (0-indexed)
	 */
	goToPage(page: number): void {
		const totalPages = this.getTotalPages();
		if (page >= 0 && page < totalPages) {
			this.currentPage = page;
			this.render();
		}
	}

	/**
	 * Get selection stats
	 */
	getStats(): { selected: number; rejected: number; remaining: number } {
		const remaining = this.terms.length - this.selection.selected.size - this.selection.rejected.size;
		return {
			selected: this.selection.selected.size,
			rejected: this.selection.rejected.size,
			remaining,
		};
	}

	/**
	 * Render the modal UI
	 */
	render(): void {
		this.contentEl.empty();

		// Header with title and page counter
		const header = this.contentEl.createDiv("key-term-modal-header");
		header.createEl("h2", { text: "Select Key Terms" });

		const pageInfo = this.contentEl.createDiv("key-term-modal-page-info");
		const totalPages = this.getTotalPages();
		pageInfo.createEl("span", {
			text: `Page ${this.currentPage + 1} of ${totalPages} (${this.terms.length} total terms)`,
		});

		// Stats section
		const stats = this.getStats();
		const statsDiv = this.contentEl.createDiv("key-term-modal-stats");
		statsDiv.createEl("span", { text: `✓ Selected: ${stats.selected}` });
		statsDiv.createEl("span", { text: `✗ Rejected: ${stats.rejected}` });
		statsDiv.createEl("span", { text: `○ Remaining: ${stats.remaining}` });

		// Page controls (top)
		const topControls = this.contentEl.createDiv("key-term-modal-controls");
		new Setting(topControls)
			.addButton((btn) =>
				btn
					.setButtonText("Select All")
					.onClick(() => {
						this.selectAllPage();
						this.render();
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Deselect All")
					.onClick(() => {
						this.deselectAllPage();
						this.render();
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Reject All")
					.onClick(() => {
						this.rejectAllPage();
						this.render();
					})
			);

		// Term list with checkboxes
		const termListDiv = this.contentEl.createDiv("key-term-modal-list");
		const pageTerms = this.getPageTerms();

		pageTerms.forEach((term) => {
			const termRow = termListDiv.createDiv("key-term-modal-item");
			termRow.addClass("key-term-row");

			const checkboxContainer = termRow.createDiv("key-term-checkbox-group");

			// Selected checkbox (green)
			const selectedCheckbox = checkboxContainer.createEl("input", {
				type: "checkbox",
			});
			if (this.isTermSelected(term)) {
				selectedCheckbox.setAttribute("checked", "checked");
			}
			selectedCheckbox.classList.add("key-term-selected");
			selectedCheckbox.addEventListener("change", () => {
				this.toggleTerm(term);
				this.render();
			});

			// Term label
			const label = termRow.createEl("label", { text: term, cls: "key-term-label" });

			// Rejected checkbox (red)
			const rejectedCheckbox = checkboxContainer.createEl("input", {
				type: "checkbox",
			});
			if (this.isTermRejected(term)) {
				rejectedCheckbox.setAttribute("checked", "checked");
			}
			rejectedCheckbox.classList.add("key-term-rejected");
			rejectedCheckbox.addEventListener("change", () => {
				this.toggleRejected(term);
				this.render();
			});
		});

		// Pagination controls (bottom)
		const bottomControls = this.contentEl.createDiv("key-term-modal-pagination");
		new Setting(bottomControls)
			.addButton((btn) =>
				btn
					.setButtonText("← Previous")
					.setDisabled(this.currentPage === 0)
					.onClick(() => this.previousPage())
			)
			.addButton((btn) =>
				btn
					.setButtonText("Next →")
					.setDisabled(this.currentPage === totalPages - 1)
					.onClick(() => this.nextPage())
			);

		// Action button controls (bottom)
		const actionControls = this.contentEl.createDiv("key-term-modal-actions");
		new Setting(actionControls)
			.addButton((btn) =>
				btn
					.setButtonText("Apply")
					.setCta()
					.onClick(() => {
						this.onApply(this.selection);
						this.close();
					})
			)
			.addButton((btn) =>
				btn
					.setButtonText("Cancel")
					.onClick(() => {
						this.onCancel();
						this.close();
					})
			);
	}

	onOpen(): void {
		this.render();
	}

	onClose(): void {
		// Cleanup if needed
	}
}
