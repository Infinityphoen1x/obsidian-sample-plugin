import { Entity, PluginSettings, SourceRef } from "../../../types";

// Counter for generating unique entity IDs in tests
let entityCounter = 0;

/**
 * Reset the entity counter (useful between tests)
 */
export function resetEntityCounter(): void {
	entityCounter = 0;
}

/**
 * Create a complete PluginSettings object for testing
 */
export function createMockSettings(overrides?: Partial<PluginSettings>): PluginSettings {
	return {
		protocolFolderName: ".metadata",
		masterMetadataFile: "master-entities.csv",
		indexFile: "index.json",
		desktopOnly: true,
		mobileWarning: false,
		logLevel: "info",
		chunkSize: 100,
		timelineMode: "static",
		showDescriptions: true,
		autoFormatFrontmatter: false,
		enableLogging: false,
		logRetentionDays: 30,
		...overrides,
	};
}

/**
 * Create a SourceRef object for testing
 */
export function createSourceRef(document: string, lineNumbers: number[] = []): SourceRef {
	return { document, lineNumbers };
}

/**
 * Create a complete Entity object for testing with all required fields
 */
export function createEntity(overrides?: Partial<Entity>): Entity {
	const now = Date.now();
	entityCounter++;
	return {
		id: `ent_test_${String(entityCounter).padStart(4, "0")}`,
		name: "Test Entity",
		frequency: 1,
		sources: [],
		tags: [],
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

/**
 * Create multiple entities with minimal boilerplate
 */
export function createEntities(count: number, namePrefix = "Entity"): Entity[] {
	const now = Date.now();
	return Array.from({ length: count }, (_, i) => ({
		id: `ent_test_${String(i + 1).padStart(4, "0")}`,
		name: `${namePrefix} ${i + 1}`,
		frequency: 1,
		sources: [],
		tags: [],
		createdAt: now,
		updatedAt: now,
	}));
}

/**
 * Create an entity with specific properties
 */
export function createEntityWithSources(name: string, sources: SourceRef[], frequency = 1): Entity {
	const now = Date.now();
	return {
		id: `ent_${name.toLowerCase().replace(/\s+/g, "_")}_0001`,
		name,
		frequency,
		sources,
		tags: [],
		createdAt: now,
		updatedAt: now,
	};
}

/**
 * Create an entity with tags
 */
export function createEntityWithTags(name: string, tags: string[], frequency = 1): Entity {
	const now = Date.now();
	return {
		id: `ent_${name.toLowerCase().replace(/\s+/g, "_")}_0001`,
		name,
		frequency,
		sources: [],
		tags,
		createdAt: now,
		updatedAt: now,
	};
}

/**
 * Create an entity with group
 */
export function createEntityWithGroup(name: string, group: string, frequency = 1): Entity {
	const now = Date.now();
	return {
		id: `ent_${name.toLowerCase().replace(/\s+/g, "_")}_0001`,
		name,
		frequency,
		sources: [],
		tags: [],
		group,
		createdAt: now,
		updatedAt: now,
	};
}

/**
 * Create an entity with description
 */
export function createEntityWithDescription(name: string, description: string, frequency = 1): Entity {
	const now = Date.now();
	return {
		id: `ent_${name.toLowerCase().replace(/\s+/g, "_")}_0001`,
		name,
		frequency,
		sources: [],
		tags: [],
		description,
		createdAt: now,
		updatedAt: now,
	};
}
