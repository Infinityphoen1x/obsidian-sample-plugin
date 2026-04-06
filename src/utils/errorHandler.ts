/**
 * Error handling utilities for plugin operations
 * Provides error boundaries and recovery mechanisms
 */

import { Notice } from "obsidian";

export interface ErrorContext {
	operation: string;
	context?: Record<string, any>;
	severity: "error" | "warning" | "info";
}

/**
 * Safe operation wrapper with error boundary
 * Executes operation and handles errors gracefully
 */
export async function safeOperation<T>(
	operation: () => Promise<T>,
	errorContext: ErrorContext,
	showUserNotice: boolean = true
): Promise<T | null> {
	try {
		return await operation();
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const fullMessage = `[${errorContext.operation}] ${errorMessage}`;

		// Log error
		console.error(fullMessage, {
			...errorContext.context,
			originalError: error,
		});

		// Show user notice if critical
		if (showUserNotice && errorContext.severity === "error") {
			new Notice(`❌ ${errorContext.operation} failed. Check console.`, 5000);
		}

		return null;
	}
}

/**
 * Sync operation wrapper with error boundary
 */
export function safeSyncOperation<T>(
	operation: () => T,
	errorContext: ErrorContext,
	showUserNotice: boolean = true
): T | null {
	try {
		return operation();
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const fullMessage = `[${errorContext.operation}] ${errorMessage}`;

		console.error(fullMessage, {
			...errorContext.context,
			originalError: error,
		});

		if (showUserNotice && errorContext.severity === "error") {
			new Notice(`❌ ${errorContext.operation} failed. Check console.`, 5000);
		}

		return null;
	}
}

/**
 * Validate data before processing
 */
export function validateData(
	data: any,
	expectedType: string,
	operationName: string
): boolean {
	if (!data) {
		console.warn(`[${operationName}] Missing data (expected ${expectedType})`);
		return false;
	}

	return true;
}

/**
 * Sanitize and validate JSON
 */
export function safeJSONParse<T>(
	jsonString: string,
	operationName: string,
	fallback: T
): T {
	try {
		return JSON.parse(jsonString) as T;
	} catch (error) {
		console.warn(
			`[${operationName}] Invalid JSON, using fallback`,
			error
		);
		return fallback;
	}
}

/**
 * Retry operation with exponential backoff
 */
export async function retryOperation<T>(
	operation: () => Promise<T>,
	operationName: string,
	maxRetries: number = 3,
	initialDelay: number = 100
): Promise<T | null> {
	let lastError: Error | null = null;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			const delay = initialDelay * Math.pow(2, attempt - 1);

			if (attempt < maxRetries) {
				console.warn(
					`[${operationName}] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms`
				);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	console.error(
		`[${operationName}] Failed after ${maxRetries} attempts`,
		lastError
	);
	return null;
}
