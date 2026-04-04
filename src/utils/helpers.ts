/**
 * General utilities and helpers
 */

/**
 * Format a date to ISO string
 */
export function formatDate(date: Date): string {
	return date.toISOString();
}

/**
 * Format a timestamp to readable string
 */
export function formatTimestamp(timestamp: number): string {
	return new Date(timestamp).toLocaleString();
}

/**
 * Generate a filename-safe string from a term
 */
export function sanitizeFilename(filename: string): string {
	return filename
		.replace(/[^a-zA-Z0-9\-_. ]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}

/**
 * Capitalize first letter of string
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
