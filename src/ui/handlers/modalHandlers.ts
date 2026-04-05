/**
 * Modal Handlers
 *
 * Integration layer between modals and plugin lifecycle.
 * Handles modal results, data persistence, and UI feedback.
 */

import { App, Notice, Vault } from 'obsidian';
import { Entity, PluginSettings, TimelineEvent } from '../../types';
import { MetadataReviewModal, EntityGroup, MetadataReviewResult } from '../modals/metadataReviewModal';
import { SubMetadataModal, ChildNoteConfig, SubMetadataResult } from '../modals/subMetadataModal';
import { TimelineModal, TimelineModalResult } from '../modals/timelineModal';
import { log } from '../../protocol/logManager';
import { EntityStore } from '../../core/metadata/entityStore';

/**
 * Handle metadata review modal - organize entities into groups
 */
export async function handleMetadataReview(
	app: App,
	vault: Vault,
	entities: Entity[],
	settings: PluginSettings,
	entityStore?: EntityStore
): Promise<void> {
	return new Promise((resolve) => {
		const modal = new MetadataReviewModal(
			app,
			entities,
			async (result: MetadataReviewResult) => {
				if (!result.cancelled && result.groups.length > 0) {
					try {
						// Create groups and folders
						for (const group of result.groups) {
							if (group.folderPath) {
								const folderPath = group.folderPath.endsWith('/') 
									? group.folderPath 
									: group.folderPath + '/';
								
								try {
									await vault.getAbstractFileByPath(folderPath) || 
										await vault.createFolder(folderPath);
								} catch (e) {
									console.warn(`Folder ${folderPath} may already exist`);
								}

								// Create parent note if needed
								const parentNoteName = `${group.name}.md`;
								const parentNotePath = folderPath + parentNoteName;
								
								const existingNote = await vault.getAbstractFileByPath(parentNotePath);
								if (!existingNote) {
									const frontmatter = {
										type: 'parent',
										groupId: `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
										keyTermIds: group.entities.map(e => e.id),
										tags: group.tags,
									};

									const fmStr = Object.entries(frontmatter)
										.map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
										.join('\n');

									const content = `---
${fmStr}
---

# ${group.name}

## Entities

| Entity | Frequency | Sources |
|--------|-----------|---------|
${group.entities.map(e => `| [[${e.name}]] | ${e.frequency} | ${e.sources.map(s => s.document).join(', ')} |`).join('\n')}

## Description

`;
									await vault.create(parentNotePath, content);
									new Notice(`✅ Created parent note: ${group.name}`);
								}
							}
						}

						// Log the action
						await log(
							vault,
							settings,
							'metadata-review',
							`Organized ${result.groups.length} groups`,
							{
								groups: result.groups.length,
								totalEntities: result.groups.reduce((sum, g) => sum + g.entities.length, 0),
								tags: result.groups.flatMap(g => g.tags),
							}
						);

						new Notice(`✅ Metadata review complete: ${result.groups.length} groups created`);
					} catch (error) {
						console.error('Error handling metadata review:', error);
						new Notice(`❌ Error creating groups: ${error}`);
					}
				} else {
					new Notice('Metadata review cancelled');
				}
				resolve();
			},
			() => {
				new Notice('Metadata review cancelled');
				resolve();
			}
		);

		modal.open();
	});
}

/**
 * Handle sub-metadata modal - create child notes for selected entities
 */
export async function handleSubMetadata(
	app: App,
	vault: Vault,
	keywords: Entity[],
	folderPath: string,
	parentNotePath: string,
	settings: PluginSettings,
): Promise<void> {
	return new Promise((resolve) => {
		const modal = new SubMetadataModal(
			app,
			keywords,
			folderPath,
			parentNotePath,
			async (result: SubMetadataResult) => {
				if (!result.cancelled && result.childNotes.length > 0) {
					try {
						let createdCount = 0;

						for (const config of result.childNotes) {
							const childNoteName = `${config.keyword.name}.md`;
							const childNotePath = config.folderPath + childNoteName;

							const existingNote = await vault.getAbstractFileByPath(childNotePath);
							if (!existingNote) {
								const frontmatter = {
									type: 'child',
									parentId: config.parentNotePath,
									entityId: config.keyword.id,
									tags: config.tags,
								};

								const fmStr = Object.entries(frontmatter)
									.map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
									.join('\n');

								const content = `---
${fmStr}
---

# ${config.keyword.name}

Parent: [[${config.parentNotePath.split('/').pop()?.replace('.md', '') || 'Parent'}]]

## Sources

| Document | Lines |
|----------|-------|
${config.sources.map(s => `| ${s.document} | ${s.lineNumbers.join(', ')} |`).join('\n')}

## Description

`;
								await vault.create(childNotePath, content);
								createdCount++;
							}
						}

						await log(
							vault,
							settings,
							'sub-metadata-review',
							`Created ${createdCount} child notes`,
							{
								created: createdCount,
								total: result.childNotes.length,
								folder: folderPath,
							}
						);

						new Notice(`✅ Created ${createdCount} child notes`);
					} catch (error) {
						console.error('Error handling sub-metadata:', error);
						new Notice(`❌ Error creating child notes: ${error}`);
					}
				} else {
					new Notice('Child note creation cancelled');
				}
				resolve();
			},
			() => {
				new Notice('Child note creation cancelled');
				resolve();
			}
		);

		modal.open();
	});
}

/**
 * Handle timeline modal - create timeline snapshots
 */
export async function handleTimeline(
	app: App,
	vault: Vault,
	events: TimelineEvent[],
	sourceDocument: string,
	settings: PluginSettings,
): Promise<void> {
	return new Promise((resolve) => {
		const modal = new TimelineModal(
			app,
			events,
			sourceDocument,
			async (result: TimelineModalResult) => {
				if (!result.cancelled && result.snapshot) {
					try {
						await log(
							vault,
							settings,
							'timeline-edits',
							`Created timeline snapshot: ${result.snapshot.name}`,
							{
								snapshotName: result.snapshot.name,
								eventCount: result.snapshot.events.length,
								sourceDocument: result.snapshot.documentSource,
								snapshotId: result.snapshot.id,
							}
						);

						new Notice(`✅ Timeline snapshot created: ${result.snapshot.name}`);
					} catch (error) {
						console.error('Error handling timeline:', error);
						new Notice(`❌ Error creating timeline: ${error}`);
					}
				} else {
					new Notice('Timeline creation cancelled');
				}
				resolve();
			},
			() => {
				new Notice('Timeline creation cancelled');
				resolve();
			}
		);

		modal.open();
	});
}
