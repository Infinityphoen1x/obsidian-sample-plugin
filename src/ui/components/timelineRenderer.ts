/**
 * Timeline Renderer Component
 *
 * DOM rendering for timeline visualization
 * Displays events as vertical or horizontal timeline
 * With optional Mermaid diagram rendering
 */

import { TimelineEvent } from "../../types";
import mermaid from "mermaid";

export interface TimelineRendererOptions {
	orientation?: "vertical" | "horizontal";
	showSources?: boolean;
	highlightColor?: string;
	useMermaid?: boolean;
}

/**
 * Renders a visual timeline of events in HTML/CSS
 */
export class TimelineRenderer {
	private container: HTMLElement;
	private events: TimelineEvent[];
	private options: TimelineRendererOptions;

	constructor(
		container: HTMLElement,
		events: TimelineEvent[],
		options?: TimelineRendererOptions
	) {
		this.container = container;
		this.events = events;
		this.options = {
			orientation: "vertical",
			showSources: true,
			highlightColor: "#457B9D",
			useMermaid: false,
			...options,
		};
		
		// Initialize mermaid if needed
		if (this.options.useMermaid) {
			try {
				mermaid.initialize({ startOnLoad: true, theme: "default" });
			} catch (error) {
				console.warn("Failed to initialize Mermaid:", error);
			}
		}
	}

	/**
	 * Generate Mermaid timeline diagram specification
	 */
	private generateMermaidSpec(): string {
		if (this.events.length === 0) {
			return "---\nconfig:\n  fontSize: 12\nend---\ntimeline\n  title Empty Timeline\n";
		}

		let spec = "---\nconfig:\n  fontSize: 12\nend---\ntimeline\n";
		spec += `  title Timeline with ${this.events.length} events\n`;

		this.events.forEach((event, index) => {
			// Use temporal terms or event title
			const label = event.temporalTerms?.[0] || `Event ${index + 1}`;
			// Use first 50 chars of sentence
			const desc = (event.sentence || `Event ${index + 1}`).substring(0, 50);
			spec += `  ${label} : ${desc}\n`;
		});

		return spec;
	}

	/**
	 * Render timeline using Mermaid diagram
	 */
	private renderMermaidDiagram(): void {
		const spec = this.generateMermaidSpec();
		const diagramEl = this.container.createDiv({ cls: "mermaid" });
		diagramEl.textContent = spec;

		try {
			mermaid.contentLoaded();
		} catch (error) {
			console.warn("Mermaid rendering error:", error);
			diagramEl.empty();
			diagramEl.createEl("p", { 
				text: "Timeline diagram rendering not available",
				cls: "error-message"
			});
		}
	}

	/**
	 * Render the timeline
	 */
	render(): void {
		this.container.empty();

		if (this.events.length === 0) {
			this.container.createEl("p", { text: "No events to display", cls: "empty-state" });
			return;
		}

		// Render Mermaid diagram if enabled
		if (this.options.useMermaid) {
			this.renderMermaidDiagram();
		}

		const timelineEl = this.container.createDiv({ cls: "timeline-container" });
		timelineEl.style.padding = "20px";

		if (this.options.orientation === "vertical") {
			this.renderVerticalTimeline(timelineEl);
		} else {
			this.renderHorizontalTimeline(timelineEl);
		}
	}

	private renderVerticalTimeline(container: HTMLElement): void {
		const timeline = container.createDiv({ cls: "timeline vertical-timeline" });
		timeline.style.position = "relative";
		timeline.style.paddingLeft = "50px";

		// Vertical line
		const line = timeline.createDiv({ cls: "timeline-line" });
		line.style.position = "absolute";
		line.style.left = "15px";
		line.style.top = "0";
		line.style.bottom = "0";
		line.style.width = "2px";
		line.style.backgroundColor = "#ccc";

		// Render each event
		this.events.forEach((event, index) => {
			this.renderVerticalEvent(timeline, event, index);
		});
	}

