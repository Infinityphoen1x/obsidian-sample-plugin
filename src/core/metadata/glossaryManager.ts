/**
 * Glossary Manager
 *
 * Builds and manages glossary tree structure showing all entities
 * organized by groups with their descriptions and folder hierarchy.
 *
 * Glossary file: .metadata/glossary.json
 * Structure: nested JSON tree matching folder organization
 */

import { Vault, TFile } from "obsidian";
import { Entity, Group, PluginSettings } from "../../types";
import { logGlossaryUpdate } from "../../protocol/logManager";

export interface GlossaryEntry {
	name: string;
	type: "group" | "entity";
	path: string; // Vault path to folder or note
	description?: string;
	children?: GlossaryEntry[]; // For groups
	entityId?: string; // For entities
	frequency?: number;
}

export interface GlossaryTree {
	version: number;
	lastUpdated: number;
	entries: GlossaryEntry[]; // Root level entries
}

export class GlossaryManager {
	private vault: Vault;
	private protocolFolderName: string;
	private settings: PluginSettings | null;
	private glossaryFilename = "glossary.json";

	private tree: GlossaryTree = {
		version: 1,
		lastUpdated: Date.now(),
		entries: [],
	};

	constructor(vault: Vault, protocolFolderName: string = ".metadata", settings: PluginSettings | null = null) {
		this.vault = vault;
		this.protocolFolderName = protocolFolderName;
		this.settings = settings;
	}

	/**
	 * Load existing glossary from JSON
	 */
	async loadGlossary(): Promise<void> {
		try {
			const glossaryPath = `${this.protocolFolderName}/${this.glossaryFilename}`;
			const glossaryFile = this.vault.getAbstractFileByPath(glossaryPath);

			if (glossaryFile && glossaryFile instanceof TFile) {
				const content = await this.vault.read(glossaryFile);
				const parsed = JSON.parse(content) as GlossaryTree;
				this.tree = parsed;
				console.debug("Glossary loaded successfully");
			}
		} catch (error) {
			console.error("Error loading glossary:", error);
			this.tree = {
				version: 1,
				lastUpdated: Date.now(),
				entries: [],
			};
		}
	}

	/**
	 * Build glossary tree from groups and entities
	 */
	buildFromGroupsAndEntities(groups: Group[], entities: Entity[]): void {
		const tree: GlossaryEntry[] = [];

		// Input validation
		if (!groups || !Array.isArray(groups)) {
			console.warn("buildFromGroupsAndEntities: groups is not a valid array");
			groups = [];
		}
		if (!entities || !Array.isArray(entities)) {
			console.warn("buildFromGroupsAndEntities: entities is not a valid array");
			entities = [];
		}

		// Group entities by their assigned group
		const entitiesByGroup = new Map<string, Entity[]>();

		// Group entities with error handling
		for (const entity of entities) {
			try {
				if (entity && entity.group) {
					if (!entitiesByGroup.has(entity.group)) {
						entitiesByGroup.set(entity.group, []);
					}
					entitiesByGroup.get(entity.group)!.push(entity);
				}
			} catch (entityError) {
				console.warn("Error grouping entity:", entityError, entity);
				// Continue to next entity
			}
		}

		// Create entries for each group with error handling
		for (const group of groups) {
			try {
				if (!group || !group.name) {
					console.debug("Skipping invalid group");
					continue;
				}
				const groupEntities = entitiesByGroup.get(group.name) || [];
				const children: GlossaryEntry[] = [];

				// Build children with per-entity error handling
				for (const entity of groupEntities) {
					try {
						if (!entity || !entity.name) {
							console.debug("Skipping invalid entity in group");
							continue;
						}
						children.push({
							name: entity.name,
							type: "entity",
							path: `${group.folder}${entity.name}.md`,
							description: entity.description || "",
							entityId: entity.id,
							frequency: entity.frequency,
						});
					} catch (childError) {
						console.debug("Error processing entity in group:", childError);
						// Continue to next entity
					}
				}

				// Sort children alphabetically by name
				children.sort((a, b) => a.name.localeCompare(b.name));
				const entry: GlossaryEntry = {
					name: group.name,
					type: "group",
					path: group.folder,
					children,
				};
				tree.push(entry);
			} catch (groupError) {
				console.warn("Error processing group:", groupError, group);
				// Continue to next group
			}
		}

		// Add ungrouped entities under "Ungrouped" with error handling
		try {
			const ungroupedEntities = entities.filter((e) => e && !e.group);
			if (ungroupedEntities.length > 0) {
				const ungroupedChildren: GlossaryEntry[] = [];

				// Build ungrouped children with per-entity error handling
				for (const entity of ungroupedEntities) {
					try {
						if (!entity || !entity.name) {
							console.debug("Skipping invalid ungrouped entity");
							continue;
						}
						ungroupedChildren.push({
							name: entity.name,
							type: "entity",
							path: `Ungrouped/${entity.name}.md`,
							description: entity.description || "",
							entityId: entity.id,
							frequency: entity.frequency,
						});
					} catch (childError) {
						console.debug("Error processing ungrouped entity:", childError);
						// Continue to next entity
					}
				}

				// Sort ungrouped children alphabetically
				ungroupedChildren.sort((a, b) => a.name.localeCompare(b.name));
				tree.push({
					name: "Ungrouped",
					type: "group",
					path: "Ungrouped/",
					children: ungroupedChildren,
				});
			}
		} catch (ungroupedError) {
			console.warn("Error processing ungrouped entities:", ungroupedError);
			// Continue to tree update
		}

		this.tree = {
			version: 1,
			lastUpdated: Date.now(),
			entries: tree,
		};
	}

