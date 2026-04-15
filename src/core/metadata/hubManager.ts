/**
 * Hub Manager
 *
 * Manages cross-reference tracking of entity co-occurrences.
 * When 2+ entities appear in the same sentence, creates a HubEntry.
 * Persists to CSV for quick lookup and analysis.
 */

import { Vault, TFile } from "obsidian";
import { HubEntry, SourceRef, PluginSettings } from "../../types";
import { logHubCoOccurrence } from "../../protocol/logManager";

interface HubCSVRow {
	id: string;
	entities: string; // Pipe-delimited entity IDs
	frequency: string;
	sources: string; // JSON serialized SourceRef[]
}

export class HubManager {
	private vault: Vault;
	private protocolFolderName: string;
	private settings: PluginSettings | null;
	private hubFilename = "hub-cross-references.csv";

	private entries: Map<string, HubEntry> = new Map(); // id -> HubEntry

	constructor(vault: Vault, protocolFolderName: string = ".metadata", settings: PluginSettings | null = null) {
		this.vault = vault;
		this.protocolFolderName = protocolFolderName;
		this.settings = settings;
	}

	/**
	 * Load existing hub entries from CSV
	 */
	async loadHub(): Promise<void> {
		try {
			const hubPath = `${this.protocolFolderName}/${this.hubFilename}`;
			const hubFile = this.vault.getAbstractFileByPath(hubPath);

			if (hubFile && hubFile instanceof TFile) {
				const content = await this.vault.read(hubFile);
				const rows = this.parseGenericCSV(content);

				this.entries.clear();
				rows.forEach((row) => {
					try {
						const entry: HubEntry = {
							id: row.id as string,
							entities: (row.entities as string)
								.split("|")
								.filter((e) => e.trim()),
							frequency: parseInt(row.frequency as string, 10) || 0,
							sources: this.parseSources(row.sources as string),
						};
						this.entries.set(entry.id, entry);
					} catch (e) {
						console.warn("Failed to parse hub entry row:", row, e);
					}
				});

				console.log(`Loaded ${this.entries.size} hub cross-references`);
			}
		} catch (error) {
			console.error("Error loading hub:", error);
		}
	}

	/**
	 * Detect co-occurrences from a list of entities mentioned in sentences
	 * @param sentenceEntities Map of sentence -> entity IDs in that sentence
	 * @param sourceDocument Document being scanned
	 */
	async detectCoOccurrences(
		sentenceEntities: Map<string, string[]>,
		sourceDocument: string,
		startLine: number = 0
	): Promise<void> {
		try {
			// Validate inputs
			if (!sentenceEntities || sentenceEntities.size === 0) {
				console.debug("No sentence entities to process");
				return;
			}

			if (!sourceDocument || sourceDocument.trim().length === 0) {
				console.warn("Invalid source document name");
				return;
			}

			for (const [_sentence, entityIds] of sentenceEntities) {
				try {
					// Validate entity array
					if (!Array.isArray(entityIds) || entityIds.length === 0) {
						continue;
					}

					// Only consider sentences with 2+ entities
					if (entityIds.length < 2) continue;

					// Sort entity IDs to create consistent key - use as ID for deduplication
					const sortedIds = [...entityIds].sort();
					
					// Remove duplicates
					const uniqueIds = [...new Set(sortedIds)];
					
					// Skip if only one unique entity (self-reference)
					if (uniqueIds.length < 2) continue;
					
					const entryId = uniqueIds.join("|");

					// Get or create hub entry
					const existing = this.entries.get(entryId);
					const isNew = !existing;
					const entry: HubEntry = existing || {
						id: entryId,
						entities: uniqueIds,
						frequency: 0,
						sources: [],
					};

					// Increment frequency
					entry.frequency++;

					// Add source (deduplicate)
					const sourceKey = `${sourceDocument}:${startLine}`;
					const existingSource = entry.sources.find(
						(s) => `${s.document}:${s.lineNumbers[0]}` === sourceKey
					);

					if (!existingSource) {
						entry.sources.push({
							document: sourceDocument,
							lineNumbers: [startLine],
						});
					} else {
						// Add line number if not already present
						if (!existingSource.lineNumbers.includes(startLine)) {
							existingSource.lineNumbers.push(startLine);
						}
					}

					this.entries.set(entryId, entry);

					// Log new co-occurrence (only log new ones to avoid spam)
					if (isNew && this.vault && this.settings) {
						try {
							await logHubCoOccurrence(
								this.vault,
								this.settings,
								uniqueIds,
								entry.frequency,
								sourceDocument,
							entry.sources.flatMap((s: SourceRef) => s.lineNumbers)
							);
						} catch (logError) {
							console.debug("Failed to log hub co-occurrence:", logError);
						}
					}
				} catch (pairError) {
					console.warn("Error processing entity pair:", pairError);
					continue; // Continue with next pair
				}
			}
		} catch (error) {
			console.error("Error in detectCoOccurrences:", error);
			throw error;
		}
	}

