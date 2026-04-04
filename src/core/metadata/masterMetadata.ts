/**
 * Master metadata management
 *
 * High-level manager for all entity metadata.
 * Handles loading, persisting, and querying entities.
 */

import { Vault } from "obsidian";
import { Entity, MasterMetadataIndex, PluginSettings } from "../../types";
import { EntityStore } from "./entityStore";
import { buildIndex, saveIndex, loadIndex } from "./indexFile";

export class MasterMetadata {
	private entityStore: EntityStore;
	private index: MasterMetadataIndex | null = null;

	constructor(vault: Vault, settings: PluginSettings) {
		this.entityStore = new EntityStore(
			vault,
			settings.protocolFolderName,
			settings.masterMetadataFile
		);
	}

	async initialize(): Promise<void> {
		// TODO: Load existing entities and index
	}

	addEntity(entity: Entity): void {
		this.entityStore.addEntity(entity);
	}

	getEntity(id: string): Entity | null {
		return this.entityStore.getEntity(id);
	}

	findByName(name: string): Entity | null {
		return this.entityStore.findByName(name);
	}

	getAllEntities(): Entity[] {
		return this.entityStore.getAllEntities();
	}

	async persist(): Promise<void> {
		await this.entityStore.persist();
	}
}
