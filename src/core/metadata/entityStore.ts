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
		if (!this.vault) return;

		try {
			const filePath = `${this.protocolFolderPath}/${this.masterMetadataFile}`;
			const file = this.vault.getFileByPath(filePath);
			if (!file) return;

			const content = await this.vault.read(file);
			const parsedEntities = parseCSV(content);

			this.entities.clear();
			parsedEntities.forEach((e) => this.entities.set(e.id, e));

			// Rebuild index
			this.index = buildIndex(parsedEntities);
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
		if (!this.vault) return;

		try {
			const entities = this.getAllEntities();
			const csv = serializeCSV(entities);

			const filePath = `${this.protocolFolderPath}/${this.masterMetadataFile}`;
			const file = this.vault.getFileByPath(filePath);

			if (file) {
				await this.vault.modify(file, csv);
			} else {
				await this.vault.create(filePath, csv);
			}

			// Update index timestamp
			if (this.index) {
				this.index.lastUpdated = Date.now();
			}
		} catch (error) {
			console.error("Error persisting entities:", error);
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
	}

	return entity;
}
