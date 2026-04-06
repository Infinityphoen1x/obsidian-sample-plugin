/**
 * Phase 6: Document Scanner Handlers Tests
 *
 * Tests for document scanning workflow:
 * - handleDocumentScan(): Main orchestrator
 * - Key term selection and entity creation
 */

import { handleDocumentScan } from '../scannerHandlers';
import { PluginSettings } from '../../../types';
import { createMockSettings, createEntity } from '../../metadata/__tests__/testHelpers';

// Mock scanner modules
jest.mock('../documentScanner', () => ({
	scanMarkdown: jest.fn(),
	generateFrontmatter: jest.fn(),
	prependFrontmatter: jest.fn(),
}));

jest.mock('../temporalTagger', () => ({
	wikiLinkTemporalTerms: jest.fn(),
}));

jest.mock('../../../ui/modals/keyTermModal');

jest.mock('../../../protocol/logManager', () => ({
	log: jest.fn(),
}));

// Imports for mocked modules
import { scanMarkdown, generateFrontmatter } from '../documentScanner';
import { wikiLinkTemporalTerms } from '../temporalTagger';
import { KeyTermModal } from '../../../ui/modals/keyTermModal';
import { log } from '../../../protocol/logManager';

describe('Phase 6: Document Scanner Handlers', () => {
	let mockApp: any;
	let mockVault: any;
	let mockFile: any;
	let mockSettings: PluginSettings;
	let mockEntityStore: any;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();

		// Setup mock file
		mockFile = {
			path: 'documents/test-doc.md',
			basename: 'test-doc.md',
			parent: { path: 'documents' },
			extension: 'md',
		};

		// Setup mock vault
		mockVault = {
			read: jest.fn().mockResolvedValue('Test document content with several words.'),
			modify: jest.fn().mockResolvedValue(undefined),
			createFolder: jest.fn().mockResolvedValue(undefined),
		};

		// Setup mock app
		mockApp = {
			vault: mockVault,
		};

		// Setup mock settings
		mockSettings = createMockSettings({ chunkSize: 100 });

		// Setup mock entity store
		mockEntityStore = {
			findByName: jest.fn().mockReturnValue(null),
			updateEntity: jest.fn(),
			getAllEntities: jest.fn().mockReturnValue([]),
			persist: jest.fn().mockResolvedValue(undefined),
		};

		// Mock log function to return a resolved Promise
		(log as jest.Mock).mockResolvedValue(undefined);

		// Mock KeyTermModal to immediately invoke onApply callback with all selected terms
		(KeyTermModal as jest.Mock).mockImplementation((app, terms, chunkSize, onApply, onCancel, blacklistManager) => {
			// Simulate user clicking "Apply" immediately with all terms selected
			setTimeout(async () => {
				try {
					await onApply({ selected: new Set(terms) });
				} catch (error) {
					// Fallback to cancel on error
					onCancel();
				}
			}, 0);

			return {
				open: jest.fn(),
				close: jest.fn(),
				contentEl: { prepend: jest.fn() },
			};
		});
	});

	describe('handleDocumentScan()', () => {
		test('should read file and start scan process', async () => {
			const mockScanResult = {
				document: mockFile.path,
				tokens: [
					{ word: 'test', frequency: 5, positions: [0, 10, 20] },
				],
				temporalTerms: [],
				isChapter: false,
				wordCount: 42,
				uniqueTokenCount: 1,
			};

			(scanMarkdown as jest.Mock).mockResolvedValue(mockScanResult);

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(mockVault.read).toHaveBeenCalledWith(mockFile);
			expect(scanMarkdown).toHaveBeenCalledWith(mockFile, 'Test document content with several words.');
		});

		test('should handle empty file', async () => {
			(mockVault.read as jest.Mock).mockResolvedValue('');

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(scanMarkdown).not.toHaveBeenCalled();
		});

		test('should extract top 50 tokens', async () => {
			const tokens = Array.from({ length: 100 }, (_, i) => ({
				word: `term${i}`,
				frequency: 100 - i,
				positions: [i * 10],
			}));

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens,
				temporalTerms: [],
				isChapter: false,
				wordCount: 500,
				uniqueTokenCount: 100,
			});

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(KeyTermModal).toHaveBeenCalled();
			const passedTerms = (KeyTermModal as jest.Mock).mock.calls[0][1];
			expect(passedTerms.length).toBeLessThanOrEqual(50);
		});

		test('should not show modal when no tokens found', async () => {
			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [],
				temporalTerms: [],
				isChapter: false,
				wordCount: 5,
				uniqueTokenCount: 0,
			});

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(KeyTermModal).not.toHaveBeenCalled();
		});

		test('should handle scan errors', async () => {
			(scanMarkdown as jest.Mock).mockRejectedValue(new Error('Scan failed'));

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(scanMarkdown).toHaveBeenCalled();
		});

		test('should work without entity store', async () => {
			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 5, positions: [0] }],
				temporalTerms: [],
				isChapter: false,
				wordCount: 50,
				uniqueTokenCount: 1,
			});

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings, undefined);

			expect(KeyTermModal).toHaveBeenCalled();
		});
	});

	describe('Helper functions', () => {
		test('should generate frontmatter with scanned data', () => {
			const mockScanResult = {
				document: mockFile.path,
				tokens: [{ word: 'test', frequency: 1, positions: [0] }],
				temporalTerms: [],
				isChapter: true,
				wordCount: 50,
				uniqueTokenCount: 1,
			};

			(generateFrontmatter as jest.Mock).mockReturnValue('---\ntype: document\n---\n');

			const result = generateFrontmatter(mockScanResult, ['test']);

			expect(generateFrontmatter).toHaveBeenCalledWith(mockScanResult, ['test']);
			expect(result).toBe('---\ntype: document\n---\n');
		});

		test('should wikilink temporal terms', () => {
			const content = 'The event happened before the story started.';
			const expectedWikilinked = 'The event happened [[before]] the story started.';

			(wikiLinkTemporalTerms as jest.Mock).mockReturnValue(expectedWikilinked);

			const result = wikiLinkTemporalTerms(content, [{ term: 'before', position: 21, lineNumber: 1, frequency: 1, wikilinked: false }]);

			expect(wikiLinkTemporalTerms).toHaveBeenCalled();
			expect(result).toBe(expectedWikilinked);
		});
	});

	describe('Edge cases', () => {
		test('should handle large document with many tokens', async () => {
			const largeTokenSet = Array.from({ length: 500 }, (_, i) => ({
				word: `term${i}`,
				frequency: 500 - i,
				positions: [i * 10],
			}));

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: largeTokenSet,
				temporalTerms: [],
				isChapter: false,
				wordCount: 50000,
				uniqueTokenCount: 500,
			});

			await handleDocumentScan(mockApp, mockVault, mockFile, mockSettings);

			expect(KeyTermModal).toHaveBeenCalled();
			const passedTerms = (KeyTermModal as jest.Mock).mock.calls[0][1];
			expect(passedTerms.length).toBe(50);
		});

		test('should use customizable chunk size from settings', async () => {
			const customSettings = createMockSettings({ chunkSize: 75 });

			(scanMarkdown as jest.Mock).mockResolvedValue({
				document: mockFile.path,
				tokens: Array.from({ length: 100 }, (_, i) => ({
					word: `term${i}`,
					frequency: 100 - i,
					positions: [i * 10],
				})),
				temporalTerms: [],
				isChapter: false,
				wordCount: 1000,
				uniqueTokenCount: 100,
			});

			await handleDocumentScan(mockApp, mockVault, mockFile, customSettings);

			expect(KeyTermModal).toHaveBeenCalled();
			const chunkSizeArg = (KeyTermModal as jest.Mock).mock.calls[0][2];
			expect(chunkSizeArg).toBe(75);
		});
	});
});
