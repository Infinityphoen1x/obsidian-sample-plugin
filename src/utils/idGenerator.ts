/**
 * Entity ID generation and allocation
 *
 * Generates deterministic, collision-free IDs for entities.
 * Format: ent_[6-char hash]_[4-digit sequence]
 * Example: ent_abc123_0001
 */

/**
 * Generate a deterministic hash from a term (case-insensitive)
 * @param term The term to hash
 * @returns 6-character hash string
 */
export function hashTerm(term: string): string {
	const normalized = term.toLowerCase();
	// Simple hash function: convert to charCodes, sum, mod, to hex
	let hash = 0;
	for (let i = 0; i < normalized.length; i++) {
		hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
		hash = hash & hash; // Convert to 32bit integer
	}
	// Convert to 6-character hex string
	return Math.abs(hash).toString(16).slice(0, 6).padEnd(6, "0");
}

/**
 * Generate a deterministic entity ID
 * @param term The entity term name
 * @param timestamp Optional timestamp (defaults to Date.now())
 * @returns Entity ID string in format ent_hash_seq
 */
export function generateEntityId(term: string, timestamp?: number): string {
	const ts = timestamp ?? Date.now();
	const hash = hashTerm(term);
	const seq = String(ts % 10000).padStart(4, "0");
	return `ent_${hash}_${seq}`;
}