	/**
	 * Add or update a glossary entry
	 */
	async addOrUpdateEntry(
		groupName: string,
		entity: Entity,
		path: string
	): Promise<void> {
		// Input validation
		if (!groupName || typeof groupName !== "string" || groupName.trim() === "") {
			console.warn("addOrUpdateEntry: invalid groupName:", groupName);
			return;
		}
		if (!entity || !entity.id || !entity.name) {
			console.warn("addOrUpdateEntry: invalid entity:", entity);
			return;
		}
		if (!path || typeof path !== "string") {
			console.warn("addOrUpdateEntry: invalid path:", path);
			return;
		}

		try {
			// Find or create group entry
			let groupEntry = this.tree.entries.find(
				(e) => e.name === groupName && e.type === "group"
			);

			if (!groupEntry) {
				groupEntry = {
					name: groupName,
					type: "group",
					path: `${groupName}/`,
					children: [],
				};
				this.tree.entries.push(groupEntry);
			}

			// Update or add entity entry
			if (!groupEntry.children) {
				groupEntry.children = [];
			}

			const entityIndex = groupEntry.children.findIndex(
				(e) => e.entityId === entity.id
			);

			const isNew = entityIndex < 0;

			const entityEntry: GlossaryEntry = {
				name: entity.name,
				type: "entity",
				path,
				description: entity.description || "",
				entityId: entity.id,
				frequency: entity.frequency,
			};

			if (entityIndex >= 0) {
				groupEntry.children[entityIndex] = entityEntry;
			} else {
				groupEntry.children.push(entityEntry);
			}

			// Sort children alphabetically
			groupEntry.children.sort((a, b) => a.name.localeCompare(b.name));
			this.tree.lastUpdated = Date.now();

			// Log the update
			if (this.vault && this.settings) {
				const action = isNew ? "added" : "updated";
				try {
					await logGlossaryUpdate(
						this.vault,
						this.settings,
						action,
						groupName,
						entity.name,
						entity.frequency
					);
				} catch (error) {
					console.debug("Failed to log glossary update:", error);
				}
			}
		} catch (error) {
			console.warn("Error in addOrUpdateEntry:", error);
			throw error;
		}
	}

	/**
	 * Remove an entry from glossary
	 */
	async removeEntry(groupName: string, entityId: string): Promise<void> {
		// Input validation
		if (!groupName || typeof groupName !== "string") {
			console.warn("removeEntry: invalid groupName:", groupName);
			return;
		}
		if (!entityId || typeof entityId !== "string") {
			console.warn("removeEntry: invalid entityId:", entityId);
			return;
		}

		try {
			const groupEntry = this.tree.entries.find(
				(e) => e.name === groupName && e.type === "group"
			);

			if (groupEntry && groupEntry.children) {
				// Find entity name before removing
				const entityToRemove = groupEntry.children.find((e) => e.entityId === entityId);
				const entityName = entityToRemove?.name || entityId;

				groupEntry.children = groupEntry.children.filter(
					(e) => e.entityId !== entityId
				);

				// Remove group if empty
				if (groupEntry.children.length === 0) {
					this.tree.entries = this.tree.entries.filter(
						(e) => e !== groupEntry
					);
				}

				this.tree.lastUpdated = Date.now();

				// Log the removal
				if (this.vault && this.settings) {
					try {
						await logGlossaryUpdate(
							this.vault,
							this.settings,
							"removed",
							groupName,
							entityName
						);
					} catch (error) {
						console.debug("Failed to log glossary removal:", error);
					}
				}
			} else {
				console.debug("Group not found for removal:", groupName);
			}
		} catch (error) {
			console.warn("Error in removeEntry:", error);
			throw error;
		}
	}

