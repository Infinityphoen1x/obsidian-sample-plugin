import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { StateManager, ModalState } from "../stateManager";
import { Vault, TFile, TAbstractFile, TFolder } from "obsidian";

describe("StateManager - Recovery Mechanism", () => {
	let mockVault: Vault;
	let stateManager: StateManager;

	beforeEach(() => {
		mockVault = {
			getAbstractFileByPath: jest.fn(),
			getMarkdownFiles: jest.fn(() => []),
			create: jest.fn(),
			modify: jest.fn(),
			delete: jest.fn(),
			createFolder: jest.fn(),
			read: jest.fn(),
		} as any;

		stateManager = new StateManager(mockVault);
	});

	describe("Modal State Saving", () => {
		it("should save modal state to recovery folder", async () => {
			const state: ModalState = {
				modalType: "description",
				entityId: "entity-123",
				content: "Test content",
				timestamp: Date.now(),
			};

			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
				null // Recovery folder doesn't exist
			);

			await stateManager.saveModalState(state);

			// Verify folder creation and file creation were called
			expect(mockVault.createFolder).toHaveBeenCalled();
			expect(mockVault.create).toHaveBeenCalled();
		});

		it("should not save invalid modal state", async () => {
			const invalidState = {
				// Missing modalType
				timestamp: Date.now(),
			} as any;

			await stateManager.saveModalState(invalidState);

			// Should not create file for invalid state
			expect(mockVault.create).not.toHaveBeenCalled();
		});

		it("should handle serialization errors gracefully", async () => {
			const state: ModalState = {
				modalType: "keyTerm",
				metadata: { circular: {} }, // Will cause serialization issues
				timestamp: Date.now(),
			};

			// Add circular reference
			(state.metadata as any).circular.back = state.metadata;

			await stateManager.saveModalState(state);

			// Should log error but not crash
			expect(mockVault.create).not.toHaveBeenCalled();
		});
	});

	describe("Modal State Loading", () => {
		it("should load saved modal states from recovery folder", async () => {
			const mockFile1 = {
				path: ".metadata/recovery/description-1234567890.json",
				name: "description-1234567890.json",
			} as TFile;

			const mockFile2 = {
				path: ".metadata/recovery/keyTerm-1234567891.json",
				name: "keyTerm-1234567891.json",
			} as TFile;

			const savedState1: ModalState = {
				modalType: "description",
				entityId: "entity-1",
				content: "Description content",
				timestamp: 1234567890,
			};

			const savedState2: ModalState = {
				modalType: "keyTerm",
				entityId: "entity-2",
				content: "Key term content",
				timestamp: 1234567891,
			};

			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(
				{} // Recovery folder exists
			);
			(mockVault.getMarkdownFiles as jest.Mock).mockReturnValue([mockFile1, mockFile2]);
			(mockVault.read as jest.Mock<any>)
				.mockResolvedValueOnce(JSON.stringify(savedState1))
				.mockResolvedValueOnce(JSON.stringify(savedState2));

			const states = await stateManager.loadSavedStates();

			expect(states).toHaveLength(2);
			expect(states[0].modalType).toBe("description");
			expect(states[1].modalType).toBe("keyTerm");
		});

		it("should skip invalid recovery files", async () => {
			const mockFile = {
				path: ".metadata/recovery/invalid.json",
				name: "invalid.json",
			} as TFile;

			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue({});
			(mockVault.getMarkdownFiles as jest.Mock).mockReturnValue([mockFile]);
			(mockVault.read as jest.Mock<any>).mockResolvedValue("invalid json content");

			const states = await stateManager.loadSavedStates();

			expect(states).toHaveLength(0);
		});

		it("should handle missing recovery folder", async () => {
			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);

			const states = await stateManager.loadSavedStates();

			expect(states).toHaveLength(0);
		});
	});

	describe("Recovery State Retrieval", () => {
		it("should get most recent state for modal type", async () => {
			const mockFile1 = {
				path: ".metadata/recovery/description-1000.json",
				name: "description-1000.json",
			} as TFile;

			const mockFile2 = {
				path: ".metadata/recovery/description-2000.json",
				name: "description-2000.json",
			} as TFile;

			const oldState: ModalState = {
				modalType: "description",
				content: "old content",
				timestamp: 1000,
			};

			const newState: ModalState = {
				modalType: "description",
				content: "new content",
				timestamp: 2000,
			};

			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue({});
			(mockVault.getMarkdownFiles as jest.Mock).mockReturnValue([mockFile1, mockFile2]);
			(mockVault.read as jest.Mock<any>)
				.mockResolvedValueOnce(JSON.stringify(oldState))
				.mockResolvedValueOnce(JSON.stringify(newState));

			const mostRecent = await stateManager.getMostRecentState("description");

			expect(mostRecent).not.toBeNull();
			expect(mostRecent?.timestamp).toBe(2000);
			expect(mostRecent?.content).toBe("new content");
		});

		it("should return null when no state exists", async () => {
			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);

			const state = await stateManager.getMostRecentState("nonexistent");

			expect(state).toBeNull();
		});
	});

	describe("Recovery State Restoration", () => {
		it("should restore modal state and clean up recovery file", async () => {
			const mockFile = {
				path: ".metadata/recovery/description-1234567890.json",
				name: "description-1234567890.json",
			} as TFile;

			const savedState: ModalState = {
				modalType: "description",
				entityId: "entity-1",
				content: "Restored content",
				timestamp: Date.now(),
			};

			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue({});
			(mockVault.getMarkdownFiles as jest.Mock)
				.mockReturnValueOnce([mockFile]) // First call for loadSavedStates
				.mockReturnValueOnce([mockFile]); // Second call for clearRecoveryState
			(mockVault.read as jest.Mock<any>).mockResolvedValue(JSON.stringify(savedState));

			const restoreCallback = jest.fn().mockImplementation(() => Promise.resolve()) as unknown as (state: ModalState) => Promise<void>;

			const restored = await stateManager.restoreModalState("description", restoreCallback);

			expect(restored).toBe(true);
			expect(restoreCallback).toHaveBeenCalledWith(expect.objectContaining({
				entityId: "entity-1",
			}));
			expect(mockVault.delete).toHaveBeenCalledWith(mockFile);
		});

		it("should not restore state older than 24 hours", async () => {
			const mockFile = {
				path: ".metadata/recovery/description-old.json",
				name: "description-old.json",
			} as TFile;

			const oldState: ModalState = {
				modalType: "description",
				content: "Old content",
				timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
			};

			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue({});
			(mockVault.getMarkdownFiles as jest.Mock)
				.mockReturnValueOnce([mockFile]) // First call for loadSavedStates
				.mockReturnValueOnce([mockFile]); // Second call for clearRecoveryState
			(mockVault.read as jest.Mock<any>).mockResolvedValue(JSON.stringify(oldState));

			const restoreCallback = jest.fn() as unknown as (state: ModalState) => Promise<void>;

			const restored = await stateManager.restoreModalState("description", restoreCallback);

			expect(restored).toBe(false);
			expect(restoreCallback).not.toHaveBeenCalled();
			expect(mockVault.delete).toHaveBeenCalled(); // Should clean up old state
		});

		it("should handle restore callback errors gracefully", async () => {
			const mockFile = {
				path: ".metadata/recovery/description-fail.json",
				name: "description-fail.json",
			} as TFile;

			const state: ModalState = {
				modalType: "description",
				content: "Content",
				timestamp: Date.now(),
			};

			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue({});
			(mockVault.getMarkdownFiles as jest.Mock).mockReturnValue([mockFile]);
			(mockVault.read as jest.Mock<any>).mockResolvedValue(JSON.stringify(state));

			const restoreCallback = jest.fn().mockImplementation(() => Promise.reject(new Error("Restore failed"))) as unknown as (state: ModalState) => Promise<void>;

			const restored = await stateManager.restoreModalState("description", restoreCallback);

			expect(restored).toBe(false);
			expect(restoreCallback).toHaveBeenCalled();
		});
	});

	describe("Recovery State Clearing", () => {
		it("should clear recovery state for specific modal type", async () => {
			const mockFile = {
				path: ".metadata/recovery/description-123.json",
				name: "description-123.json",
			} as TFile;

			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue({});
			(mockVault.getMarkdownFiles as jest.Mock).mockReturnValue([mockFile]);

			await stateManager.clearRecoveryState("description");

			expect(mockVault.delete).toHaveBeenCalledWith(mockFile);
		});

		it("should clear all recovery states", async () => {
			const mockFile1 = {
				path: ".metadata/recovery/description-123.json",
				name: "description-123.json",
			} as TFile;

			const mockFile2 = {
				path: ".metadata/recovery/keyTerm-456.json",
				name: "keyTerm-456.json",
			} as TFile;

			(mockVault.getAbstractFileByPath as jest.Mock).mockReturnValue({});
			(mockVault.getMarkdownFiles as jest.Mock).mockReturnValue([mockFile1, mockFile2]);

			await stateManager.clearAllRecovery();

			expect(mockVault.delete).toHaveBeenCalledTimes(2);
		});
	});

	describe("Recovery Folder Path", () => {
		it("should return recovery folder path", () => {
			const path = stateManager.getRecoveryFolderPath();

			expect(path).toBe(".metadata/recovery");
		});
	});
});
