/**
 * Color Picker Component
 *
 * Simple hex color picker or preset selector
 * Used for event coloring in timeline visualization
 */

/**
 * Preset colors available for quick selection
 */
export const PRESET_COLORS = {
	red: "#E63946",
	blue: "#457B9D",
	green: "#06A77D",
	yellow: "#F4D35E",
	orange: "#EE964B",
	purple: "#A367DC",
} as const;

export type PresetColor = keyof typeof PRESET_COLORS;

/**
 * Color Picker component for selecting event colors
 */
export class ColorPicker {
	private container: HTMLElement;
	private selectedColor: string;
	private onChange: (color: string) => void;

	constructor(
		container: HTMLElement,
		initialColor: string = PRESET_COLORS.blue,
		onChange: (color: string) => void = () => {}
	) {
		this.container = container;
		this.selectedColor = initialColor;
		this.onChange = onChange;
		this.render();
	}

	private render(): void {
		this.container.empty();

		// Preset colors section
		const presetsLabel = this.container.createEl("label", { text: "Preset colors:" });
		presetsLabel.style.display = "block";
		presetsLabel.style.marginBottom = "8px";
		presetsLabel.style.fontWeight = "bold";

		const presetsContainer = this.container.createDiv({ cls: "color-picker-presets" });
		presetsContainer.style.display = "flex";
		presetsContainer.style.gap = "8px";
		presetsContainer.style.marginBottom = "12px";
		presetsContainer.style.flexWrap = "wrap";

		// Render preset color buttons
		Object.entries(PRESET_COLORS).forEach(([name, hex]: [string, string]) => {
			const button = presetsContainer.createEl("button", { cls: "color-preset" });
			button.style.width = "40px";
			button.style.height = "40px";
			button.style.borderRadius = "4px";
			button.style.backgroundColor = hex;
			button.style.border = this.selectedColor === hex ? "3px solid #000" : "1px solid #ccc";
			button.style.cursor = "pointer";
			button.title = name;

			button.addEventListener("click", () => {
				this.selectColor(hex);
			});
		});

		// Custom hex input section
		const customLabel = this.container.createEl("label", { text: "Custom color (hex):" });
		customLabel.style.display = "block";
		customLabel.style.marginBottom = "8px";
		customLabel.style.marginTop = "12px";
		customLabel.style.fontWeight = "bold";

		const customContainer = this.container.createDiv({ cls: "color-picker-custom" });
		customContainer.style.display = "flex";
		customContainer.style.gap = "8px";
		customContainer.style.alignItems = "center";

		// Hex input field
		const hexInput = customContainer.createEl("input", { cls: "hex-input" });
		hexInput.type = "text";
		hexInput.placeholder = "#000000";
		hexInput.value = this.selectedColor;
		hexInput.style.flexGrow = "1";
		hexInput.style.padding = "6px";
		hexInput.style.border = "1px solid #ccc";
		hexInput.style.borderRadius = "4px";
		hexInput.style.fontFamily = "monospace";

		// Color preview
		const preview = customContainer.createEl("div", { cls: "color-preview" });
		preview.style.width = "40px";
		preview.style.height = "40px";
		preview.style.borderRadius = "4px";
		preview.style.backgroundColor = this.selectedColor;
		preview.style.border = "1px solid #ccc";

		hexInput.addEventListener("change", () => {
			if (this.isValidHex(hexInput.value)) {
				this.selectColor(hexInput.value);
			} else {
				hexInput.value = this.selectedColor;
			}
		});

		hexInput.addEventListener("input", () => {
			if (this.isValidHex(hexInput.value)) {
				preview.style.backgroundColor = hexInput.value;
			}
		});
	}

	private selectColor(hex: string): void {
		if (this.isValidHex(hex)) {
			this.selectedColor = hex.toUpperCase();
			this.onChange(this.selectedColor);
			this.render();
		}
	}

	private isValidHex(hex: string): boolean {
		const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
		return hexRegex.test(hex);
	}

	/**
	 * Get the selected color
	 */
	getSelectedColor(): string {
		return this.selectedColor;
	}

	/**
	 * Set the selected color
	 */
	setSelectedColor(hex: string): void {
		if (this.isValidHex(hex)) {
			this.selectColor(hex);
		}
	}
}
