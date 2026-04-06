/**
 * CSV parsing and serialization utilities
 *
 * Handles reading/writing Entity data to CSV format in the protocol folder.
 * Master entities are stored as: master-entities.csv
 */

import { Entity } from "../types";

/**
 * Parse CSV string into Entity objects
 * @param csvContent Raw CSV string
 * @returns Array of parsed entities
 */
export function parseCSV(csvContent: string): Entity[] {
	const lines = csvContent.split("\n").filter((line) => line.trim());
	if (lines.length < 2) return []; // Header + at least 1 row

	const headers = parseCSVLine(lines[0] ?? "");
	const entities: Entity[] = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVLine(lines[i] ?? "");
		if (values.length === 0) continue;

		const row: Record<string, unknown> = {};
		headers.forEach((header, idx) => {
			row[header] = values[idx] || "";
		});

		entities.push(parseEntity(row as Record<string, string>));
	}

	return entities;
}

/**
 * Serialize Entity array to CSV string
 * @param entities Array of entities to serialize
 * @returns CSV string with headers
 */
export function serializeCSV(entities: Entity[]): string {
	const headers = [
		"id",
		"name",
		"canonical",
		"frequency",
		"group",
		"tags",
		"sources",
		"createdAt",
		"updatedAt",
	];

	const lines: string[] = [headers.join(",")];

	for (const entity of entities) {
		const row = [
			entity.id,
			escapeCSV(entity.name),
			entity.canonical ? escapeCSV(entity.canonical) : "",
			entity.frequency.toString(),
			entity.group ? escapeCSV(entity.group) : "",
			entity.tags.map((t) => escapeCSV(t)).join("|"),
			entity.sources
				.map((s) => `${escapeCSV(s.document)}:${s.lineNumbers.join(",")}`)
				.join("|"),
			entity.createdAt.toString(),
			entity.updatedAt.toString(),
		];
		lines.push(row.map((v) => `"${v}"`).join(","));
	}

	return lines.join("\n");
}

/**
 * Parse a single CSV line (handles quoted fields)
 * @param line CSV line string
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === "," && !inQuotes) {
			fields.push(current.replace(/^"|"$/g, ""));
			current = "";
		} else {
			current += char;
		}
	}

	fields.push(current.replace(/^"|"$/g, ""));
	return fields;
}

/**
 * Escape special characters in CSV fields
 * @param value The value to escape
 * @returns Escaped value
 */
function escapeCSV(value: string): string {
	return value.replace(/"/g, '""');
}

/**
 * Parse a row object into an Entity
 * @param row Object with CSV values
 * @returns Parsed Entity
 */
function parseEntity(row: Record<string, string>): Entity {
	const tags = row.tags
		? row.tags
				.split("|")
				.map((t) => t.trim())
				.filter((t) => t)
		: [];

	const sources = row.sources
		? row.sources
				.split("|")
				.map((s) => {
					const parts = s.split(":");
					const doc = parts[0] || "";
					const lines = parts[1] || "";
					return {
						document: doc.trim(),
						lineNumbers: lines ? lines.split(",").map((n) => parseInt(n)) : [],
					};
				})
		: [];

	return {
		id: row.id ?? "",
		name: row.name ?? "",
		canonical: row.canonical && row.canonical !== "" ? row.canonical : undefined,
		frequency: parseInt(row.frequency ?? "0") || 0,
		sources,
		group: row.group && row.group !== "" ? row.group : undefined,
		tags,
		createdAt: parseInt(row.createdAt ?? "0") || Date.now(),
		updatedAt: parseInt(row.updatedAt ?? "0") || Date.now(),
		description: undefined,
	};
}