	private renderVerticalEvent(timeline: HTMLElement, event: TimelineEvent, index: number): void {
		const eventEl = timeline.createDiv({ cls: "timeline-event" });
		eventEl.style.marginBottom = "24px";
		eventEl.style.position = "relative";

		// Timeline dot
		const dot = eventEl.createDiv({ cls: "timeline-dot" });
		dot.style.position = "absolute";
		dot.style.left = "-37px";
		dot.style.top = "0";
		dot.style.width = "18px";
		dot.style.height = "18px";
		dot.style.borderRadius = "50%";
		dot.style.backgroundColor = event.color || this.options.highlightColor!;
		dot.style.border = "3px solid white";
		dot.style.boxShadow = "0 0 0 2px #ddd";
		dot.style.cursor = "pointer";

		// Event content
		const content = eventEl.createDiv({ cls: "timeline-event-content" });
		content.style.padding = "12px";
		content.style.backgroundColor = "#f5f5f5";
		content.style.borderRadius = "4px";
		content.style.borderLeft = `4px solid ${event.color || this.options.highlightColor!}`;

		// Event sentence
		const sentenceEl = content.createEl("p", { text: event.sentence, cls: "event-sentence" });
		sentenceEl.style.margin = "0 0 8px 0";
		sentenceEl.style.fontWeight = "500";
		sentenceEl.style.color = "#333";

		// Temporal terms badge
		if (event.temporalTerms && event.temporalTerms.length > 0) {
			const termsEl = content.createDiv({ cls: "temporal-terms" });
			termsEl.style.display = "flex";
			termsEl.style.gap = "4px";
			termsEl.style.flexWrap = "wrap";
			termsEl.style.marginBottom = "8px";

			event.temporalTerms.forEach((term) => {
				const badge = termsEl.createEl("span", { text: term, cls: "term-badge" });
				badge.style.backgroundColor = "#e0e0e0";
				badge.style.color = "#666";
				badge.style.padding = "2px 6px";
				badge.style.borderRadius = "12px";
				badge.style.fontSize = "11px";
				badge.style.fontWeight = "500";
			});
		}

		// Source link
		if (this.options.showSources && event.source) {
			const sourceEl = content.createDiv({ cls: "event-source" });
			sourceEl.style.fontSize = "12px";
			sourceEl.style.color = "#666";
			sourceEl.style.marginTop = "8px";
			sourceEl.style.borderTop = "1px solid #ddd";
			sourceEl.style.paddingTop = "8px";

			const doc = sourceEl.createEl("span", { text: `📄 ${event.source.document}` });
			if (event.source.line) {
				sourceEl.createEl("span", { text: ` • Line ${event.source.line}` });
			}
		}

		// Order number
		const orderEl = eventEl.createDiv({ cls: "event-order" });
		orderEl.style.position = "absolute";
		orderEl.style.left = "-32px";
		orderEl.style.top = "2px";
		orderEl.style.fontSize = "12px";
		orderEl.style.fontWeight = "bold";
		orderEl.style.color = "#666";
		orderEl.style.width = "24px";
		orderEl.style.textAlign = "center";
		orderEl.textContent = String(index + 1);
	}

	private renderHorizontalTimeline(container: HTMLElement): void {
		const timeline = container.createDiv({ cls: "timeline horizontal-timeline" });
		timeline.style.display = "flex";
		timeline.style.overflowX = "auto";
		timeline.style.paddingBottom = "20px";
		timeline.style.position = "relative";

		// Horizontal line
		const line = timeline.createDiv({ cls: "timeline-line" });
		line.style.position = "absolute";
		line.style.top = "15px";
		line.style.left = "0";
		line.style.right = "0";
		line.style.height = "2px";
		line.style.backgroundColor = "#ccc";
		line.style.zIndex = "0";

		// Render each event
		this.events.forEach((event, index) => {
			this.renderHorizontalEvent(timeline, event, index);
		});
	}

	private renderHorizontalEvent(timeline: HTMLElement, event: TimelineEvent, index: number): void {
		const eventEl = timeline.createDiv({ cls: "timeline-event horizontal" });
		eventEl.style.minWidth = "200px";
		eventEl.style.marginRight = "16px";
		eventEl.style.position = "relative";
		(eventEl.style as CSSStyleDeclaration).flexShrink = '0';

		// Timeline dot
		const dot = eventEl.createDiv({ cls: "timeline-dot" });
		dot.style.position = "absolute";
		dot.style.top = "0";
		dot.style.left = "50%";
		dot.style.transform = "translateX(-50%)";
		dot.style.width = "18px";
		dot.style.height = "18px";
		dot.style.borderRadius = "50%";
		dot.style.backgroundColor = event.color || this.options.highlightColor!;
		dot.style.border = "3px solid white";
		dot.style.boxShadow = "0 0 0 2px #ddd";
		dot.style.cursor = "pointer";
		dot.style.zIndex = "1";

		// Event content (below dot)
		const content = eventEl.createDiv({ cls: "timeline-event-content" });
		content.style.marginTop = "40px";
		content.style.padding = "12px";
		content.style.backgroundColor = "#f5f5f5";
		content.style.borderRadius = "4px";
		content.style.borderTop = `4px solid ${event.color || this.options.highlightColor!}`;

		// Event sentence
		const sentenceEl = content.createEl("p", { text: event.sentence, cls: "event-sentence" });
		sentenceEl.style.margin = "0 0 8px 0";
		sentenceEl.style.fontWeight = "500";
		sentenceEl.style.color = "#333";
		sentenceEl.style.fontSize = "13px";

		// Order number
		const orderEl = content.createDiv({ cls: "event-order" });
		orderEl.style.fontSize = "11px";
		orderEl.style.color = "#999";
		orderEl.textContent = `#${index + 1}`;
	}

	/**
	 * Update events and re-render
	 */
	setEvents(events: TimelineEvent[]): void {
		this.events = events;
		this.render();
	}

	/**
	 * Highlight a specific event
	 */
	highlightEvent(index: number): void {
		const events = this.container.querySelectorAll(".timeline-event");
		events.forEach((el, i) => {
			if (i === index) {
				el.addClass("highlighted");
				(el as HTMLElement).style.backgroundColor = "#fff9e6";
			} else {
				el.removeClass("highlighted");
				(el as HTMLElement).style.backgroundColor = "";
			}
		});
	}

	/**
	 * Clear highlight
	 */
	clearHighlight(): void {
		const events = this.container.querySelectorAll(".timeline-event.highlighted");
		events.forEach((el) => {
			el.removeClass("highlighted");
			(el as HTMLElement).style.backgroundColor = "";
		});
	}
}
