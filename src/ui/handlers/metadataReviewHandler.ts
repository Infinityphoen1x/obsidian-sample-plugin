/**
 * Metadata Review Handler
 *
 * Handles the metadata review workflow:
 * - User reviews extracted entities and groups
 * - Optionally triggers glossary building
 * - Returns to normal editor view
 */

import { Plugin, Notice } from 'obsidian';
import { Entity, Group, PluginSettings } from '../../types';
import { EntityStore } from '../../core/metadata/entityStore';
import { GlossaryManager } from '../../core/metadata/glossaryManager';
import { log } from '../../protocol/logManager';

export class MetadataReviewHandler {
	constructor(
		private plugin: Plugin,
		private entityStore?: EntityStore,
		private glossaryManager?: GlossaryManager | null
	) {}

	/**
	 * Process metadata review: persist entities and optionally build glossary
	 */
	async handle(
		groups: Group[],
		entities: Entity[],
		buildGlossary: boolean = false
	): Promise<void> {
		try {
			// Persist entities
			if (this.entityStore) {
				await this.entityStore.persist();
				new Notice(
					`✅ Metadata review complete: ${entities.length} entities persisted`
				);
			}

			// Optionally build glossary from groups and entities
			if (buildGlossary && this.glossaryManager) {
				try {
					this.glossaryManager.buildFromGroupsAndEntities(groups, entities);
					await this.glossaryManager.persist();
					new Notice('📚 Glossary built successfully');
				} catch (error) {
					console.warn('Glossary building error (non-fatal):', error);
				}
			}

			// Log the operation
			await log(
				this.plugin.app.vault,
				this.plugin as unknown as PluginSettings,
				'metadata-review',
				'Completed metadata review',
				{
					entitiesCount: entities.length,
					groupsCount: groups.length,
					glossaryBuilt: buildGlossary,
				}
			).catch((err) => console.warn('Failed to log review:', err));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error('Error in metadata review:', error);
			new Notice(`❌ Error in metadata review: ${errorMessage}`);
		}
	}
}
