import { Vault, TFile } from "obsidian";

/**
 * Represents a saved modal state for recovery
 */
export interface ModalState {
	modalType: "description" | "keyTerm" | "metadataReview" | "subMetadata" | "timeline" | "timelineSnapshot";
	entityId?: string;
	groupName?: string;
	content?: string;
	metadata?: Record<string, any>;
	position?: { x: number; y: number };
	scrollTop?: number;
	timestamp: number;
}

/**
 * Manages modal and application state recovery for crash recovery
 */
export class StateManager {
	private vault: Vault;
	private recoveryFolderName = ".metadata/recovery";

	constructor(vault: Vault) {
		this.vault = vault;
	}

	/**
	 * Save modal state for recovery
	 */
	async saveModalState(state: ModalState): Promise<void> {
		try {
			// Validate input
			if (!state || !state.modalType) {
				console.debug("saveModalState: invalid state");
				return;
			}

			const filename = `${state.modalType}-${Date.now()}.json`;
			const filePath = `${this.recoveryFolderName}/${filename}`;

			// Serialize state
			let content: string;
			try {
				content = JSON.stringify(state, null, 2);
			} catch (stringifyError) {
				console.error("Error serializing modal state:", stringifyError);
				return;
			}

			// Ensure recovery folder exists
			const folderPath = this.recoveryFolderName;
			const folderExists = this.vault.getAbstractFileByPath(folderPath);
			if (!folderExists) {
				try {
					await this.vault.createFolder(folderPath);
				} catch (folderError) {
					// Folder might already exist, continue
					console.debug("Recovery folder may already exist:", folderError);
				}
			}

			// Save state file
			const existingFile = this.vault.getAbstractFileByPath(filePath);
			if (existingFile && existingFile instanceof TFile) {
				await this.vault.modify(existingFile, content);
			} else {
				await this.vault.create(filePath, content);
			}

			console.debug(`Saved state for ${state.modalType}`);
		} catch (error) {
			console.warn("Error saving modal state:", error);
			// Non-critical - don't break workflow
		}
	}

	/**
	 * Load saved modal states for recovery
	 */
	async loadSavedStates(): Promise<ModalState[]> {
		const states: ModalState[] = [];

		try {
			// Check if recovery folder exists
			const folderPath = this.recoveryFolderName;
			const folder = this.vault.getAbstractFileByPath(folderPath);
			if (!folder) {
				console.debug("No recovery folder found");
				return states;
			}

			// List all recovery files
			try {
				const files = this.vault.getMarkdownFiles(); // This gets all files
				for (const file of files) {
					if (file.path.startsWith(folderPath) && file.name.endsWith(".json")) {
						try {
							const content = await this.vault.read(file);

							// Parse JSON safely
							let state: ModalState;
							try {
								state = JSON.parse(content) as ModalState;
							} catch (parseError) {
								console.debug(`Error parsing recovery file ${file.name}:`, parseError);
								continue;
							}

							// Validate state structure
							if (!state.modalType || !state.timestamp) {
								console.debug(`Invalid state structure in ${file.name}`);
								continue;
							}

							states.push(state);
						} catch (readError) {
							console.debug(`Error reading recovery file ${file.name}:`, readError);
							// Continue with next file
						}
					}
				}
			} catch (listError) {
				console.debug("Error listing recovery files:", listError);
			}

			console.log(`Loaded ${states.length} recovery states`);
			return states;
		} catch (error) {
			console.warn("Error loading recovery states:", error);
			return states;
		}
	}

	/**
	 * Clear recovery state for a specific modal type
	 */
	async clearRecoveryState(modalType?: string): Promise<void> {
		try {
			const folderPath = this.recoveryFolderName;
			const folder = this.vault.getAbstractFileByPath(folderPath);
			if (!folder) {
				console.debug("Recovery folder not found");
				return;
			}

			const files = this.vault.getMarkdownFiles();
			for (const file of files) {
				if (file.path.startsWith(folderPath) && file.name.endsWith(".json")) {
					// Filter by modal type if specified
					if (modalType && !file.name.startsWith(modalType)) {
						continue;
					}

					try {
						await this.vault.delete(file);
						console.debug(`Deleted recovery file: ${file.name}`);
					} catch (deleteError) {
						console.warn(`Error deleting recovery file ${file.name}:`, deleteError);
					}
				}
			}
		} catch (error) {
			console.warn("Error clearing recovery state:", error);
		}
	}

	/**
	 * Get the most recent state for a modal type
	 */
	async getMostRecentState(modalType: string): Promise<ModalState | null> {
		try {
			const states = await this.loadSavedStates();

			// Filter and sort by timestamp
			const relevantStates = states
				.filter((s) => s.modalType === modalType)
				.sort((a, b) => b.timestamp - a.timestamp);

			if (relevantStates.length > 0) {
				const state = relevantStates[0]; // Most recent
				return state || null;
			}
		} catch (error) {
			console.debug("Error getting recent state:", error);
		}

		return null;
	}

	/**
	 * Restore a modal with saved state
	 */
	async restoreModalState(
		modalType: string,
		restoreCallback: (state: ModalState) => Promise<void>
	): Promise<boolean> {
		try {
			const state = await this.getMostRecentState(modalType);

			if (!state) {
				console.debug(`No saved state for ${modalType}`);
				return false;
			}

			// Check if state is not too old (within last session)
			const ageMs = Date.now() - state.timestamp;
			const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours
			if (ageMs > maxAgeMs) {
				console.debug(`State for ${modalType} is too old (${ageMs}ms)`);
				await this.clearRecoveryState(modalType);
				return false;
			}

			// Restore state
			try {
				await restoreCallback(state);
				console.log(`Restored ${modalType} modal state`);

				// Clean up recovery file after successful restore
				await this.clearRecoveryState(modalType);
				return true;
			} catch (restoreError) {
				console.warn(`Error restoring modal state:`, restoreError);
				return false;
			}
		} catch (error) {
			console.warn("Error in restoreModalState:", error);
			return false;
		}
	}

	/**
	 * Clear all recovery states (safe cleanup)
	 */
	async clearAllRecovery(): Promise<void> {
		try {
			await this.clearRecoveryState(); // No filter = clear all
			console.log("Recovery states cleared");
		} catch (error) {
			console.warn("Error clearing all recovery:", error);
		}
	}

	/**
	 * Get recovery folder path for advanced use cases
	 */
	getRecoveryFolderPath(): string {
		return this.recoveryFolderName;
	}
}
