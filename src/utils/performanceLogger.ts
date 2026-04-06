import { Vault } from "obsidian";

/**
 * Performance metric record
 */
export interface PerformanceMetric {
	operation: string;
	duration: number; // milliseconds
	timestamp: number;
	metadata?: Record<string, any>;
	status: "success" | "error" | "warning";
}

/**
 * Performance profile summary
 */
export interface PerformanceProfile {
	operation: string;
	totalCalls: number;
	totalDuration: number;
	averageDuration: number;
	minDuration: number;
	maxDuration: number;
	lastRun: number;
}

/**
 * Manages performance profiling and metrics collection
 */
export class PerformanceLogger {
	private vault: Vault;
	private metrics: Map<string, PerformanceMetric[]> = new Map();
	private currentOperations: Map<string, number> = new Map(); // operation -> startTime
	private readonly maxMetricsPerOperation = 1000; // Limit in-memory metrics
	private readonly metricsFilePath = ".metadata/performance.json";

	constructor(vault: Vault) {
		this.vault = vault;
	}

	/**
	 * Start timing an operation
	 */
	startOperation(operationName: string): void {
		try {
			if (this.currentOperations.has(operationName)) {
				console.warn(`Operation ${operationName} already in progress`);
				return;
			}
			this.currentOperations.set(operationName, performance.now());
		} catch (error) {
			console.debug("Error starting operation timing:", error);
		}
	}