	/**
	 * Save hub to CSV
	 */
	async persist(): Promise<void> {
		try {
			if (this.entries.size === 0) {
				console.debug("No hub entries to persist");
				return;
			}

			const data: HubCSVRow[] = Array.from(this.entries.values()).map(
				(entry) => ({
					id: entry.id,
					entities: entry.entities.join("|"),
					frequency: entry.frequency.toString(),
					sources: JSON.stringify(entry.sources),
				})
			);

			if (data.length === 0) {
				console.warn("Failed to convert hub entries to CSV");
				return;
			}

			const csv = this.entriesToCSV(data);

			if (!csv || csv.trim().length === 0) {
				console.warn("Generated empty CSV");
				return;
			}

			const hubPath = `${this.protocolFolderName}/${this.hubFilename}`;
			let hubFile = this.vault.getAbstractFileByPath(hubPath);

			try {
				if (hubFile && hubFile instanceof TFile) {
					await this.vault.modify(hubFile, csv);
				} else {
					await this.vault.create(hubPath, csv);
				}

				console.log("Hub persisted successfully");
			} catch (fileError) {
				console.error("Error writing hub file:", fileError);
				throw fileError;
			}
		} catch (error) {
			console.error("Error persisting hub:", error);
			throw error;
		}
	}

	/**
	 * Get all hub entries
	 */
	getEntries(): HubEntry[] {
		return Array.from(this.entries.values());
	}

	/**
	 * Get hub entries for a specific entity
	 */
	getEntriesForEntity(entityId: string): HubEntry[] {
		return Array.from(this.entries.values()).filter((entry) =>
			entry.entities.includes(entityId)
		);
	}

	/**
	 * Get hub entry by ID
	 */
	getEntry(id: string): HubEntry | undefined {
		return this.entries.get(id);
	}

	/**
	 * Search hub entries by entity pair
	 */
	searchByEntities(entityIds: string[]): HubEntry | undefined {
		const sortedIds = [...entityIds].sort();
		const key = sortedIds.join("|");

		for (const entry of this.entries.values()) {
			if (entry.entities.join("|") === key) {
				return entry;
			}
		}
		return undefined;
	}

	/**
	 * Get statistics about hub
	 */
	getStats(): {
		totalEntries: number;
		totalCoOccurrences: number;
		avgFrequency: number;
	} {
		const entries = Array.from(this.entries.values());
		const totalCoOccurrences = entries.reduce((sum, e) => sum + e.frequency, 0);
		return {
			totalEntries: entries.length,
			totalCoOccurrences,
			avgFrequency:
				entries.length > 0 ? totalCoOccurrences / entries.length : 0,
		};
	}

	// =========================================================================
	// Private Helpers
	// =========================================================================

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
	 * Convert hub entries to CSV format
	 */
	private entriesToCSV(data: HubCSVRow[]): string {
		const headers = ["id", "entities", "frequency", "sources"];
		const lines: string[] = [headers.join(",")];

		for (const row of data) {
			const values = [
				row.id,
				row.entities,
				row.frequency,
				this.escapeCSV(row.sources),
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
	 * Parse JSON-serialized sources
	 */
	private parseSources(sourcesJson: string): SourceRef[] {
		try {
			if (!sourcesJson || sourcesJson.trim() === "") return [];
			return JSON.parse(sourcesJson);
		} catch {
			return [];
		}
	}
}
