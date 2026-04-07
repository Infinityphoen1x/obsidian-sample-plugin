/**
 * Timeline Manager
 *
 * Manages timeline snapshots and events with CSV persistence
 * Two CSV files: master-timeline.csv (snapshots) and timeline-events.csv (events)
 */

import { Vault, TFile } from "obsidian";
import { TimelineEvent } from "../../types";
import { generateEntityId } from "../../utils/idGenerator";

export interface TimelineSnapshot {
	id: string;
	name: string;
	sourceDocument: string;
	createdAt: number;
	color?: string;
}

interface TimelineSnapshotCSVRow {
	id: string;
	name: string;
	sourceDocument: string;
	createdAt: string;
	color?: string;
	eventCount?: string;
}

interface TimelineEventCSVRow {
	snapshotId: string;
	eventId: string;
	order: string;
	sentence: string;
	text: string;
	source_document: string;
	source_line: string;
	temporalTerms: string;
	status: string;
	isCustom: string;
	color?: string;
}

export class TimelineManager {
	private vault: Vault;
	private protocolFolderName: string;
	private snapshotsFilename = "master-timeline.csv";
	private eventsFilename = "timeline-events.csv";

	private snapshots: Map<string, TimelineSnapshot> = new Map();
	private events: Map<string, TimelineEvent[]> = new Map(); // snapshotId -> events

	constructor(vault: Vault, protocolFolderName: string = ".metadata") {
		this.vault = vault;
		this.protocolFolderName = protocolFolderName;
	}

	/**
	 * Load snapshots and events from CSV
	 */
	async loadTimeline(): Promise<void> {
		try {
			// Load snapshots
			const snapshotsPath = `${this.protocolFolderName}/${this.snapshotsFilename}`;
			const snapshotsFile = this.vault.getAbstractFileByPath(snapshotsPath);

			if (snapshotsFile && snapshotsFile instanceof TFile) {
				const snapshotsContent = await this.vault.read(snapshotsFile);
				const snapshotsData = this.parseGenericCSV(snapshotsContent);

				this.snapshots.clear();
				snapshotsData.forEach((row) => {
					const snapshot: TimelineSnapshot = {
						id: row.id as string,
						name: row.name as string,
						sourceDocument: row.sourceDocument as string,
						createdAt: parseInt(row.createdAt as string, 10),
						color: row.color ? (row.color as string) : undefined,
					};
					this.snapshots.set(snapshot.id, snapshot);
				});

				console.log(`Loaded ${this.snapshots.size} timeline snapshots`);
			}

			// Load events
			const eventsPath = `${this.protocolFolderName}/${this.eventsFilename}`;
			const eventsFile = this.vault.getAbstractFileByPath(eventsPath);

			if (eventsFile && eventsFile instanceof TFile) {
				const eventsContent = await this.vault.read(eventsFile);
				const eventsData = this.parseGenericCSV(eventsContent);

				this.events.clear();
				eventsData.forEach((row) => {
					const snapshotId = row.snapshotId as string;
					const eventId = row.eventId as string;
					const orderStr = row.order as string;
					const sourceLineStr = row.source_line as string;
					
					const event: TimelineEvent = {
						id: eventId,
						sentence: row.sentence as string,
						text: row.text as string,
						source: {
							document: row.source_document as string,
							line: sourceLineStr ? parseInt(sourceLineStr, 10) : 0,
						},
						temporalTerms: (row.temporalTerms as string) ? (row.temporalTerms as string).split("|") : [],
						order: parseInt(orderStr || "0", 10),
						status: ((row.status as string) || "draft") as "draft" | "confirmed",
						isCustom: (row.isCustom as string) === "true",
						color: row.color ? (row.color as string) : undefined,
					};

					if (!this.events.has(snapshotId)) {
						this.events.set(snapshotId, []);
					}
					this.events.get(snapshotId)!.push(event);
				});

				console.log(`Loaded ${eventsData.length} timeline events`);
			}
		} catch (error) {
			console.error("Error loading timeline:", error);
		}
	}

	/**
	 * Parse generic CSV into objects
	 */
	private parseGenericCSV(csvContent: string): Record<string, unknown>[] {
		const lines = csvContent.split("\n").filter((line) => line.trim());
		if (lines.length < 2) return [];

		const headers = this.parseCSVLine(lines[0] || "");
		const rows: Record<string, unknown>[] = [];

		for (let i = 1; i < lines.length; i++) {
			const values = this.parseCSVLine(lines[i] || "");
			if (values.length === 0) continue;

			const row: Record<string, unknown> = {};
			headers.forEach((header, idx) => {
				row[header] = values[idx] || "";
			});
			rows.push(row);
		}

		return rows;
	}