	/**
	 * End timing an operation and record metric
	 */
	async endOperation(
		operationName: string,
		status: "success" | "error" | "warning" = "success",
		metadata?: Record<string, any>
	): Promise<void> {
		try {
			const startTime = this.currentOperations.get(operationName);
			if (!startTime) {
				console.debug(
					`No start time found for operation: ${operationName}`
				);
				return;
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			const metric: PerformanceMetric = {
				operation: operationName,
				duration,
				timestamp: Date.now(),
				metadata,
				status,
			};

			// Store metric
			if (!this.metrics.has(operationName)) {
				this.metrics.set(operationName, []);
			}

			const metrics = this.metrics.get(operationName)!;
			metrics.push(metric);

			// Keep memory usage reasonable
			if (metrics.length > this.maxMetricsPerOperation) {
				metrics.shift(); // Remove oldest metric
			}

			// Log performance warnings for slow operations
			if (duration > this.getPerformanceThreshold(operationName)) {
				console.warn(
					`Performance warning: ${operationName} took ${duration.toFixed(2)}ms`
				);
			}

			this.currentOperations.delete(operationName);
		} catch (error) {
			console.debug("Error ending operation timing:", error);
		}
	}

	/**
	 * Get performance threshold for operation (in ms)
	 */
	private getPerformanceThreshold(operationName: string): number {
		// Define thresholds for different operation types
		if (operationName.includes("scan")) return 5000; // Scanning should complete in 5s
		if (operationName.includes("hub")) return 1000; // Hub operations in 1s
		if (operationName.includes("glossary")) return 100; // Glossary ops in 100ms
		if (operationName.includes("timeline")) return 500; // Timeline ops in 500ms
		if (operationName.includes("persist")) return 2000; // File ops in 2s
		return 1000; // Default 1s threshold
	}

	/**
	 * Record a metric directly (for manual timing)
	 */
	async recordMetric(metric: PerformanceMetric): Promise<void> {
		try {
			if (!metric.operation) {
				console.warn("Cannot record metric without operation name");
				return;
			}

			if (!this.metrics.has(metric.operation)) {
				this.metrics.set(metric.operation, []);
			}

			const metrics = this.metrics.get(metric.operation)!;
			metrics.push(metric);

			if (metrics.length > this.maxMetricsPerOperation) {
				metrics.shift();
			}
		} catch (error) {
			console.debug("Error recording metric:", error);
		}
	}

	/**
	 * Get profile for operation
	 */
	getOperationProfile(operationName: string): PerformanceProfile | null {
		try {
			const metrics = this.metrics.get(operationName);
			if (!metrics || metrics.length === 0) {
				return null;
			}

			const durations = metrics.map((m) => m.duration);
			const totalDuration = durations.reduce((a, b) => a + b, 0);
			const averageDuration = totalDuration / durations.length;
			const lastMetric = metrics[metrics.length - 1];

			if (!lastMetric) {
				return null;
			}

			return {
				operation: operationName,
				totalCalls: metrics.length,
				totalDuration,
				averageDuration,
				minDuration: Math.min(...durations),
				maxDuration: Math.max(...durations),
				lastRun: lastMetric.timestamp,
			};
		} catch (error) {
			console.debug("Error getting operation profile:", error);
			return null;
		}
	}

	/**
	 * Get all performance profiles
	 */
	getAllProfiles(): PerformanceProfile[] {
		const profiles: PerformanceProfile[] = [];

		for (const operation of this.metrics.keys()) {
			const profile = this.getOperationProfile(operation);
			if (profile) {
				profiles.push(profile);
			}
		}

		// Sort by average duration descending (slowest first)
		profiles.sort((a, b) => b.averageDuration - a.averageDuration);

		return profiles;
	}

	/**
	 * Get summary statistics
	 */
	getSummary(): { totalOperations: number; totalDuration: number; averageOperation: number } {
		let totalOperations = 0;
		let totalDuration = 0;

		for (const metrics of this.metrics.values()) {
			totalOperations += metrics.length;
			totalDuration += metrics.reduce((sum, m) => sum + m.duration, 0);
		}

		return {
			totalOperations,
			totalDuration,
			averageOperation: totalOperations > 0 ? totalDuration / totalOperations : 0,
		};
	}

	/**
	 * Export metrics as JSON for analysis
	 */
	async exportMetrics(): Promise<string> {
		try {
			const data = {
				timestamp: Date.now(),
				profiles: this.getAllProfiles(),
				summary: this.getSummary(),
			};

			return JSON.stringify(data, null, 2);
		} catch (error) {
			console.error("Error exporting metrics:", error);
			return "";
		}
	}

	/**
	 * Save metrics to vault
	 */
	async saveMetrics(): Promise<void> {
		try {
			const metricsJSON = await this.exportMetrics();

			if (!metricsJSON) {
				console.warn("No metrics to save");
				return;
			}

			const existingFile = this.vault.getAbstractFileByPath(this.metricsFilePath);
			if (existingFile && existingFile.name.endsWith(".json")) {
				await this.vault.modify(existingFile as any, metricsJSON);
			} else {
				await this.vault.create(this.metricsFilePath, metricsJSON);
			}

			console.log("Performance metrics saved");
		} catch (error) {
			console.warn("Error saving metrics:", error);
		}
	}

	/**
	 * Clear all metrics
	 */
	clearMetrics(): void {
		try {
			this.metrics.clear();
			this.currentOperations.clear();
			console.log("Performance metrics cleared");
		} catch (error) {
			console.debug("Error clearing metrics:", error);
		}
	}

	/**
	 * Get metrics for specific operation
	 */
	getOperationMetrics(operationName: string): PerformanceMetric[] {
		return this.metrics.get(operationName) || [];
	}

	/**
	 * Check if any operation is currently timing
	 */
	hasActiveOperation(): boolean {
		return this.currentOperations.size > 0;
	}

	/**
	 * Get list of active operations
	 */
	getActiveOperations(): string[] {
		return Array.from(this.currentOperations.keys());
	}

	/**
	 * Format profile for display
	 */
	formatProfile(profile: PerformanceProfile): string {
		return (
			`${profile.operation}: ` +
			`avg=${profile.averageDuration.toFixed(2)}ms, ` +
			`min=${profile.minDuration.toFixed(2)}ms, ` +
			`max=${profile.maxDuration.toFixed(2)}ms, ` +
			`calls=${profile.totalCalls}`
		);
	}
}
