import { MetadataReviewModal, EntityGroup } from './metadataReviewModal';
import { createEntity } from '../../core/metadata/__tests__/testHelpers';
import { App } from 'obsidian';

// Mock Obsidian app and vault
const mockApp = {
	vault: {
		getFiles: jest.fn(),
		getFileByPath: jest.fn(),
		getFolderByPath: jest.fn(),
	},
} as unknown as App;

describe('MetadataReviewModal', () => {
	let modal: MetadataReviewModal;
	const mockEntities = [
		createEntity({ name: 'Entity1', frequency: 100 }),
		createEntity({ name: 'Entity2', frequency: 200 }),
		createEntity({ name: 'Entity3', frequency: 300 }),
		createEntity({ name: 'Entity4', frequency: 400 }),
		createEntity({ name: 'Entity5', frequency: 500 }),
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(mockApp.vault.getFiles as jest.Mock).mockReturnValue([]);
		(mockApp.vault.getFolderByPath as jest.Mock).mockReturnValue(null);
		modal = new MetadataReviewModal(mockApp, mockEntities);
	});

	describe('Group creation and management', () => {
		test('should create empty modal with no groups initially', () => {
			expect(modal.groups).toEqual([]);
		});

		test('should add new group', () => {
			modal.createGroup('TestGroup');
			expect(modal.groups).toHaveLength(1);
			expect(modal.groups[0]!.name).toBe('TestGroup');
			expect(modal.groups[0]!.entities).toEqual([]);
		});

		test('should create multiple groups', () => {
			modal.createGroup('Group1');
			modal.createGroup('Group2');
			modal.createGroup('Group3');
			expect(modal.groups).toHaveLength(3);
		});

		test('should rename group', () => {
			const group = modal.createGroup('OldName');
			modal.renameGroup(group, 'NewName');
			expect(group.name).toBe('NewName');
		});

		test('should set group folder path', () => {
			const group = modal.createGroup('TestGroup');
			modal.setGroupFolder(group, 'notes/folder');
			expect(group.folderPath).toBe('notes/folder');
		});

		test('should confirm group', () => {
			const group = modal.createGroup('TestGroup');
			expect(group.isConfirmed).toBe(false);
			modal.confirmGroup(group);
			expect(group.isConfirmed).toBe(true);
		});
	});

	describe('Entity management in groups', () => {
		test('should add entity to group', () => {
			const group = modal.createGroup('TestGroup');
			const entity = mockEntities[0]!;
			modal.addEntityToGroup(group, entity);
			expect(group.entities).toContain(entity);
			expect(group.entities).toHaveLength(1);
		});

		test('should add multiple entities to group', () => {
			const group = modal.createGroup('TestGroup');
			modal.addEntityToGroup(group, mockEntities[0]!);
			modal.addEntityToGroup(group, mockEntities[1]!);
			modal.addEntityToGroup(group, mockEntities[2]!);
			expect(group.entities).toHaveLength(3);
		});

		test('should not add duplicate entity to same group', () => {
			const group = modal.createGroup('TestGroup');
			const entity = mockEntities[0]!;
			modal.addEntityToGroup(group, entity);
			modal.addEntityToGroup(group, entity);
			expect(group.entities).toHaveLength(1);
		});

		test('should remove entity from group', () => {
			const group = modal.createGroup('TestGroup');
			const entity = mockEntities[0]!;
			modal.addEntityToGroup(group, entity);
			modal.removeEntityFromGroup(group, entity);
			expect(group.entities).not.toContain(entity);
		});

		test('should move entity between groups', () => {
			const group1 = modal.createGroup('Group1');
			const group2 = modal.createGroup('Group2');
			const entity = mockEntities[0]!;

			modal.addEntityToGroup(group1, entity);
			expect(group1.entities).toContain(entity);

			modal.removeEntityFromGroup(group1, entity);
			modal.addEntityToGroup(group2, entity);
			expect(group1.entities).not.toContain(entity);
			expect(group2.entities).toContain(entity);
		});
	});

	describe('Tag management', () => {
		test('should add tag to group', () => {
			const group = modal.createGroup('TestGroup');
			modal.addTagToGroup(group, 'important');
			expect(group.tags).toContain('important');
		});

		test('should add multiple tags to group', () => {
			const group = modal.createGroup('TestGroup');
			modal.addTagToGroup(group, 'tag1');
			modal.addTagToGroup(group, 'tag2');
			modal.addTagToGroup(group, 'tag3');
			expect(group.tags).toHaveLength(3);
		});

		test('should not add duplicate tag', () => {
			const group = modal.createGroup('TestGroup');
			modal.addTagToGroup(group, 'duplicate');
			modal.addTagToGroup(group, 'duplicate');
			expect(group.tags).toHaveLength(1);
		});

		test('should remove tag from group', () => {
			const group = modal.createGroup('TestGroup');
			modal.addTagToGroup(group, 'removeme');
			modal.removeTagFromGroup(group, 'removeme');
			expect(group.tags).not.toContain('removeme');
		});
	});

	describe('Pagination', () => {
		beforeEach(() => {
			const group = modal.createGroup('LargeGroup');
			for (let i = 0; i < 150; i++) {
				modal.addEntityToGroup(group, createEntity({ name: `Entity${i}`, frequency: i }));
			}
			modal.itemsPerPage = 50;
		});

		test('should get first page of entities', () => {
			const group = modal.groups[0]!;
			const page = modal.getPageEntities(group, 0);
			expect(page).toHaveLength(50);
		});

		test('should get second page of entities', () => {
			const group = modal.groups[0]!;
			const page = modal.getPageEntities(group, 1);
			expect(page).toHaveLength(50);
		});

		test('should navigate to next page', () => {
			modal.currentPage = 0;
			modal.nextPage();
			expect(modal.currentPage).toBe(1);
		});

		test('should navigate to previous page', () => {
			modal.currentPage = 2;
			modal.previousPage();
			expect(modal.currentPage).toBe(1);
		});

		test('should get empty page for out-of-range page number', () => {
			const group = modal.groups[0]!;
			const page = modal.getPageEntities(group, 999);
			expect(page).toEqual([]);
		});
	});

	describe('Apply and cancel operations', () => {
		test('should return modified groups on apply', () => {
			const group1 = modal.createGroup('Group1');
			const group2 = modal.createGroup('Group2');
			modal.addEntityToGroup(group1, mockEntities[0]!);
			modal.setGroupFolder(group2, 'archive');

			const result = modal.applyChanges();
			expect(result).toHaveLength(2);
			expect(result[0]!.name).toBe('Group1');
			expect(result[1]!.name).toBe('Group2');
		});

		test('should discard changes on cancel', () => {
			const group = modal.createGroup('TestGroup');
			modal.addEntityToGroup(group, mockEntities[0]!);

			modal.cancelChanges();
			expect(modal.groups).toEqual([]);
		});
	});

	describe('Edge cases', () => {
		test('should handle empty entity set', () => {
			const emptyModal = new MetadataReviewModal(mockApp, []);
			expect(emptyModal.availableEntities).toEqual([]);
		});

		test('should handle very large entity sets', () => {
			const largeEntitySet = Array.from({ length: 1000 }, (_, i) =>
				createEntity({ name: `Entity${i}`, frequency: i })
			);
			const largeModal = new MetadataReviewModal(mockApp, largeEntitySet);
			expect(largeModal.availableEntities).toHaveLength(1000);
		});

		test('should handle group with many tags', () => {
			const group = modal.createGroup('TaggedGroup');
			for (let i = 0; i < 50; i++) {
				modal.addTagToGroup(group, `tag${i}`);
			}
			expect(group.tags).toHaveLength(50);
		});
	});

	describe('Integration scenarios', () => {
		test('should handle complete workflow', () => {
			const group1 = modal.createGroup('Important');
			const group2 = modal.createGroup('Archive');

			modal.addEntityToGroup(group1, mockEntities[0]!);
			modal.addEntityToGroup(group1, mockEntities[1]!);
			modal.addEntityToGroup(group2, mockEntities[2]!);
			modal.addEntityToGroup(group2, mockEntities[3]!);

			modal.setGroupFolder(group1, 'notes/important');
			modal.setGroupFolder(group2, 'notes/archive');

			modal.addTagToGroup(group1, 'priority');
			modal.addTagToGroup(group2, 'old');

			modal.confirmGroup(group1);
			modal.confirmGroup(group2);

			expect(modal.groups).toHaveLength(2);
			expect(group1.entities).toHaveLength(2);
			expect(group2.entities).toHaveLength(2);
		});

		test('should organize entities into multiple groups', () => {
			const groupsByType = new Map<string, number>();

			for (let i = 0; i < mockEntities.length; i++) {
				const groupName = `Group${i % 3}`;
				if (!groupsByType.has(groupName)) {
					modal.createGroup(groupName);
					groupsByType.set(groupName, modal.groups.length - 1);
				}
				const groupIndex = groupsByType.get(groupName)!;
				modal.addEntityToGroup(modal.groups[groupIndex]!, mockEntities[i]!);
			}

			expect(modal.groups).toHaveLength(3);
			modal.groups.forEach((group) => {
				expect(group.entities.length).toBeGreaterThan(0);
			});
		});
	});
});