	/**
	 * Parse a CSV line with proper quote handling
	 */
	private parseCSVLine(line: string): string[] {
		const result: string[] = [];
		let current = "";
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			const nextChar = line[i + 1];

			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					current += '"';
					i++; // Skip next quote
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === "," && !inQuotes) {
				result.push(current.trim());
				current = "";
			} else {
				current += char;
			}
		}

		result.push(current.trim());
		return result;
	}

	/**
	 * Save snapshots and events to CSV
	 */
	async persist(): Promise<void> {
		try {
			// Save snapshots
			const snapshotsData = Array.from(this.snapshots.values()).map((snapshot) => ({
				id: snapshot.id,
				name: snapshot.name,
				sourceDocument: snapshot.sourceDocument,
				createdAt: snapshot.createdAt.toString(),
				color: snapshot.color || "",
				eventCount: (this.events.get(snapshot.id)?.length || 0).toString(),
			}));

			const snapshotsCSV = this.snapshotsToCSV(snapshotsData);

			const snapshotsPath = `${this.protocolFolderName}/${this.snapshotsFilename}`;
			let snapshotsFile = this.vault.getAbstractFileByPath(snapshotsPath);

			if (snapshotsFile && snapshotsFile instanceof TFile) {
				await this.vault.modify(snapshotsFile, snapshotsCSV);
			} else {
				await this.vault.create(snapshotsPath, snapshotsCSV);
			}

			// Save events
			const eventsData: TimelineEventCSVRow[] = [];
			this.events.forEach((snapshotEvents, snapshotId) => {
				snapshotEvents.forEach((event) => {
					eventsData.push({
						snapshotId,
						eventId: event.id,
						order: event.order.toString(),
						sentence: event.sentence,
						text: event.text ?? event.sentence,
						source_document: event.source.document,
						source_line: event.source.line.toString(),
						temporalTerms: event.temporalTerms.join("|"),
						status: event.status,
						isCustom: (event.isCustom ?? false).toString(),
						color: event.color ?? "",
					});
				});
			});

			const eventsCSV = this.eventsToCSV(eventsData);

			const eventsPath = `${this.protocolFolderName}/${this.eventsFilename}`;
			let eventsFile = this.vault.getAbstractFileByPath(eventsPath);

			if (eventsFile && eventsFile instanceof TFile) {
				await this.vault.modify(eventsFile, eventsCSV);
			} else {
				await this.vault.create(eventsPath, eventsCSV);
			}

			console.log("Timeline persisted successfully");
		} catch (error) {
			console.error("Error persisting timeline:", error);
		}
	}

	/**
	 * Convert snapshot data to CSV format
	 */
	private snapshotsToCSV(data: TimelineSnapshotCSVRow[]): string {
		const headers = ["id", "name", "sourceDocument", "createdAt", "color", "eventCount"];
		const lines: string[] = [headers.join(",")];

		for (const row of data) {
			const values = [
				row.id,
				this.escapeCSV(row.name),
				this.escapeCSV(row.sourceDocument),
				row.createdAt,
				row.color || "",
				row.eventCount || "0",
			];
			lines.push(values.join(","));
		}

		return lines.join("\n");
	}

	/**
	 * Convert event data to CSV format
	 */
	private eventsToCSV(data: TimelineEventCSVRow[]): string {
		const headers = [
			"snapshotId",
			"eventId",
			"order",
			"sentence",
			"text",
			"source_document",
			"source_line",
			"temporalTerms",
			"status",
			"isCustom",
			"color",
		];
		const lines: string[] = [headers.join(",")];

		for (const row of data) {
			const values = [
				row.snapshotId,
				row.eventId,
				row.order,
				this.escapeCSV(row.sentence),
				this.escapeCSV(row.text),
				this.escapeCSV(row.source_document),
				row.source_line || "",
				row.temporalTerms || "",
				row.status,
				row.isCustom,
				row.color || "",
			];
			lines.push(values.join(","));
		}

		return lines.join("\n");
	}

	/**
	 * Escape special characters in CSV values
	 */
	private escapeCSV(value: string): string {
		if (!value) return "";
		if (value.includes(",") || value.includes('"') || value.includes("\n")) {
			return `"${value.replace(/"/g, '""')}"`;
		}
		return value;
	}

	/**
	 * Create or update a snapshot
	 */
	addSnapshot(name: string, sourceDocument: string, events: TimelineEvent[], color?: string): string {
		const id = generateEntityId(name, Date.now());
		const snapshot: TimelineSnapshot = {
			id,
			name,
			sourceDocument,
			createdAt: Date.now(),
			color,
		};

		this.snapshots.set(id, snapshot);
		this.events.set(id, [...events]); // Store copy of events

		return id;
	}

	/**
	 * Update a snapshot's metadata
	 */
	updateSnapshot(id: string, updates: Partial<TimelineSnapshot>): void {
		const snapshot = this.snapshots.get(id);
		if (snapshot) {
			Object.assign(snapshot, updates);
		}
	}

	/**
	 * Update events for a snapshot
	 */
	updateSnapshotEvents(snapshotId: string, events: TimelineEvent[]): void {
		this.events.set(snapshotId, [...events]);
	}

	/**
	 * Get a snapshot by ID
	 */
	getSnapshot(id: string): TimelineSnapshot | undefined {
		return this.snapshots.get(id);
	}

	/**
	 * Get events for a snapshot
	 */
	getSnapshotEvents(snapshotId: string): TimelineEvent[] {
		return [...(this.events.get(snapshotId) || [])];
	}

	/**
	 * Get all snapshots
	 */
	getAllSnapshots(): TimelineSnapshot[] {
		return Array.from(this.snapshots.values());
	}

	/**
	 * Delete a snapshot and its events
	 */
	deleteSnapshot(id: string): void {
		this.snapshots.delete(id);
		this.events.delete(id);
	}

	/**
	 * Get snapshot with its events
	 */
	getSnapshotWithEvents(id: string): { snapshot: TimelineSnapshot; events: TimelineEvent[] } | undefined {
		const snapshot = this.snapshots.get(id);
		if (!snapshot) return undefined;

		return {
			snapshot,
			events: this.getSnapshotEvents(id),
		};
	}

	/**
	 * Search snapshots by name
	 */
	searchSnapshots(query: string): TimelineSnapshot[] {
		return Array.from(this.snapshots.values()).filter((s) =>
			s.name.toLowerCase().includes(query.toLowerCase())
		);
	}

	/**
	 * Get snapshot count
	 */
	getSnapshotCount(): number {
		return this.snapshots.size;
	}

	/**
	 * Get total event count across all snapshots
	 */
	getTotalEventCount(): number {
		let total = 0;
		this.events.forEach((events) => {
			total += events.length;
		});
		return total;
	}
}