	/**
	 * Get entire glossary tree
	 */
	getTree(): GlossaryTree {
		return this.tree;
	}

	/**
	 * Get entries for a specific group
	 */
	getGroupEntries(groupName: string): GlossaryEntry[] {
		const groupEntry = this.tree.entries.find(
			(e) => e.name === groupName && e.type === "group"
		);
		return groupEntry?.children || [];
	}

	/**
	 * Find a glossary entry by entity ID
	 */
	findByEntityId(entityId: string): GlossaryEntry | undefined {
		for (const group of this.tree.entries) {
			if (group.children) {
				const found = group.children.find((e) => e.entityId === entityId);
				if (found) return found;
			}
		}
		return undefined;
	}

	/**
	 * Search glossary entries by name
	 */
	search(query: string): GlossaryEntry[] {
		const results: GlossaryEntry[] = [];
		const lowerQuery = query.toLowerCase();

		const searchInEntries = (entries: GlossaryEntry[]) => {
			entries.forEach((entry) => {
				if (entry.name.toLowerCase().includes(lowerQuery)) {
					results.push(entry);
				}
				if (entry.children) {
					searchInEntries(entry.children);
				}
			});
		};

		searchInEntries(this.tree.entries);
		return results;
	}

	/**
	 * Get statistics about glossary
	 */
	getStats(): {
		totalGroups: number;
		totalEntities: number;
		entriesByGroup: Record<string, number>;
	} {
		const stats = {
			totalGroups: this.tree.entries.filter((e) => e.type === "group")
				.length,
			totalEntities: 0,
			entriesByGroup: {} as Record<string, number>,
		};

		this.tree.entries.forEach((group) => {
			if (group.type === "group" && group.children) {
				stats.entriesByGroup[group.name] = group.children.length;
				stats.totalEntities += group.children.length;
			}
		});

		return stats;
	}

	/**
	 * Save glossary to JSON file
	 */
	async persist(): Promise<void> {
		try {
			// Validate glossary data before persisting
			if (!this.tree || !Array.isArray(this.tree.entries)) {
				console.warn("persist: invalid tree structure");
				return;
			}

			// Generate JSON content with validation
			let content: string;
			try {
				content = JSON.stringify(this.tree, null, 2);
			} catch (stringifyError) {
				console.error("Error serializing glossary data:", stringifyError);
				return;
			}

			// Validate generated content
			if (!content || content.trim().length === 0) {
				console.warn("persist: generated empty content");
				return;
			}

			// Perform file I/O operation with error handling
			const glossaryPath = `${this.protocolFolderName}/${this.glossaryFilename}`;
			let glossaryFile = this.vault.getAbstractFileByPath(glossaryPath);

			try {
				if (glossaryFile && glossaryFile instanceof TFile) {
					await this.vault.modify(glossaryFile, content);
				} else {
					await this.vault.create(glossaryPath, content);
				}
				console.log("Glossary persisted successfully");
			} catch (fileError) {
				console.error("Error during file I/O operation:", fileError);
				throw fileError;
			}
		} catch (error) {
			console.error("Error persisting glossary:", error);
			// Don't rethrow - allow plugin to continue even if persist fails
		}
	}

	/**
	 * Export glossary as formatted text (for display/markdown)
	 */
	exportAsText(separator: string = "\n"): string {
		const lines: string[] = [];

		const addEntry = (entry: GlossaryEntry, depth: number = 0) => {
			const indent = "  ".repeat(depth);
			const prefix = entry.type === "group" ? "📁" : "📄";

			if (entry.type === "group") {
				lines.push(`${indent}${prefix} **${entry.name}**`);
			} else {
				const freq = entry.frequency ? ` (${entry.frequency})` : "";
				const desc = entry.description
					? ` - ${entry.description.slice(0, 50)}`
					: "";
				lines.push(
					`${indent}${prefix} [[${entry.name}]]${freq}${desc}`
				);
			}

			if (entry.children) {
				entry.children.forEach((child) =>
					addEntry(child, depth + 1)
				);
			}
		};

		this.tree.entries.forEach((entry) => addEntry(entry));
		return lines.join(separator);
	}
}
