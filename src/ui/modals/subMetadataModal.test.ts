import { SubMetadataModal } from './subMetadataModal';
import { createEntity } from '../../core/metadata/__tests__/testHelpers';
import { App } from 'obsidian';

const mockApp = {
	vault: {
		getFiles: jest.fn(),
		getFileByPath: jest.fn(),
		getFolderByPath: jest.fn(),
	},
} as unknown as App;

describe('SubMetadataModal', () => {
	let modal: SubMetadataModal;
	const mockKeywords = [
		createEntity({ name: 'Lucy', frequency: 50 }),
		createEntity({ name: 'Magic', frequency: 45 }),
		createEntity({ name: 'Void', frequency: 30 }),
		createEntity({ name: 'Portal', frequency: 25 }),
		createEntity({ name: 'Ritual', frequency: 20 }),
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(mockApp.vault.getFiles as jest.Mock).mockReturnValue([]);
		(mockApp.vault.getFolderByPath as jest.Mock).mockReturnValue(null);
		modal = new SubMetadataModal(
			mockApp,
			mockKeywords,
			'characters/main',
			'characters/main/Lucy'
		);
	});

	describe('Keyword selection', () => {
		test('should start with no selected keywords', () => {
			expect(modal.getSelectedCount()).toBe(0);
		});

		test('should select a keyword', () => {
			modal.selectKeyword(mockKeywords[0]!);
			expect(modal.isKeywordSelected(mockKeywords[0]!)).toBe(true);
		});

		test('should deselect a keyword', () => {
			modal.selectKeyword(mockKeywords[0]!);
			modal.deselectKeyword(mockKeywords[0]!);
			expect(modal.isKeywordSelected(mockKeywords[0]!)).toBe(false);
		});

		test('should select multiple keywords', () => {
			modal.selectKeyword(mockKeywords[0]!);
			modal.selectKeyword(mockKeywords[1]!);
			modal.selectKeyword(mockKeywords[2]!);
			expect(modal.getSelectedCount()).toBe(3);
		});

		test('should not add duplicate selections', () => {
			modal.selectKeyword(mockKeywords[0]!);
			modal.selectKeyword(mockKeywords[0]!);
			expect(modal.getSelectedCount()).toBe(1);
		});

		test('should check selection state accurately', () => {
			modal.selectKeyword(mockKeywords[0]!);
			expect(modal.isKeywordSelected(mockKeywords[0]!)).toBe(true);
			expect(modal.isKeywordSelected(mockKeywords[1]!)).toBe(false);
		});
	});

	describe('Bulk selection operations', () => {
		test('should select all keywords', () => {
			modal.selectAll();
			expect(modal.getSelectedCount()).toBe(mockKeywords.length);
		});

		test('should deselect all keywords', () => {
			modal.selectAll();
			modal.deselectAll();
			expect(modal.getSelectedCount()).toBe(0);
		});

		test('should select all on current page', () => {
			modal.itemsPerPage = 2;
			modal.selectAllOnPage();
			expect(modal.getSelectedCount()).toBe(2);
		});

		test('should deselect all on current page', () => {
			modal.selectAll();
			modal.itemsPerPage = 2;
			modal.deselectAllOnPage();
			expect(modal.getSelectedCount()).toBe(
				mockKeywords.length - 2
			);
		});

		test('should handle select page boundary correctly', () => {
			modal.itemsPerPage = 2;
			modal.selectAllOnPage();
			expect(modal.getSelectedCount()).toBe(2);

			modal.nextPage();
			modal.selectAllOnPage();
			expect(modal.getSelectedCount()).toBe(4);
		});
	});

	describe('Pagination', () => {
		beforeEach(() => {
			modal.itemsPerPage = 2;
		});

		test('should get first page keywords', () => {
			const page = modal.getPageKeywords();
			expect(page).toHaveLength(2);
			expect(page[0]!.name).toBe('Lucy');
		});

		test('should get second page keywords', () => {
			modal.nextPage();
			const page = modal.getPageKeywords();
			expect(page).toHaveLength(2);
			expect(page[0]!.name).toBe('Void');
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

		test('should not go below page 0', () => {
			modal.currentPage = 0;
			modal.previousPage();
			expect(modal.currentPage).toBe(0);
		});

		test('should go to specific page', () => {
			modal.goToPage(2);
			expect(modal.currentPage).toBe(2);
		});

		test('should calculate page count correctly', () => {
			expect(modal.getTotalPages()).toBe(3);
		});

		test('should handle single page', () => {
			const singleKeyword = [mockKeywords[0]!];
			const singleModal = new SubMetadataModal(
				mockApp,
				singleKeyword,
				'test/folder',
				'test/note'
			);
			expect(singleModal.getTotalPages()).toBe(1);
		});

		test('should handle empty keyword set', () => {
			const emptyModal = new SubMetadataModal(
				mockApp,
				[],
				'test/folder',
				'test/note'
			);
			expect(emptyModal.getTotalPages()).toBe(1);
			expect(emptyModal.getPageKeywords()).toEqual([]);
		});
	});

	describe('Child note configuration building', () => {
		test('should build config for single selected keyword', () => {
			modal.selectKeyword(mockKeywords[0]!);
			const configs = modal.buildChildNoteConfigs();

			expect(configs).toHaveLength(1);
			expect(configs[0]!.keyword.name).toBe('Lucy');
			expect(configs[0]!.folderPath).toBe('characters/main');
			expect(configs[0]!.parentNotePath).toBe('characters/main/Lucy');
		});

		test('should build configs for multiple selected keywords', () => {
			modal.selectKeyword(mockKeywords[0]!);
			modal.selectKeyword(mockKeywords[2]!);
			modal.selectKeyword(mockKeywords[4]!);
			const configs = modal.buildChildNoteConfigs();

			expect(configs).toHaveLength(3);
			expect(configs.map((c) => c.keyword.name)).toEqual([
				'Lucy',
				'Void',
				'Ritual',
			]);
		});

		test('should not build config for unselected keywords', () => {
			modal.selectKeyword(mockKeywords[0]!);
			const configs = modal.buildChildNoteConfigs();

			expect(configs).toHaveLength(1);
			expect(configs[0]!.keyword.name).toBe('Lucy');
		});

		test('should include keyword sources in config', () => {
			const keywordWithSources = createEntity({
				name: 'TestKeyword',
				frequency: 10,
				sources: [
					{ document: 'doc1.md', lineNumbers: [1, 5, 10] },
					{ document: 'doc2.md', lineNumbers: [3] },
				],
			});

			const testModal = new SubMetadataModal(
				mockApp,
				[keywordWithSources],
				'test/folder',
				'test/note'
			);

			testModal.selectKeyword(keywordWithSources);
			const configs = testModal.buildChildNoteConfigs();

			expect(configs[0]!.sources).toHaveLength(2);
			expect(configs[0]!.sources[0]!.document).toBe('doc1.md');
		});

		test('should include keyword tags in config', () => {
			const keywordWithTags = createEntity({
				name: 'TaggedKeyword',
				frequency: 5,
				tags: ['character', 'important', 'storyline'],
			});

			const testModal = new SubMetadataModal(
				mockApp,
				[keywordWithTags],
				'test/folder',
				'test/note'
			);

			testModal.selectKeyword(keywordWithTags);
			const configs = testModal.buildChildNoteConfigs();

			expect(configs[0]!.tags).toEqual([
				'character',
				'important',
				'storyline',
			]);
		});
	});

	describe('Apply and cancel operations', () => {
		test('should return empty result when nothing selected', () => {
			const result = modal.applyChanges();
			expect(result.childNotes).toEqual([]);
			expect(result.cancelled).toBe(false);
		});

		test('should return selected keywords on apply', () => {
			modal.selectKeyword(mockKeywords[0]!);
			modal.selectKeyword(mockKeywords[2]!);
			const result = modal.applyChanges();

			expect(result.childNotes).toHaveLength(2);
			expect(result.cancelled).toBe(false);
		});

		test('should clear selections on cancel', () => {
			modal.selectKeyword(mockKeywords[0]!);
			modal.selectKeyword(mockKeywords[1]!);
			modal.cancelChanges();

			expect(modal.getSelectedCount()).toBe(0);
		});

		test('should preserve folder and parent paths in config', () => {
			modal.selectKeyword(mockKeywords[0]!);
			const result = modal.applyChanges();

			expect(result.childNotes[0]!.folderPath).toBe(
				'characters/main'
			);
			expect(result.childNotes[0]!.parentNotePath).toBe(
				'characters/main/Lucy'
			);
		});
	});

	describe('Modal initialization', () => {
		test('should initialize with provided keywords', () => {
			expect(modal.availableKeywords).toEqual(mockKeywords);
		});

		test('should initialize with folder path', () => {
			expect(modal.folderPath).toBe('characters/main');
		});

		test('should initialize with parent note path', () => {
			expect(modal.parentNotePath).toBe('characters/main/Lucy');
		});

		test('should start at page 0', () => {
			expect(modal.currentPage).toBe(0);
		});

		test('should have default items per page', () => {
			expect(modal.itemsPerPage).toBeGreaterThanOrEqual(50);
			expect(modal.itemsPerPage).toBeLessThanOrEqual(200);
		});
	});

	describe('Edge cases', () => {
		test('should handle empty keyword list', () => {
			const emptyModal = new SubMetadataModal(
				mockApp,
				[],
				'test/folder',
				'test/note'
			);
			expect(emptyModal.availableKeywords).toEqual([]);
			expect(emptyModal.getPageKeywords()).toEqual([]);
		});

		test('should handle large keyword sets', () => {
			const largeKeywordSet = Array.from({ length: 500 }, (_, i) =>
				createEntity({ name: `Keyword${i}`, frequency: i })
			);
			const largeModal = new SubMetadataModal(
				mockApp,
				largeKeywordSet,
				'test/folder',
				'test/note'
			);

			expect(largeModal.getTotalPages()).toBeGreaterThan(1);
			largeModal.selectAll();
			expect(largeModal.getSelectedCount()).toBe(500);
		});

		test('should handle special characters in keyword names', () => {
			const specialKeyword = createEntity({
				name: 'Keyword@#$%^&*()',
				frequency: 1,
			});
			const specialModal = new SubMetadataModal(
				mockApp,
				[specialKeyword],
				'test/folder',
				'test/note'
			);

			specialModal.selectKeyword(specialKeyword);
			expect(specialModal.isKeywordSelected(specialKeyword)).toBe(true);
		});

		test('should handle nested folder paths', () => {
			const deepModal = new SubMetadataModal(
				mockApp,
				mockKeywords,
				'characters/main/sub/deep/folder',
				'characters/main/sub/deep/folder/Note'
			);

			expect(deepModal.folderPath).toBe(
				'characters/main/sub/deep/folder'
			);
		});

		test('should handle keywords with empty sources array', () => {
			const noSourceKeyword = createEntity({
				name: 'NoSource',
				frequency: 1,
				sources: [],
			});

			const noSourceModal = new SubMetadataModal(
				mockApp,
				[noSourceKeyword],
				'test/folder',
				'test/note'
			);

			noSourceModal.selectKeyword(noSourceKeyword);
			const configs = noSourceModal.buildChildNoteConfigs();

			expect(configs[0]!.sources).toEqual([]);
		});

		test('should handle keywords with empty tags array', () => {
			const noTagsKeyword = createEntity({
				name: 'NoTags',
				frequency: 1,
				tags: [],
			});

			const noTagsModal = new SubMetadataModal(
				mockApp,
				[noTagsKeyword],
				'test/folder',
				'test/note'
			);

			noTagsModal.selectKeyword(noTagsKeyword);
			const configs = noTagsModal.buildChildNoteConfigs();

			expect(configs[0]!.tags).toEqual([]);
		});
	});

	describe('Integration scenarios', () => {
		test('should handle complete workflow', () => {
			// Select keywords across pages
			modal.itemsPerPage = 2;
			modal.selectAllOnPage(); // Page 0: Lucy, Magic
			expect(modal.getSelectedCount()).toBe(2);

			modal.nextPage();
			modal.selectAllOnPage(); // Page 1: Void, Portal
			expect(modal.getSelectedCount()).toBe(4);

			modal.nextPage();
			modal.selectAllOnPage(); // Page 2: Ritual
			expect(modal.getSelectedCount()).toBe(5);

			// Apply changes
			const result = modal.applyChanges();
			expect(result.childNotes).toHaveLength(5);
			result.childNotes.forEach((config) => {
				expect(config.folderPath).toBe('characters/main');
				expect(config.parentNotePath).toBe('characters/main/Lucy');
			});
		});

		test('should allow selective page selection', () => {
			modal.itemsPerPage = 2;

			// Select only odd-numbered keywords
			modal.currentPage = 0;
			modal.selectKeyword(mockKeywords[1]!); // Magic

			modal.nextPage();
			modal.selectKeyword(mockKeywords[3]!); // Portal

			expect(modal.getSelectedCount()).toBe(2);

			const result = modal.applyChanges();
			expect(result.childNotes.map((c) => c.keyword.name)).toEqual([
				'Magic',
				'Portal',
			]);
		});

		test('should handle deselection workflow', () => {
			modal.selectAll();
			expect(modal.getSelectedCount()).toBe(mockKeywords.length);

			// Deselect specific keyword
			modal.deselectKeyword(mockKeywords[0]!);
			expect(modal.getSelectedCount()).toBe(
				mockKeywords.length - 1
			);

			const result = modal.applyChanges();
			expect(result.childNotes).not.toContainEqual(
				expect.objectContaining({
					keyword: mockKeywords[0]!,
				})
			);
		});

		test('should maintain selection across page navigation', () => {
			modal.itemsPerPage = 2;

			// Select on page 0
			modal.selectKeyword(mockKeywords[0]!);
			modal.selectKeyword(mockKeywords[1]!);

			// Navigate to page 1 and back
			modal.nextPage();
			modal.previousPage();

			// Selection should persist
			expect(modal.isKeywordSelected(mockKeywords[0]!)).toBe(true);
			expect(modal.isKeywordSelected(mockKeywords[1]!)).toBe(true);
		});
	});
});
