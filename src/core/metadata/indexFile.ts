/**
 * Master metadata index management
 *
 * Loads and manages in-memory index for fast entity lookups.
 * Index is stored as JSON and cached on plugin load.
 */

import { Vault, TFile } from "obsidian";
import { Entity, MasterMetadataIndex } from "../../types";

/**
 * Build a metadata index from entities array
 * @param entities Array of entities to index
 * @returns Populated index structure
 */
export function buildIndex(entities: Entity[]): MasterMetadataIndex {
	const index: MasterMetadataIndex = {
		nameToId: new Map(),
		canonicalToNames: new Map(),
		groupIndex: new Map(),
		lastUpdated: Date.now(),
		version: 1,
	};

	for (const entity of entities) {
		// Add name → ID mapping
		index.nameToId.set(entity.name.toLowerCase(), entity.id);

		// Add canonical → names mapping
		if (entity.canonical) {
			const canonical = entity.canonical.toLowerCase();
			if (!index.canonicalToNames.has(canonical)) {
				index.canonicalToNames.set(canonical, []);
			}
			index.canonicalToNames.get(canonical)!.push(entity.name);
		}

		// Add group index
		if (entity.group) {
			if (!index.groupIndex.has(entity.group)) {
				index.groupIndex.set(entity.group, []);
			}
			index.groupIndex.get(entity.group)!.push(entity.id);
		}
	}

	return index;
}

/**
 * Save index to vault as JSON file
 * @param vault Obsidian Vault instance
 * @param index Index to save
 * @param folderPath Path to protocol folder
 * @param fileName Name of index file
 */
export async function saveIndex(
	vault: Vault,
	index: MasterMetadataIndex,
	folderPath: string,
	fileName: string
): Promise<void> {
	const indexData = {
		nameToId: Array.from(index.nameToId.entries()),
		canonicalToNames: Array.from(index.canonicalToNames.entries()),
		groupIndex: Array.from(index.groupIndex.entries()),
		lastUpdated: index.lastUpdated,
		version: index.version,
	};

	const indexPath = `${folderPath}/${fileName}`;
	const indexJSON = JSON.stringify(indexData, null, 2);

	try {
		const existingFile = vault.getFileByPath(indexPath) as TFile;
		if (existingFile) {
			await vault.modify(existingFile, indexJSON);
		} else {
			await vault.create(indexPath, indexJSON);
		}
	} catch (error) {
		console.error("Error saving index file:", error);
		throw error;
	}
}

/**
 * Load index from vault
 * @param vault Obsidian Vault instance
 * @param folderPath Path to protocol folder
 * @param fileName Name of index file
 * @returns Loaded and parsed index
 */
export async function loadIndex(
	vault: Vault,
	folderPath: string,
	fileName: string
): Promise<MasterMetadataIndex | null> {
	const indexPath = `${folderPath}/${fileName}`;

	try {
		const file = vault.getFileByPath(indexPath) as TFile;
		if (!file) {
			console.warn(`Index file not found: ${indexPath}`);
			return null;
		}

		const content = await vault.read(file);
		const data = JSON.parse(content);

		return {
			nameToId: new Map(data.nameToId || []),
			canonicalToNames: new Map(data.canonicalToNames || []),
			groupIndex: new Map(data.groupIndex || []),
			lastUpdated: data.lastUpdated || Date.now(),
			version: data.version || 1,
		};
	} catch (error) {
		console.error("Error loading index file:", error);
		return null;
	}
}

/**
 * Check if an entity name exists in index
 * @param index The index to check
 * @param name Entity name to look up
 * @returns Entity ID if found, null otherwise
 */
export function findEntityByName(index: MasterMetadataIndex, name: string): string | null {
	return index.nameToId.get(name.toLowerCase()) || null;
}

/**
 * Get all entities in a group
 * @param index The index to check
 * @param groupName Group to look up
 * @returns Array of entity IDs in group
 */
export function getEntitiesByGroup(index: MasterMetadataIndex, groupName: string): string[] {
	return index.groupIndex.get(groupName) || [];
}
