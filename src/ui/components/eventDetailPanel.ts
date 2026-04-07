/**
 * Event Detail Panel Component
 *
 * Side panel showing detailed information about a selected timeline event
 * Allows inline editing of event properties
 */

import { TimelineEvent } from "../../types";

export interface EventDetailPanelOptions {
	onSave?: (event: TimelineEvent) => void;
	onDelete?: (eventId: string) => void;
	onColorChange?: (eventId: string, color: string) => void;
	editable?: boolean;
}

/**
 * Displays and edits details for a single timeline event
 */
export class EventDetailPanel {
	private container: HTMLElement;
	private event: TimelineEvent | null = null;
	private options: EventDetailPanelOptions;
	private editMode: boolean = false;

	constructor(container: HTMLElement, options?: EventDetailPanelOptions) {
		this.container = container;
		this.options = {
			editable: true,
			...options,
		};
	}

	/**
	 * Display event details
	 */
	displayEvent(event: TimelineEvent): void {
		this.event = event;
		this.editMode = false;
		this.render();
	}

	/**
	 * Clear the panel
	 */
	clear(): void {
		this.event = null;
		this.container.empty();
		this.container.createEl("p", { 
			text: "Select an event to view details", 
			cls: "event-panel-empty" 
		});
	}

	/**
	 * Render the panel
	 */
	private render(): void {
		this.container.empty();

		if (!this.event) {
			this.clear();
			return;
		}

		const panelEl = this.container.createDiv({ cls: "event-detail-panel" });
		panelEl.style.display = "flex";
		panelEl.style.flexDirection = "column";
		panelEl.style.gap = "12px";
		panelEl.style.height = "100%";

		// Header with title
		this.renderHeader(panelEl);

		// Scrollable content
		const contentEl = panelEl.createDiv({ cls: "event-panel-content" });
		contentEl.style.overflowY = "auto";
		contentEl.style.flex = "1";
		contentEl.style.display = "flex";
		contentEl.style.flexDirection = "column";
		contentEl.style.gap = "12px";

		// Event details
		this.renderEventDetails(contentEl);

		// Footer with buttons
		this.renderFooter(panelEl);
	}

	/**
	 * Render header with event ID
	 */
	private renderHeader(container: HTMLElement): void {
		if (!this.event) return;

		const headerEl = container.createDiv({ cls: "event-panel-header" });
		headerEl.style.borderBottom = "1px solid var(--background-modifier-border)";
		headerEl.style.paddingBottom = "8px";

		const titleEl = headerEl.createEl("h4", { text: "Event Details", cls: "event-panel-title" });
		titleEl.style.margin = "0 0 4px 0";

		const idEl = headerEl.createEl("div", { text: `ID: ${this.event.id}`, cls: "event-panel-id" });
		idEl.style.fontSize = "11px";
		idEl.style.color = "var(--text-muted)";
	}

	/**
	 * Render event details fields
	 */
	private renderEventDetails(container: HTMLElement): void {
		if (!this.event) return;

		// Sentence (primary content)
		this.renderField(container, "Sentence", this.event.sentence, "sentence");

		// Source document
		const docLabel = `Source: ${this.event.sourceDocument || this.event.source.document}`;
		const lineLabel = `Line ${this.event.source.line}`;
		const sourceText = `${docLabel} • ${lineLabel}`;
		this.renderReadOnlyField(container, "Source", sourceText);

		// Temporal terms
		const termsText = this.event.temporalTerms.join(", ") || "None";
		this.renderReadOnlyField(container, "Temporal Terms", termsText);

		// Status
		this.renderField(container, "Status", this.event.status, "status", ["draft", "confirmed"]);

		// Color picker
		this.renderColorPicker(container);

		// Timestamp (optional)
		if (this.event.timestamp) {
			const dateStr = new Date(this.event.timestamp).toLocaleDateString();
			this.renderReadOnlyField(container, "Timestamp", dateStr);
		}

		// Order
		this.renderReadOnlyField(container, "Order", this.event.order.toString());

		// Custom flag
		if (this.event.isCustom) {
			const customEl = container.createDiv({ cls: "event-panel-custom-flag" });
			customEl.style.padding = "8px";
			customEl.style.backgroundColor = "var(--background-secondary)";
			customEl.style.borderRadius = "4px";
			customEl.style.fontSize = "12px";
			customEl.textContent = "✏️ User-created event";
		}
	}

	/**
	 * Render editable text field
	 */
	private renderField(
		container: HTMLElement,
		label: string,
		value: string,
		fieldName: string,
		options?: string[]
	): void {
		const fieldEl = container.createDiv({ cls: "event-panel-field" });

		const labelEl = fieldEl.createEl("label", { text: label, cls: "event-panel-label" });
		labelEl.style.display = "block";
		labelEl.style.fontSize = "12px";
		labelEl.style.color = "var(--text-muted)";
		labelEl.style.marginBottom = "4px";

		if (!this.options.editable) {
			const valueEl = fieldEl.createEl("div", { text: value, cls: "event-panel-value" });
			valueEl.style.padding = "6px";
			valueEl.style.backgroundColor = "var(--background-secondary)";
			valueEl.style.borderRadius = "3px";
			valueEl.style.fontSize = "13px";
			return;
		}

		if (options) {
			// Dropdown for status
			const selectEl = fieldEl.createEl("select", { cls: "event-panel-select" });
			selectEl.style.width = "100%";
			selectEl.style.padding = "6px";
			selectEl.style.borderRadius = "3px";
			selectEl.style.border = "1px solid var(--background-modifier-border)";
			selectEl.style.cursor = "pointer";

			options.forEach((opt) => {
				const optEl = selectEl.createEl("option", { text: opt, value: opt });
				if (opt === value) {
					optEl.selected = true;
				}
			});

			selectEl.addEventListener("change", () => {
				if (this.event && fieldName === "status") {
					this.event.status = selectEl.value as "draft" | "confirmed";
					this.options.onSave?.(this.event);
				}
			});
		} else {
			// Text area for sentence
			const textareaEl = fieldEl.createEl("textarea", { cls: "event-panel-textarea" });
			textareaEl.style.width = "100%";
			textareaEl.style.padding = "6px";
			textareaEl.style.borderRadius = "3px";
			textareaEl.style.border = "1px solid var(--background-modifier-border)";
			textareaEl.style.fontFamily = "monospace";
			textareaEl.style.fontSize = "12px";
			textareaEl.style.minHeight = "80px";
			textareaEl.value = value;

			textareaEl.addEventListener("blur", () => {
				if (this.event && textareaEl.value !== value) {
					this.event.sentence = textareaEl.value;
					this.event.text = textareaEl.value;
					this.options.onSave?.(this.event);
				}
			});
		}
	}

