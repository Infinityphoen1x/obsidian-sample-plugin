/**
 * Entity store management
 *
 * Manages entity creation, updates, and persistence.
 * Maintains in-memory cache + CSV file backend.
 */

import { Vault } from "obsidian";
import { Entity, MasterMetadataIndex, EntityStoreInterface } from "../../types";
import { generateEntityId } from "../../utils/idGenerator";
import { parseCSV, serializeCSV } from "../../utils/csvParser";
import { buildIndex } from "./indexFile";

export class EntityStore implements EntityStoreInterface {
	private entities: Map<string, Entity> = new Map();
	private index: MasterMetadataIndex | null = null;
	private vault: Vault | null = null;
	private protocolFolderPath: string = "";
	private masterMetadataFile: string = "";

	constructor(
		vault: Vault,
		protocolFolderPath: string,
		masterMetadataFile: string
	) {
		this.vault = vault;
		this.protocolFolderPath = protocolFolderPath;
		this.masterMetadataFile = masterMetadataFile;
	}

	/**
	 * Load entities from CSV file
	 */
	async loadEntities(): Promise<void> {
		if (!this.vault) {
			console.debug("loadEntities: vault not available");
			return;
		}

		try {
			const filePath = `${this.protocolFolderPath}/${this.masterMetadataFile}`;
			const file = this.vault.getFileByPath(filePath);
			if (!file) {
				console.debug("loadEntities: file not found at", filePath);
				return;
			}

			// Read and validate file content
			let content: string;
			try {
				content = await this.vault.read(file);
			} catch (readError) {
				console.error("Error reading entity file:", readError);
				return;
			}

			if (!content || typeof content !== "string") {
				console.warn("loadEntities: invalid or empty file content");
				return;
			}

			// Parse CSV with error handling
			let parsedEntities: Entity[];
			try {
				parsedEntities = parseCSV(content);
			} catch (parseError) {
				console.error("Error parsing CSV content:", parseError);
				return;
			}

			if (!Array.isArray(parsedEntities)) {
				console.warn("loadEntities: parseCSV did not return an array");
				return;
			}

			// Load entities with validation
			this.entities.clear();
			for (const entity of parsedEntities) {
				try {
					if (entity && entity.id && entity.name) {
						this.entities.set(entity.id, entity);
					} else {
						console.debug("loadEntities: skipping invalid entity", entity);
					}
				} catch (entityError) {
					console.debug("Error loading entity:", entityError);
					// Continue with next entity
				}
			}

			// Rebuild index with error handling
			try {
				this.index = buildIndex(parsedEntities);
			} catch (indexError) {
				console.warn("Error rebuilding index:", indexError);
				// Continue - index is optional
			}
		} catch (error) {
			console.error("Error loading entities:", error);
		}
	}

	addEntity(entity: Entity): void {
		this.entities.set(entity.id, entity);
		if (this.index) {
			this.index.nameToId.set(entity.name.toLowerCase(), entity.id);
		}
	}

	updateEntity(id: string, updates: Partial<Entity>): void {
		const entity = this.entities.get(id);
		if (entity) {
			const updated = { ...entity, ...updates, updatedAt: Date.now() };
			this.entities.set(id, updated);

			if (this.index && updates.name) {
				this.index.nameToId.set(updates.name.toLowerCase(), id);
			}
		}
	}

	getEntity(id: string): Entity | null {
		return this.entities.get(id) || null;
	}

	findByName(name: string): Entity | null {
		if (!this.index) return null;

		const id = this.index.nameToId.get(name.toLowerCase());
		return id ? this.entities.get(id) || null : null;
	}

	getAllEntities(): Entity[] {
		return Array.from(this.entities.values());
	}

	/**
	 * Persist all entities to CSV file
	 */
	async persist(): Promise<void> {
		if (!this.vault) {
			console.debug("persist: vault not available");
			return;
		}

		try {
			// Update index timestamp first if available (separate concern)
			if (this.index) {
				this.index.lastUpdated = Date.now();
			}

			// Validate entities collection
			const entities = this.getAllEntities();

			// Validate entities array - allow empty for this operation
			if (!Array.isArray(entities)) {
				console.warn("persist: getAllEntities did not return valid data");
				return;
			}

			// Serialize to CSV with error handling
			let csv: string;
			try {
				csv = serializeCSV(entities);
			} catch (serializeError) {
				console.error("Error serializing entities to CSV:", serializeError);
				return;
			}

			// Validate CSV output
			if (!csv || typeof csv !== "string" || csv.trim().length === 0) {
				console.warn("persist: generated empty CSV");
				return;
			}

			// Perform file I/O with error handling
			const filePath = `${this.protocolFolderPath}/${this.masterMetadataFile}`;
			let file = this.vault.getFileByPath(filePath);

			try {
				if (file) {
					await this.vault.modify(file, csv);
				} else {
					await this.vault.create(filePath, csv);
				}
			} catch (fileError) {
				console.error("Error during file I/O operation:", fileError);
				throw fileError;
			}
		} catch (error) {
			console.error("Error persisting entities:", error);
			// Don't rethrow - allow plugin to continue
		}
	}

	getIndex(): MasterMetadataIndex | null {
		return this.index;
	}
}

/**
 * Create or get an entity (idempotent)
 * If entity with this name exists, return it; otherwise create new one
 */
export function getOrCreateEntity(
	store: EntityStore,
	name: string,
	group?: string
): Entity {
	let entity = store.findByName(name);

	if (!entity) {
		entity = {
			id: generateEntityId(name),
			name,
			frequency: 1,
			sources: [],
			group,
			tags: [],
			createdAt: Date.now(),
			updatedAt: Date.now(),
		};
		store.addEntity(entity);
	} else {
		// Update frequency if entity exists
		store.updateEntity(entity.id, { frequency: entity.frequency + 1 });
		// Retrieve updated entity from store
		entity = store.getEntity(entity.id)!;
	}

	return entity;
}
