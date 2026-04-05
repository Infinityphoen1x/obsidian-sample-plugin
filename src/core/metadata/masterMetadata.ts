/**
 * Master metadata management
 *
 * High-level manager for all entity metadata.
 * Handles loading, persisting, merging entities across multiple scans.
 * Implements smart deduplication with frequency tracking.
 */

import { Vault } from "obsidian";
import { Entity, MasterMetadataIndex, PluginSettings, SourceRef } from "../../types";
import { EntityStore } from "./entityStore";
import { buildIndex, saveIndex, loadIndex } from "./indexFile";

const INDEX_FILE_NAME = "index.json";

export interface MergeResult {
	newEntities: number;
	mergedEntities: number;
	totalEntities: number;
}

export class MasterMetadata {
	private entityStore: EntityStore;
	private index: MasterMetadataIndex | null = null;
	private vault: Vault;
	private settings: PluginSettings;

	constructor(vault: Vault, settings: PluginSettings) {
		this.vault = vault;
		this.settings = settings;
		this.entityStore = new EntityStore(
			vault,
			settings.protocolFolderName,
			settings.masterMetadataFile
		);
	}

	/**
	 * Initialize master metadata by loading existing entities and index
	 */
	async initialize(): Promise<void> {
		try {
			// Load existing entities into store
			await this.entityStore.loadEntities();

			// Build and load index from disk if available
			this.index = await loadIndex(this.vault, this.settings.protocolFolderName, INDEX_FILE_NAME);

			if (!this.index) {
				// First time - build index from scratch
				this.index = buildIndex(this.entityStore.getAllEntities());
			}
		} catch (error) {
			console.error("Failed to initialize master metadata:", error);
			// Create empty index on error
			this.index = {
				version: 1,
				lastUpdated: Date.now(),
				nameToId: new Map(),
				canonicalToNames: new Map(),
				groupIndex: new Map(),
			};
		}
	}

	/**
	 * Add a single entity, merging if it already exists
	 * @param entity Entity to add or merge
	 * @returns True if new entity, false if merged
	 */
	addEntity(entity: Entity): boolean {
		const existingEntity = this.findByCanonicalName(entity.name);

		if (existingEntity) {
			// Merge with existing
			this.mergeEntities(existingEntity, entity);
			return false;
		}

		// Add as new entity
		this.entityStore.addEntity(entity);
		return true;
	}

	/**
	 * Add multiple entities with deduplication and merging
	 * @param entities Entities to add
	 * @param sourceDocument Optional source document that provided these entities
	 * @returns Merge result statistics
	 */
	addEntities(entities: Entity[], sourceDocument?: string): MergeResult {
		let newCount = 0;
		let mergedCount = 0;

		for (const entity of entities) {
			// Add source document if provided
			if (sourceDocument && !entity.sources) {
				entity.sources = [];
			}
			if (sourceDocument && entity.sources) {
				const sourceRef: SourceRef = {
					document: sourceDocument,
					lineNumbers: [],
				};
				const sourceExists = entity.sources.some((s) => s.document === sourceDocument);
				if (!sourceExists) {
					entity.sources.push(sourceRef);
				}
			}

			// Check if already exists
			const isNew = this.addEntity(entity);
			if (isNew) {
				newCount++;
			} else {
				mergedCount++;
			}
		}

		return {
			newEntities: newCount,
			mergedEntities: mergedCount,
			totalEntities: this.entityStore.getAllEntities().length,
		};
	}

	/**
	 * Merge two entities, updating the master with combined information
	 * @param master The master entity to update
	 * @param incoming The incoming entity to merge
	 */
	private mergeEntities(master: Entity, incoming: Entity): void {
		// Update frequency count
		master.frequency = master.frequency + incoming.frequency;

		// Merge sources
		if (incoming.sources && incoming.sources.length > 0) {
			if (!master.sources) {
				master.sources = [];
			}
			for (const source of incoming.sources) {
				const sourceExists = master.sources.some((s) => s.document === source.document);
				if (!sourceExists) {
					master.sources.push(source);
				}
			}
		}

		// Merge tags (if new tags exist)
		if (incoming.tags && incoming.tags.length > 0) {
			if (!master.tags) {
				master.tags = [];
			}
			for (const tag of incoming.tags) {
				if (!master.tags.includes(tag)) {
					master.tags.push(tag);
				}
			}
		}

		// Preserve description if incoming has richer info
		if (
			incoming.description &&
			(!master.description || incoming.description.length > (master.description?.length ?? 0))
		) {
			master.description = incoming.description;
		}

		// Preserve group if incoming has it (don't overwrite master's group)
		if (incoming.group && !master.group) {
			master.group = incoming.group;
		}

		// Update last updated timestamp
		master.updatedAt = Date.now();
	}

