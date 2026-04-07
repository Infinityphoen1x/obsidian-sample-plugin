/**
 * Blacklist Manager
 *
 * Manages a persistent blacklist of words to exclude from key term suggestions.
 * Blacklisted words are stored in `.metadata/blacklist.txt` for vault-wide exclusion.
 */

import { Vault, TFile } from "obsidian";

export interface BlacklistStats {
	total: number;
	addedToday: number;
	lastUpdated: string;
}

export class BlacklistManager {
	private vault: Vault;
	private protocolFolderName: string;
	private blacklistFilename = "blacklist.txt";
	private blacklist: Set<string> = new Set();
	private lastUpdated: number = 0;

	constructor(vault: Vault, protocolFolderName: string = ".metadata") {
		this.vault = vault;
		this.protocolFolderName = protocolFolderName;
	}

	/**
	 * Load blacklist from file
	 */
	async loadBlacklist(): Promise<void> {
		try {
			const blacklistPath = `${this.protocolFolderName}/${this.blacklistFilename}`;
			const blacklistFile = this.vault.getFileByPath(blacklistPath);

			if (!blacklistFile || !(blacklistFile instanceof TFile)) {
				console.debug("Blacklist file not found, creating empty blacklist");
				this.blacklist.clear();
				return;
			}

			const content = await this.vault.read(blacklistFile);
			this.blacklist.clear();

			// Parse blacklist: one word per line, ignore comments and empty lines
			content.split("\n").forEach((line) => {
				const trimmed = line.trim();
				if (trimmed && !trimmed.startsWith("#")) {
					this.blacklist.add(trimmed.toLowerCase());
				}
			});

			this.lastUpdated = Date.now();
			console.debug(`Loaded ${this.blacklist.size} blacklisted words`);
		} catch (error) {
			console.error("Error loading blacklist:", error);
			this.blacklist.clear();
		}
	}

	/**
	 * Add words to blacklist and persist
	 * @param words Array of words to blacklist
	 */
	async addToBlacklist(words: string[]): Promise<void> {
		if (!words || words.length === 0) return;

		try {
			const normalizedWords = words.map((w) => w.toLowerCase().trim()).filter((w) => w);

			// Add to set
			normalizedWords.forEach((word) => this.blacklist.add(word));

			// Persist to file
			await this.persistBlacklist();
			console.debug(`Added ${normalizedWords.length} words to blacklist`);
		} catch (error) {
			console.error("Error adding to blacklist:", error);
		}
	}

	/**
	 * Remove words from blacklist and persist
	 * @param words Array of words to remove
	 */
	async removeFromBlacklist(words: string[]): Promise<void> {
		if (!words || words.length === 0) return;

		try {
			const normalizedWords = words.map((w) => w.toLowerCase().trim());
			normalizedWords.forEach((word) => this.blacklist.delete(word));
			await this.persistBlacklist();
			console.debug(`Removed ${normalizedWords.length} words from blacklist`);
		} catch (error) {
			console.error("Error removing from blacklist:", error);
		}
	}

	/**
	 * Check if a word is blacklisted
	 * @param word The word to check
	 */
	isBlacklisted(word: string): boolean {
		return this.blacklist.has(word.toLowerCase());
	}

	/**
	 * Get all blacklisted words
	 */
	getBlacklistedWords(): string[] {
		return Array.from(this.blacklist).sort();
	}

	/**
	 * Get blacklist statistics
	 */
	getStats(): BlacklistStats {
		return {
			total: this.blacklist.size,
			addedToday: 0, // TODO: Track per-session additions
			lastUpdated: new Date(this.lastUpdated).toISOString(),
		};
	}

	/**
	 * Persist blacklist to file with formatting
	 */
	private async persistBlacklist(): Promise<void> {
		try {
			const blacklistPath = `${this.protocolFolderName}/${this.blacklistFilename}`;

			// Format with header and timestamp
			const sortedWords = Array.from(this.blacklist).sort();
			const content = `# Blacklisted Words - Do not import as key terms
# Last updated: ${new Date().toISOString()}

${sortedWords.join("\n")}`;

			const existingFile = this.vault.getFileByPath(blacklistPath);
			if (existingFile && existingFile instanceof TFile) {
				await this.vault.modify(existingFile, content);
			} else {
				await this.vault.create(blacklistPath, content);
			}

			this.lastUpdated = Date.now();
		} catch (error) {
			console.error("Error persisting blacklist:", error);
		}
	}

	/**
	 * Clear all blacklisted words
	 */
	async clearBlacklist(): Promise<void> {
		try {
			this.blacklist.clear();
			await this.persistBlacklist();
			console.log("Blacklist cleared");
		} catch (error) {
			console.error("Error clearing blacklist:", error);
		}
	}

	/**
	 * Get blacklist size
	 */
	size(): number {
		return this.blacklist.size;
	}
}
