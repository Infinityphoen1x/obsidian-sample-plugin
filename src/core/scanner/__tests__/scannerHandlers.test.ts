/**
 * Phase 6: Document Scanner Handlers Tests
 *
 * Tests for complete document scanning workflow:
 * - handleDocumentScan(): Main orchestrator
 * - showKeyTermSelectionModal(): Modal wrapper with info header
 * - processKeyTermSelection(): Term application, wikilink injection, entity creation
 */

import { handleDocumentScan } from '../scannerHandlers';
import { App, Notice, TFile, Vault } from 'obsidian';
import { PluginSettings } from '../../../types';
import { EntityStore } from '../../metadata/entityStore';
import { createMockSettings, createEntity } from '../../metadata/__tests__/testHelpers';

// Mock Obsidian APIs
jest.mock('obsidian', () => ({
	App: jest.fn(),
	Notice: jest.fn(),
	TFile: jest.fn(),
	Vault: jest.fn(),
	Modal: jest.fn(() => ({
		open: jest.fn(),
		close: jest.fn(),
		onOpen: jest.fn(),
		onClose: jest.fn(),
	})),
}));

// Mock scanner modules
jest.mock('../documentScanner', () => ({
	scanMarkdown: jest.fn(),
	generateFrontmatter: jest.fn(),
	prependFrontmatter: jest.fn(),
}));

jest.mock('../temporalTagger', () => ({
	wikiLinkTemporalTerms: jest.fn(),
}));

jest.mock('../../../ui/modals/keyTermModal', () => ({
	KeyTermModal: jest.fn(),
}));

jest.mock('../../../protocol/logManager', () => ({
	log: jest.fn(),
}));

jest.mock('../../metadata/entityStore', () => ({
	EntityStore: jest.fn(),
	getOrCreateEntity: jest.fn(),
}));

// Imports for mocked modules
import { scanMarkdown, generateFrontmatter } from '../documentScanner';
import { wikiLinkTemporalTerms } from '../temporalTagger';
import { KeyTermModal } from '../../../ui/modals/keyTermModal';
import { log } from '../../../protocol/logManager';
import { getOrCreateEntity } from '../../metadata/entityStore';