	/**
	 * Get entity by ID
	 */
	getEntity(id: string): Entity | null {
		return this.entityStore.getEntity(id);
	}

	/**
	 * Find entity by name (case-insensitive, canonical)
	 */
	findByName(name: string): Entity | null {
		return this.entityStore.findByName(name);
	}

	/**
	 * Find entity by canonical name (handles variations)
	 */
	private findByCanonicalName(name: string): Entity | null {
		const canonical = name.toLowerCase().trim();
		const allEntities = this.entityStore.getAllEntities();
		return allEntities.find((e) => e.name.toLowerCase().trim() === canonical) ?? null;
	}

	/**
	 * Get all entities
	 */
	getAllEntities(): Entity[] {
		return this.entityStore.getAllEntities();
	}

	/**
	 * Get entities sorted by frequency (most frequently mentioned first)
	 */
	getEntitiesByFrequency(): Entity[] {
		return this.getAllEntities().sort((a, b) => b.frequency - a.frequency);
	}

	/**
	 * Get entities from a specific group
	 */
	getEntitiesByGroup(groupId: string): Entity[] {
		return this.getAllEntities().filter((e) => e.group === groupId);
	}

	/**
	 * Get entities with a specific tag
	 */
	getEntitiesByTag(tag: string): Entity[] {
		return this.getAllEntities().filter((e) => e.tags && e.tags.includes(tag));
	}

	/**
	 * Get entities from a specific source document
	 */
	getEntitiesBySource(source: string): Entity[] {
		return this.getAllEntities().filter((e) => e.sources && e.sources.some((s) => s.document === source));
	}

	/**
	 * Update index after changes
	 */
	private updateIndex(): void {
		this.index = buildIndex(this.entityStore.getAllEntities());
	}

	/**
	 * Persist all changes to disk (CSV + index file)
	 */
	async persist(): Promise<void> {
		try {
			// Update index before persisting
			this.updateIndex();

			// Persist entity store (saves CSV)
			await this.entityStore.persist();

			// Persist index file
			if (this.index) {
				await saveIndex(this.vault, this.index, this.settings.protocolFolderName, INDEX_FILE_NAME);
			}
		} catch (error) {
			console.error("Failed to persist master metadata:", error);
			throw error;
		}
	}

	/**
	 * Get statistics about the entity collection
	 */
	getStatistics(): {
		totalEntities: number;
		avgFrequency: number;
		mostFrequent: Entity | null;
		entitiesWithSources: number;
		entitiesWithTags: number;
		entitiesWithDescription: number;
	} {
		const entities = this.getAllEntities();
		const totalFrequency = entities.reduce((sum, e) => sum + e.frequency, 0);

		return {
			totalEntities: entities.length,
			avgFrequency: entities.length > 0 ? totalFrequency / entities.length : 0,
			mostFrequent: entities.length > 0 ? this.getEntitiesByFrequency()[0] ?? null : null,
			entitiesWithSources: entities.filter((e) => e.sources && e.sources.length > 0).length,
			entitiesWithTags: entities.filter((e) => e.tags && e.tags.length > 0).length,
			entitiesWithDescription: entities.filter((e) => e.description).length,
		};
	}

	/**
	 * Export entities to JSON
	 */
	toJSON(): object & {
		version: string;
		exportDate: string;
		statistics: ReturnType<MasterMetadata["getStatistics"]>;
		entities: Entity[];
	} {
		return {
			version: "1.0",
			exportDate: new Date().toISOString(),
			statistics: this.getStatistics(),
			entities: this.getAllEntities(),
		};
	}
}