	/**
	 * Render read-only field
	 */
	private renderReadOnlyField(container: HTMLElement, label: string, value: string): void {
		const fieldEl = container.createDiv({ cls: "event-panel-field" });

		const labelEl = fieldEl.createEl("label", { text: label, cls: "event-panel-label" });
		labelEl.style.display = "block";
		labelEl.style.fontSize = "12px";
		labelEl.style.color = "var(--text-muted)";
		labelEl.style.marginBottom = "4px";

		const valueEl = fieldEl.createEl("div", { text: value, cls: "event-panel-value" });
		valueEl.style.padding = "6px";
		valueEl.style.backgroundColor = "var(--background-secondary)";
		valueEl.style.borderRadius = "3px";
		valueEl.style.fontSize = "13px";
		valueEl.style.wordBreak = "break-word";
	}

	/**
	 * Render color picker
	 */
	private renderColorPicker(container: HTMLElement): void {
		if (!this.event) return;

		const fieldEl = container.createDiv({ cls: "event-panel-color-field" });

		const labelEl = fieldEl.createEl("label", { text: "Color", cls: "event-panel-label" });
		labelEl.style.display = "block";
		labelEl.style.fontSize = "12px";
		labelEl.style.color = "var(--text-muted)";
		labelEl.style.marginBottom = "4px";

		const pickerWrapperEl = fieldEl.createDiv({ cls: "color-picker-wrapper" });
		pickerWrapperEl.style.display = "flex";
		pickerWrapperEl.style.gap = "6px";
		pickerWrapperEl.style.alignItems = "center";

		// Color input
		const colorInputEl = pickerWrapperEl.createEl("input", { 
			type: "color",
			cls: "event-panel-color-input" 
		});
		colorInputEl.style.width = "40px";
		colorInputEl.style.height = "32px";
		colorInputEl.style.cursor = "pointer";
		colorInputEl.style.border = "1px solid var(--background-modifier-border)";
		colorInputEl.style.borderRadius = "3px";
		colorInputEl.value = this.event.color || "#457B9D";

		// Current color hex display
		const hexEl = pickerWrapperEl.createEl("span", { 
			text: this.event.color || "#457B9D",
			cls: "event-panel-hex" 
		});
		hexEl.style.fontSize = "12px";
		hexEl.style.fontFamily = "monospace";
		hexEl.style.color = "var(--text-muted)";

		colorInputEl.addEventListener("change", () => {
			const newColor = colorInputEl.value;
			hexEl.textContent = newColor;
			if (this.event) {
				this.event.color = newColor;
				this.options.onColorChange?.(this.event.id, newColor);
				this.options.onSave?.(this.event);
			}
		});
	}

	/**
	 * Render footer with action buttons
	 */
	private renderFooter(container: HTMLElement): void {
		if (!this.event) return;

		const footerEl = container.createDiv({ cls: "event-panel-footer" });
		footerEl.style.borderTop = "1px solid var(--background-modifier-border)";
		footerEl.style.paddingTop = "8px";
		footerEl.style.display = "flex";
		footerEl.style.gap = "6px";
		footerEl.style.flexWrap = "wrap";

		if (this.options.editable) {
			// Edit button
			const editBtn = footerEl.createEl("button", { 
				text: this.editMode ? "Done" : "Edit",
				cls: "event-panel-button event-panel-edit-btn" 
			});
			editBtn.style.flex = "1";
			editBtn.style.minWidth = "60px";
			editBtn.style.padding = "6px 12px";
			editBtn.style.backgroundColor = this.editMode ? "#4CAF50" : "#457B9D";
			editBtn.style.color = "white";
			editBtn.style.border = "none";
			editBtn.style.borderRadius = "3px";
			editBtn.style.cursor = "pointer";
			editBtn.style.fontSize = "12px";

			editBtn.addEventListener("click", () => {
				this.editMode = !this.editMode;
				this.render();
			});

			// Delete button
			const deleteBtn = footerEl.createEl("button", { 
				text: "Delete",
				cls: "event-panel-button event-panel-delete-btn" 
			});
			deleteBtn.style.flex = "1";
			deleteBtn.style.minWidth = "60px";
			deleteBtn.style.padding = "6px 12px";
			deleteBtn.style.backgroundColor = "#E74C3C";
			deleteBtn.style.color = "white";
			deleteBtn.style.border = "none";
			deleteBtn.style.borderRadius = "3px";
			deleteBtn.style.cursor = "pointer";
			deleteBtn.style.fontSize = "12px";

			deleteBtn.addEventListener("click", () => {
				if (confirm("Delete this event? This cannot be undone.")) {
					this.options.onDelete?.(this.event!.id);
					this.clear();
				}
			});
		}
	}
}
