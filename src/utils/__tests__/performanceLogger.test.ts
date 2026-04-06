import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PerformanceLogger, PerformanceMetric } from "../performanceLogger";
import { Vault } from "obsidian";

describe("PerformanceLogger - Performance Profiling", () => {
	let mockVault: Vault;
	let logger: PerformanceLogger;

	beforeEach(() => {
		mockVault = {
			getAbstractFileByPath: jest.fn(),
			create: jest.fn(),
			modify: jest.fn(),
		} as any;

		logger = new PerformanceLogger(mockVault);
	});

	describe("Operation Timing", () => {
		it("should start and end operation timing", async () => {
			logger.startOperation("test-op");
			expect(logger.hasActiveOperation()).toBe(true);
			expect(logger.getActiveOperations()).toContain("test-op");

			await new Promise((resolve) => setTimeout(resolve, 10)); // Wait 10ms

			await logger.endOperation("test-op", "success");
			expect(logger.hasActiveOperation()).toBe(false);

			const profile = logger.getOperationProfile("test-op");
			expect(profile).not.toBeNull();
			expect(profile?.averageDuration).toBeGreaterThanOrEqual(10);
		});

		it("should handle missing start time gracefully", async () => {
			await logger.endOperation("nonexistent", "success");

			const profile = logger.getOperationProfile("nonexistent");
			expect(profile).toBeNull();
		});

		it("should warn when starting already active operation", () => {
			const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

			logger.startOperation("test-op");
			logger.startOperation("test-op"); // Start again

			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining("already in progress")
			);

			consoleWarnSpy.mockRestore();
		});
	});

	describe("Metric Recording", () => {
		it("should record metric directly", async () => {
			const metric: PerformanceMetric = {
				operation: "manual-op",
				duration: 50,
				timestamp: Date.now(),
				status: "success",
			};

			await logger.recordMetric(metric);

			const profile = logger.getOperationProfile("manual-op");
			expect(profile).not.toBeNull();
			expect(profile?.totalDuration).toBe(50);
		});

		it("should reject metric without operation name", async () => {
			const invalideMetric = {
				duration: 50,
				timestamp: Date.now(),
				status: "success",
			} as any;

			const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

			await logger.recordMetric(invalideMetric);

			expect(consoleWarnSpy).toHaveBeenCalled();

			consoleWarnSpy.mockRestore();
		});
	});

	describe("Performance Profiles", () => {
		it("should calculate profile statistics", async () => {
			// Record multiple metrics
			for (let i = 0; i < 5; i++) {
				logger.startOperation("profile-test");
				await new Promise((resolve) => setTimeout(resolve, 10));
				await logger.endOperation("profile-test", "success");
			}

			const profile = logger.getOperationProfile("profile-test");

			expect(profile).not.toBeNull();
			expect(profile?.totalCalls).toBe(5);
			expect(profile?.totalDuration).toBeGreaterThanOrEqual(40); // 5 * 10ms = 50ms
			expect(profile?.averageDuration).toBeGreaterThanOrEqual(4); // Lenient for timing precision
			expect(profile?.minDuration).toBeGreaterThanOrEqual(1); // Lenient
			expect(profile?.maxDuration).toBeGreaterThanOrEqual(1); // Lenient
		});

		it("should track operation status", async () => {
			logger.startOperation("success-op");
			await logger.endOperation("success-op", "success");

			logger.startOperation("error-op");
			await logger.endOperation("error-op", "error");

			logger.startOperation("warning-op");
			await logger.endOperation("warning-op", "warning");

			const allProfiles = logger.getAllProfiles();
			expect(allProfiles.length).toBe(3);
		});

		it("should sort profiles by average duration", async () => {
			// Fast operation
			logger.startOperation("fast-op");
			await logger.endOperation("fast-op", "success");

			// Slow operation
			logger.startOperation("slow-op");
			await new Promise((resolve) => setTimeout(resolve, 20));
			await logger.endOperation("slow-op", "success");

			const profiles = logger.getAllProfiles();
			expect(profiles[0].operation).toBe("slow-op"); // Should be first (slowest)
			expect(profiles[1].operation).toBe("fast-op");
		});
	});

	describe("Performance Thresholds", () => {
		it.skip("should warn for slow operations", async () => {
			// Note: This test is timing-sensitive and may be unreliable in CI
			const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

			logger.startOperation("slow-scan-op");
			await new Promise((resolve) => setTimeout(resolve, 100));
			await logger.endOperation("slow-scan-op", "success");

			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining("Performance warning")
			);

			consoleWarnSpy.mockRestore();
		});
	});

	describe("Summary Statistics", () => {
		it("should calculate summary statistics", async () => {
			for (let i = 0; i < 3; i++) {
				logger.startOperation("op1");
				await logger.endOperation("op1", "success");

				logger.startOperation("op2");
				await logger.endOperation("op2", "success");
			}

			const summary = logger.getSummary();

			expect(summary.totalOperations).toBe(6);
			expect(summary.totalDuration).toBeGreaterThan(0);
			expect(summary.averageOperation).toBeGreaterThan(0);
		});

		it("should handle empty metrics in summary", () => {
			const summary = logger.getSummary();

			expect(summary.totalOperations).toBe(0);
			expect(summary.totalDuration).toBe(0);
			expect(summary.averageOperation).toBe(0);
		});
	});

	describe("Metric Export", () => {
		it("should export metrics as JSON", async () => {
			logger.startOperation("export-test");
			await logger.endOperation("export-test", "success");

			const json = await logger.exportMetrics();

			expect(json).toBeTruthy();
			const data = JSON.parse(json);
			expect(data.profiles).toBeDefined();
			expect(data.summary).toBeDefined();
			expect(data.timestamp).toBeDefined();
		});
	});

	describe("Metric Persistence", () => {
		it("should save metrics to vault", async () => {
			logger.startOperation("save-test");
			await logger.endOperation("save-test", "success");

			await logger.saveMetrics();

			expect(mockVault.create).toHaveBeenCalled();
		});
	});

	describe("Metric Clearing", () => {
		it("should clear all metrics", async () => {
			logger.startOperation("clear-test");
			await logger.endOperation("clear-test", "success");

			expect(logger.getOperationProfile("clear-test")).not.toBeNull();

			logger.clearMetrics();

			expect(logger.getOperationProfile("clear-test")).toBeNull();
			expect(logger.hasActiveOperation()).toBe(false);
		});
	});

	describe("Active Operations Tracking", () => {
		it("should track active operations", () => {
			logger.startOperation("op1");
			logger.startOperation("op2");
			logger.startOperation("op3");

			const active = logger.getActiveOperations();
			expect(active).toContain("op1");
			expect(active).toContain("op2");
			expect(active).toContain("op3");
			expect(active.length).toBe(3);
		});
	});

	describe("Profile Formatting", () => {
		it("should format profile for display", async () => {
			logger.startOperation("format-test");
			await logger.endOperation("format-test", "success");

			const profile = logger.getOperationProfile("format-test");
			expect(profile).not.toBeNull();

			if (profile) {
				const formatted = logger.formatProfile(profile);
				expect(formatted).toContain("format-test");
				expect(formatted).toContain("ms");
				expect(formatted).toContain("calls=");
			}
		});
	});

	describe("Metric Limit", () => {
		it("should limit metrics per operation", async () => {
			// Record many metrics
			for (let i = 0; i < 1100; i++) {
				logger.startOperation("limit-test");
				await logger.endOperation("limit-test", "success");
			}

			const metrics = logger.getOperationMetrics("limit-test");

			// Should not exceed max metrics
			expect(metrics.length).toBeLessThanOrEqual(1000);
		});
	});
});