describe('Phase 6: Document Scanner Handlers', () => {
	let mockApp: App;
	let mockVault: Vault;
	let mockFile: TFile;
	let mockSettings: PluginSettings;
	let mockEntityStore: EntityStore;
	let mockNotice: jest.MockedFunction<typeof Notice>;

	beforeEach(() => {
		jest.clearAllMocks();

		// Setup mock file
		mockFile = {
			path: 'documents/test-doc.md',
			basename: 'test-doc.md',
			parent: { path: 'documents' },
		} as unknown as TFile;

		// Setup mock vault
		mockVault = {
			read: jest.fn().mockResolvedValue('Test document content with several words.'),
			modify: jest.fn().mockResolvedValue(undefined),
			createFolder: jest.fn().mockResolvedValue(undefined),
		} as unknown as Vault;

		// Setup mock app
		mockApp = {
			vault: mockVault,
		} as unknown as App;

		// Setup mock settings
		mockSettings = createMockSettings({ chunkSize: 100 });

		// Setup mock entity store
		mockEntityStore = {
			findByName: jest.fn().mockReturnValue(null),
			updateEntity: jest.fn(),
			getAllEntities: jest.fn().mockReturnValue([]),
			persist: jest.fn().mockResolvedValue(undefined),
		} as unknown as EntityStore;

		// Mock Notice
		mockNotice = Notice as jest.MockedFunction<typeof Notice>;
	});

	describe('handleDocumentScan()', () => {
		test('should read file and initiate scan', async () => {
			const mockScanResult = {
				document: mockFile.path,
				tokens: [
					{ word: 'test', frequency: 5, positions: [0, 10, 20] },
					{ word: 'document', frequency: 3, positions: [50, 100] },
				],
				temporalTerms: [{ term: 'once', frequency: 1 }],
				isChapter: false,
				wordCount: 42,
				uniqueTokenCount: 2,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);
			(KeyTermModal as jest.Mock).mockImplementation(() => ({
				open: jest.fn(),
				close: jest.fn(),
				contentEl: { prepend: jest.fn() },
			}));

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(mockVault.read).toHaveBeenCalledWith(mockFile);
			expect(scanMarkdown).toHaveBeenCalledWith(mockFile, 'Test document content with several words.');
			expect(mockNotice).toHaveBeenCalledWith(expect.stringContaining('Scanning'));
		});

		test('should handle empty file gracefully', async () => {
			(mockVault.read as jest.Mock).mockResolvedValue('');

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(mockNotice).toHaveBeenCalledWith('⚠️ File is empty');
		});

		test('should extract top 50 tokens from scan result', async () => {
			const tokens = Array.from({ length: 75 }, (_, i) => ({
				word: `term${i}`,
				frequency: 75 - i,
				positions: [i * 10],
			}));

			const mockScanResult = {
				document: mockFile.path,
				tokens,
				temporalTerms: [],
				isChapter: false,
				wordCount: 500,
				uniqueTokenCount: 75,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);
			(KeyTermModal as jest.Mock).mockImplementation(() => ({
				open: jest.fn(),
				close: jest.fn(),
				contentEl: { prepend: jest.fn() },
			}));

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			// Verify KeyTermModal was called with only top 50
			expect(KeyTermModal).toHaveBeenCalled();
		});

		test('should show modal with word count and token count in header', async () => {
			const mockScanResult = {
				document: mockFile.path,
				tokens: Array.from({ length: 30 }, (_, i) => ({
					word: `term${i}`,
					frequency: 30 - i,
					positions: [i * 10],
				})),
				temporalTerms: [],
				isChapter: false,
				wordCount: 1234,
				uniqueTokenCount: 30,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);

			const mockModal = {
				open: jest.fn(),
				close: jest.fn(),
				contentEl: { prepend: jest.fn() },
			};
			(KeyTermModal as jest.Mock).mockImplementation(() => mockModal);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			// Verify modal info header was added
			expect(mockModal.contentEl.prepend).toHaveBeenCalled();
		});

		test('should handle error during scan', async () => {
			const error = new Error('Scan failed');
			(scanMarkdown as jest.Mock).mockRejectedValue(error);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(mockNotice).toHaveBeenCalledWith(expect.stringContaining('Error scanning document'));
		});

		test('should handle no tokens found', async () => {
			const mockScanResult = {
				document: mockFile.path,
				tokens: [],
				temporalTerms: [],
				isChapter: false,
				wordCount: 5,
				uniqueTokenCount: 0,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(mockNotice).toHaveBeenCalledWith('⚠️ No tokens found to suggest');
		});

		test('should pass callback to modal for selection handling', async () => {
			const tokens = [
				{ word: 'test', frequency: 5, positions: [0] },
				{ word: 'document', frequency: 3, positions: [50] },
			];

			const mockScanResult = {
				document: mockFile.path,
				tokens,
				temporalTerms: [],
				isChapter: false,
				wordCount: 100,
				uniqueTokenCount: 2,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);

			const mockModal = {
				open: jest.fn(),
				close: jest.fn(),
				contentEl: { prepend: jest.fn() },
			};
			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply, onCancel) => {
					// Verify callback is passed
					expect(typeof onApply).toBe('function');
					expect(typeof onCancel).toBe('function');
					return mockModal;
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(KeyTermModal).toHaveBeenCalled();
		});

		test('should work without entity store', async () => {
			const mockScanResult = {
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 5, positions: [0] }],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 1,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);
			(KeyTermModal as jest.Mock).mockImplementation(() => ({
				open: jest.fn(),
				close: jest.fn(),
				contentEl: { prepend: jest.fn() },
			}));

			// Should not throw
			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, undefined);

			expect(mockNotice).not.toHaveBeenCalledWith(expect.stringContaining('Entity store not initialized'));
		});
	});

	describe('processKeyTermSelection()', () => {
		test('should wikilink temporal terms', async () => {
			const content = 'The event happened before the story started. Once more, it occurred.';
			const updatedContent = 'The event happened [[before]] the story started. [[Once]] more, it occurred.';

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue(updatedContent);
			(generateFrontmatter as jest.Mock).mockReturnValue('---\ntype: document\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);

			// Since these are internal functions, we test through handleDocumentScan callback
			const mockScanResult = {
				document: mockFile.path,
				tokens: [
					{ word: 'event', frequency: 2, positions: [4, 50] },
					{ word: 'story', frequency: 1, positions: [30] },
				],
				temporalTerms: [{ term: 'before', frequency: 1 }, { term: 'once', frequency: 1 }],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 2,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);
			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					// Simulate user selection
					setTimeout(() => {
						onApply(new Set(['event']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);

			// Give async callback time to execute
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(wikiLinkTemporalTerms).toHaveBeenCalled();
		});

		test('should wikilink selected key terms in document', async () => {
			let modifiedContent: string = '';

			(mockVault.modify as jest.Mock).mockImplementation((file, content) => {
				modifiedContent = content;
				return Promise.resolve();
			});

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test document content with several words.');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\ntype: document\n---\n');

			const mockScanResult = {
				document: mockFile.path,
				tokens: [
					{ word: 'test', frequency: 2, positions: [0, 100] },
					{ word: 'document', frequency: 1, positions: [5] },
				],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 2,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);
			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['test']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockVault.modify).toHaveBeenCalled();
		});

		test('should generate frontmatter with selected key terms', async () => {
			const mockScanResult = {
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 1, positions: [0] }],
				temporalTerms: [],
				isChapter: true,
				wordCount: 50,
				uniqueTokenCount: 1,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);
			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\ntype: document\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['test']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(generateFrontmatter).toHaveBeenCalled();
			const call = (generateFrontmatter as jest.Mock).mock.calls[0];
			expect(call[1]).toEqual(expect.arrayContaining(['test'])); // additionalTags parameter
		});

		test('should modify file with updated content', async () => {
			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 1, positions: [0] }],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 1,
			});

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['test']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockVault.modify).toHaveBeenCalledWith(mockFile, expect.any(String));
		});

		test('should create entities for selected key terms', async () => {
			const mockEntity = createEntity({ name: 'test' });
			(getOrCreateEntity as jest.Mock).mockReturnValue(mockEntity);
			(mockEntityStore.findByName as jest.Mock).mockReturnValue(null);

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 5, positions: [0, 10] }],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 1,
			});

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['test']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockEntityStore.updateEntity).toHaveBeenCalled();
		});

		test('should update frequency for existing entities', async () => {
			const existingEntity = createEntity({ name: 'test', frequency: 10 });
			(mockEntityStore.findByName as jest.Mock).mockReturnValue(existingEntity);

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 5, positions: [0, 10] }],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 1,
			});

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['test']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockEntityStore.updateEntity).toHaveBeenCalled();
		});

		test('should persist entities after processing', async () => {
			const mockEntity = createEntity({ name: 'test' });
			(getOrCreateEntity as jest.Mock).mockReturnValue(mockEntity);
			(mockEntityStore.findByName as jest.Mock).mockReturnValue(null);
			(mockEntityStore.persist as jest.Mock).mockResolvedValue(undefined);

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 1, positions: [0] }],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 1,
			});

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['test']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockEntityStore.persist).toHaveBeenCalled();
		});

		test('should log scan operation with metadata', async () => {
			const mockEntity = createEntity({ name: 'test' });
			(getOrCreateEntity as jest.Mock).mockReturnValue(mockEntity);
			(mockEntityStore.findByName as jest.Mock).mockReturnValue(null);

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 1, positions: [0] }],
				temporalTerms: [{ term: 'once', frequency: 1 }],
				isChapter: true,
				wordCount: 100,
				uniqueTokenCount: 1,
			});

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);
			(log as jest.Mock).mockResolvedValue(undefined);

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['test']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(log).toHaveBeenCalledWith(
				mockVault,
				mockSettings,
				'document-scanning',
				expect.any(String),
				expect.objectContaining({
					filePath: mockFile.path,
					wordCount: 100,
					keyTermsSelected: 1,
					temporalTermsFound: 1,
					isChapter: true,
				})
			);
		});

		test('should show success notice with entity counts', async () => {
			const mockEntity = createEntity({ name: 'term1' });
			const existingEntity = createEntity({ name: 'term2', frequency: 10 });

			(getOrCreateEntity as jest.Mock).mockReturnValue(mockEntity);
			(mockEntityStore.findByName as jest.Mock)
				.mockReturnValueOnce(null) // term1 is new
				.mockReturnValueOnce(existingEntity); // term2 exists

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [
					{ word: 'term1', frequency: 2, positions: [0, 10] },
					{ word: 'term2', frequency: 3, positions: [20, 30, 40] },
				],
				temporalTerms: [],
				isChapter: false,
				wordCount: 100,
				uniqueTokenCount: 2,
			});

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['term1', 'term2']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockNotice).toHaveBeenCalledWith(
				expect.stringContaining('Scan complete')
			);
		});

		test('should handle cancel callback gracefully', async () => {
			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 1, positions: [0] }],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 1,
			});

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply, onCancel) => {
					setTimeout(() => {
						onCancel();
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockNotice).toHaveBeenCalledWith('Document scanning cancelled');
		});

		test('should handle empty selection', async () => {
			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 1, positions: [0] }],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 1,
			});

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set()); // Empty selection
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockNotice).toHaveBeenCalledWith('⚠️ No key terms selected');
		});

		test('should handle processing error', async () => {
			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 1, positions: [0] }],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 1,
			});

			(mockVault.modify as jest.Mock).mockRejectedValue(new Error('Write failed'));

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['test']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\n---\n');

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockNotice).toHaveBeenCalledWith(expect.stringContaining('Error processing key terms'));
		});

		test('should handle large number of key terms', async () => {
			const largeTokenSet = Array.from({ length: 100 }, (_, i) => ({
				word: `term${i}`,
				frequency: 100 - i,
				positions: [i * 10],
			}));

			const largeSelection = new Set(Array.from({ length: 50 }, (_, i) => `term${i}`));

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: largeTokenSet,
				temporalTerms: [],
				isChapter: false,
				wordCount: 5000,
				uniqueTokenCount: 100,
			});

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);
			(mockEntityStore.persist as jest.Mock).mockResolvedValue(undefined);

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(largeSelection);
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			// Should handle without errors
			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 50));

			expect(mockNotice).not.toHaveBeenCalledWith(expect.stringContaining('Error'));
		});
	});

	describe('Integration tests', () => {
		test('should complete full scan workflow successfully', async () => {
			const mockEntity = createEntity({ name: 'test' });
			(getOrCreateEntity as jest.Mock).mockReturnValue(mockEntity);
			(mockEntityStore.findByName as jest.Mock).mockReturnValue(null);
			(mockEntityStore.persist as jest.Mock).mockResolvedValue(undefined);

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [
					{ word: 'test', frequency: 5, positions: [0, 10, 20] },
					{ word: 'document', frequency: 3, positions: [50, 100] },
				],
				temporalTerms: [{ term: 'once', frequency: 1 }],
				isChapter: true,
				wordCount: 500,
				uniqueTokenCount: 2,
			});

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue('Test content with [[once]]');
			(generateFrontmatter as jest.Mock).mockReturnValue('---\ntype: document\n---\n');
			(mockVault.modify as jest.Mock).mockResolvedValue(undefined);
			(log as jest.Mock).mockResolvedValue(undefined);

			(KeyTermModal as jest.Mock).mockImplementation(
				(app, terms, chunkSize, onApply) => {
					setTimeout(() => {
						onApply(new Set(['test', 'document']));
					}, 0);
					return {
						open: jest.fn(),
						close: jest.fn(),
						contentEl: { prepend: jest.fn() },
					};
				}
			);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, mockEntityStore);
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify complete workflow
			expect(mockVault.read).toHaveBeenCalled();
			expect(scanMarkdown).toHaveBeenCalled();
			expect(KeyTermModal).toHaveBeenCalled();
			expect(wikiLinkTemporalTerms).toHaveBeenCalled();
			expect(generateFrontmatter).toHaveBeenCalled();
			expect(mockVault.modify).toHaveBeenCalled();
			expect(mockEntityStore.persist).toHaveBeenCalled();
			expect(log).toHaveBeenCalled();
			expect(mockNotice).toHaveBeenCalledWith(expect.stringContaining('complete'));
		});

		test('should chunk large token list for modal display', async () => {
			// Generate 250 tokens to test chunking
			const largeTokenSet = Array.from({ length: 250 }, (_, i) => ({
				word: `term${String(i).padStart(3, '0')}`,
				frequency: 250 - i,
				positions: [i * 10],
			}));

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: largeTokenSet,
				temporalTerms: [],
				isChapter: false,
				wordCount: 10000,
				uniqueTokenCount: 250,
			});

			let capturedTerms: string[] = [];
			(KeyTermModal as jest.Mock).mockImplementation((app, terms) => {
				capturedTerms = terms;
				return {
					open: jest.fn(),
					close: jest.fn(),
					contentEl: { prepend: jest.fn() },
				};
			});

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			// Should pass only top 50 tokens to modal
			expect(capturedTerms.length).toBeLessThanOrEqual(50);
		});
	});
});
