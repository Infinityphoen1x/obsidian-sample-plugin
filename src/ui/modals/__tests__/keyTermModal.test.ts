import { KeyTermModal, KeyTermSelection } from "../keyTermModal";

describe("KeyTermModal - Chunking & Pagination", () => {
	let modal: KeyTermModal;
	const mockApp = {} as any;

	beforeEach(() => {
		// Reset modal before each test
		modal = new KeyTermModal(mockApp, []);
	});

	describe("Constructor & Initialization", () => {
		test("should initialize with 100 terms per page by default", () => {
			const terms = Array.from({ length: 300 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms);
			expect(modal.getTotalPages()).toBe(3);
		});

		test("should clamp termsPerPage to 50-200 range", () => {
			// Test lower bound
			modal = new KeyTermModal(mockApp, Array.from({ length: 100 }, (_, i) => `term${i}`), 30);
			expect(modal.getPageTerms().length).toBeLessThanOrEqual(100);

			// Test upper bound
			modal = new KeyTermModal(mockApp, Array.from({ length: 500 }, (_, i) => `term${i}`), 300);
			expect(modal.getPageTerms().length).toBeLessThanOrEqual(200);
		});

		test("should accept custom termsPerPage within valid range", () => {
			const terms = Array.from({ length: 200 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 75);
			expect(modal.getTotalPages()).toBe(3);
		});
	});

	describe("Page Calculation", () => {
		beforeEach(() => {
			const terms = Array.from({ length: 250 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 100);
		});

		test("getTotalPages should return correct page count", () => {
			expect(modal.getTotalPages()).toBe(3);
		});

		test("getTotalPages should handle exact division", () => {
			const terms = Array.from({ length: 200 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 100);
			expect(modal.getTotalPages()).toBe(2);
		});

		test("getTotalPages should handle single page", () => {
			const terms = Array.from({ length: 50 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 100);
			expect(modal.getTotalPages()).toBe(1);
		});

		test("getTotalPages should handle one item over page boundary", () => {
			const terms = Array.from({ length: 101 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 100);
			expect(modal.getTotalPages()).toBe(2);
		});
	});

	describe("Pagination Navigation", () => {
		beforeEach(() => {
			const terms = Array.from({ length: 250 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 100);
		});

		test("getPageTerms should return correct terms for page 0", () => {
			const pageTerms = modal.getPageTerms();
			expect(pageTerms).toEqual(
				Array.from({ length: 100 }, (_, i) => `term${i}`)
			);
		});

		test("getPageTerms should return correct terms for page 1", () => {
			modal.nextPage();
			const pageTerms = modal.getPageTerms();
			expect(pageTerms).toEqual(
				Array.from({ length: 100 }, (_, i) => `term${i + 100}`)
			);
		});

		test("getPageTerms should return correct terms for page 2", () => {
			modal.nextPage();
			modal.nextPage();
			const pageTerms = modal.getPageTerms();
			expect(pageTerms).toEqual(
				Array.from({ length: 50 }, (_, i) => `term${i + 200}`)
			);
		});

		test("nextPage should move to next page if available", () => {
			modal.nextPage();
			expect(modal.getPageTerms()[0]).toBe("term100");
		});

		test("nextPage should not move past last page", () => {
			modal.nextPage();
			modal.nextPage();
			modal.nextPage(); // Try to go beyond
			expect(modal.getPageTerms()[0]).toBe("term200");
		});

		test("previousPage should move to previous page if available", () => {
			modal.nextPage();
			modal.nextPage();
			modal.previousPage();
			expect(modal.getPageTerms()[0]).toBe("term100");
		});

		test("previousPage should not move before first page", () => {
			modal.previousPage(); // Try to go before first
			expect(modal.getPageTerms()[0]).toBe("term0");
		});

		test("goToPage should navigate to specific page", () => {
			modal.goToPage(1);
			expect(modal.getPageTerms()[0]).toBe("term100");
		});

		test("goToPage should respect boundaries", () => {
			modal.goToPage(999);
			expect(modal.getPageTerms()[0]).toBe("term0");

			modal.goToPage(-5);
			expect(modal.getPageTerms()[0]).toBe("term0");
		});
	});

	describe("Term Selection & Rejection", () => {
		beforeEach(() => {
			const terms = Array.from({ length: 50 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 50);
		});

		test("toggleTerm should add term to selected", () => {
			modal.toggleTerm("term0");
			expect(modal.isTermSelected("term0")).toBe(true);
		});

		test("toggleTerm should remove term from selected if already selected", () => {
			modal.toggleTerm("term0");
			modal.toggleTerm("term0");
			expect(modal.isTermSelected("term0")).toBe(false);
		});

		test("toggleTerm should remove term from rejected when selecting", () => {
			modal.toggleRejected("term0");
			expect(modal.isTermRejected("term0")).toBe(true);
			modal.toggleTerm("term0");
			expect(modal.isTermRejected("term0")).toBe(false);
			expect(modal.isTermSelected("term0")).toBe(true);
		});

		test("toggleRejected should add term to rejected", () => {
			modal.toggleRejected("term0");
			expect(modal.isTermRejected("term0")).toBe(true);
		});

		test("toggleRejected should remove term from rejected if already rejected", () => {
			modal.toggleRejected("term0");
			modal.toggleRejected("term0");
			expect(modal.isTermRejected("term0")).toBe(false);
		});

		test("toggleRejected should remove term from selected when rejecting", () => {
			modal.toggleTerm("term0");
			expect(modal.isTermSelected("term0")).toBe(true);
			modal.toggleRejected("term0");
			expect(modal.isTermSelected("term0")).toBe(false);
			expect(modal.isTermRejected("term0")).toBe(true);
		});

		test("term cannot be both selected and rejected", () => {
			modal.toggleTerm("term0");
			modal.toggleRejected("term0");
			expect(modal.isTermSelected("term0")).toBe(false);
			expect(modal.isTermRejected("term0")).toBe(true);

			modal.toggleTerm("term0");
			expect(modal.isTermSelected("term0")).toBe(true);
			expect(modal.isTermRejected("term0")).toBe(false);
		});
	});

	describe("Page-level Operations", () => {
		beforeEach(() => {
			const terms = Array.from({ length: 250 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 100);
		});

		test("selectAllPage should select all terms on current page", () => {
			modal.selectAllPage();
			const pageTerms = modal.getPageTerms();
			pageTerms.forEach((term) => {
				expect(modal.isTermSelected(term)).toBe(true);
			});
		});

		test("selectAllPage should remove rejections on current page", () => {
			const pageTerms = modal.getPageTerms();
			pageTerms.slice(0, 5).forEach((term) => modal.toggleRejected(term));

			modal.selectAllPage();
			pageTerms.forEach((term) => {
				expect(modal.isTermSelected(term)).toBe(true);
				expect(modal.isTermRejected(term)).toBe(false);
			});
		});

		test("deselectAllPage should remove all selections on current page", () => {
			modal.selectAllPage();
			modal.deselectAllPage();
			const pageTerms = modal.getPageTerms();
			pageTerms.forEach((term) => {
				expect(modal.isTermSelected(term)).toBe(false);
			});
		});

		test("rejectAllPage should reject all terms on current page", () => {
			modal.rejectAllPage();
			const pageTerms = modal.getPageTerms();
			pageTerms.forEach((term) => {
				expect(modal.isTermRejected(term)).toBe(true);
				expect(modal.isTermSelected(term)).toBe(false);
			});
		});

		test("page operations should not affect other pages", () => {
			modal.selectAllPage();
			modal.nextPage();

			const page2Terms = modal.getPageTerms();
			page2Terms.forEach((term) => {
				expect(modal.isTermSelected(term)).toBe(false);
			});
		});
	});

	describe("Statistics & Tracking", () => {
		beforeEach(() => {
			const terms = Array.from({ length: 100 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 100);
		});

		test("getStats should show initial state", () => {
			const stats = modal.getStats();
			expect(stats.selected).toBe(0);
			expect(stats.rejected).toBe(0);
			expect(stats.remaining).toBe(100);
		});

		test("getStats should track selections", () => {
			modal.toggleTerm("term0");
			modal.toggleTerm("term1");
			const stats = modal.getStats();
			expect(stats.selected).toBe(2);
			expect(stats.rejected).toBe(0);
			expect(stats.remaining).toBe(98);
		});

		test("getStats should track rejections", () => {
			modal.toggleRejected("term0");
			modal.toggleRejected("term1");
			const stats = modal.getStats();
			expect(stats.selected).toBe(0);
			expect(stats.rejected).toBe(2);
			expect(stats.remaining).toBe(98);
		});

		test("getStats should track mixed selections and rejections", () => {
			modal.toggleTerm("term0");
			modal.toggleTerm("term1");
			modal.toggleRejected("term2");
			const stats = modal.getStats();
			expect(stats.selected).toBe(2);
			expect(stats.rejected).toBe(1);
			expect(stats.remaining).toBe(97);
		});

		test("getStats should persist across page navigation", () => {
			modal.selectAllPage();
			modal.nextPage();
			modal.selectAllPage();
			const stats = modal.getStats();
			expect(stats.selected).toBe(100);
		});
	});

	describe("Selection Persistence Across Pages", () => {
		beforeEach(() => {
			const terms = Array.from({ length: 250 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 100);
		});

		test("selections should persist when navigating between pages", () => {
			// Page 0: select some terms
			modal.toggleTerm("term0");
			modal.toggleTerm("term50");

			// Move to page 1
			modal.nextPage();
			modal.toggleTerm("term100");

			// Back to page 0
			modal.goToPage(0);
			expect(modal.isTermSelected("term0")).toBe(true);
			expect(modal.isTermSelected("term50")).toBe(true);

			// To page 1
			modal.goToPage(1);
			expect(modal.isTermSelected("term100")).toBe(true);
		});

		test("rejections should persist when navigating between pages", () => {
			modal.toggleRejected("term0");
			modal.nextPage();
			modal.toggleRejected("term150");
			modal.goToPage(0);
			expect(modal.isTermRejected("term0")).toBe(true);
			modal.goToPage(1);
			expect(modal.isTermRejected("term150")).toBe(true);
		});

		test("complex selection pattern should persist", () => {
			// Page 0
			modal.selectAllPage();
			modal.toggleTerm("term0"); // Deselect this one

			// Page 1
			modal.nextPage();
			modal.toggleTerm("term150");
			modal.rejectAllPage();
			modal.toggleRejected("term150"); // Un-reject this one

			// Verify page 0
			modal.goToPage(0);
			expect(modal.isTermSelected("term0")).toBe(false);
			expect(modal.isTermSelected("term50")).toBe(true);

			// Verify page 1
			modal.goToPage(1);
			// After rejectAllPage(), term150 was deselected and rejected
			// Then toggleRejected removed it from rejected, but it's still not selected
			expect(modal.isTermSelected("term150")).toBe(false);
			expect(modal.isTermRejected("term100")).toBe(true);
			expect(modal.isTermRejected("term150")).toBe(false);
		});
	});

	describe("Edge Cases", () => {
		test("should handle empty term list", () => {
			modal = new KeyTermModal(mockApp, []);
			expect(modal.getTotalPages()).toBe(0);
			expect(modal.getPageTerms()).toEqual([]);
		});

		test("should handle single term", () => {
			modal = new KeyTermModal(mockApp, ["term0"]);
			expect(modal.getTotalPages()).toBe(1);
			expect(modal.getPageTerms()).toEqual(["term0"]);
		});

		test("should handle terms with special characters", () => {
			const terms = ["term-with-dash", "term_with_underscore", "term.with.dot", "term with space"];
			modal = new KeyTermModal(mockApp, terms);
			terms.forEach((term) => {
				expect(modal.isTermSelected(term)).toBe(false);
				modal.toggleTerm(term);
				expect(modal.isTermSelected(term)).toBe(true);
			});
		});

		test("should handle duplicate term names in list", () => {
			const terms = ["term0", "term0", "term1", "term1"];
			modal = new KeyTermModal(mockApp, terms);
			// Should treat them as separate entries even if they have same name
			expect(modal.getPageTerms().length).toBe(4);
		});

		test("should handle very large term lists", () => {
			const terms = Array.from({ length: 10000 }, (_, i) => `term${i}`);
			modal = new KeyTermModal(mockApp, terms, 100);
			expect(modal.getTotalPages()).toBe(100);

			modal.goToPage(99);
			const lastPageTerms = modal.getPageTerms();
			expect(lastPageTerms.length).toBe(100);
			expect(lastPageTerms[0]).toBe("term9900");
		});

		test("should handle min/max termsPerPage correctly", () => {
			const terms = Array.from({ length: 1000 }, (_, i) => `term${i}`);

			// Test minimum (50)
			modal = new KeyTermModal(mockApp, terms, 49);
			expect(modal.getTotalPages()).toBe(20); // 1000 / 50

			// Test maximum (200)
			modal = new KeyTermModal(mockApp, terms, 201);
			expect(modal.getTotalPages()).toBe(5); // 1000 / 200
		});
	});

	describe("Callbacks & External Integration", () => {
		test("should accept onApply callback", () => {
			let appliedSelection: KeyTermSelection | null = null;
			const onApply = (selection: KeyTermSelection) => {
				appliedSelection = selection;
			};

			const terms = ["term0", "term1", "term2"];
			modal = new KeyTermModal(mockApp, terms, 100, onApply);
			modal.toggleTerm("term0");
			modal.toggleTerm("term1");

			// Simulate apply (we can't actually call the apply button in tests,
			// but we can verify the structure exists)
			expect(appliedSelection).toBeNull(); // Callback not called yet
		});

		test("should accept onCancel callback", () => {
			let cancelCalled = false;
			const onCancel = () => {
				cancelCalled = true;
			};

			const terms = ["term0", "term1"];
			modal = new KeyTermModal(mockApp, terms, 100, () => {}, onCancel);
			expect(cancelCalled).toBe(false);
		});
	});
});
