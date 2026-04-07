# v1.1 Implementation Plan - Concrete Tasks

**Status:** Ready for development  
**Version Target:** v1.1  
**Based on:** TERMINOLOGY_AUDIT.md findings  
**Timeline:** 4 weeks (2 weeks stabilization + 2 weeks optional features)

---

## TIER 1: Stabilization (Week 1-2) - MUST DO

### Task 1.1: Create Groups.json Storage

**Goal:** Add explicit group storage as single source of truth

**Files to Create:**
- `src/core/metadata/groupStore.ts` - New GroupStore class (200-250 lines)

**Files to Modify:**
- `src/types.ts` - Add GroupStore interface if needed
- `src/main.ts` - Initialize GroupStore in main plugin
- `src/initialization/initializeManagers.ts` - Add GroupStore initialization

**Implementation Outline:**
```typescript
// New file: src/core/metadata/groupStore.ts
interface GroupStoreData {
  version: number;
  lastUpdated: number;
  groups: Group[];
}

class GroupStore {
  private groups: Map<string, Group>;
  private filePath: string;
  
  async load(): Promise<void> { /* Load from groups.json */ }
  async save(): Promise<void> { /* Write to groups.json */ }
  async getAll(): Promise<Group[]> { /* Get all groups */ }
  async getById(id: string): Promise<Group | null> { /* Get one group */ }
  async create(group: Group): Promise<void> { /* Add new group */ }
  async update(id: string, updates: Partial<Group>): Promise<void> { /* Update */ }
  async delete(id: string): Promise<void> { /* Delete with validation */ }
  async validate(): Promise<ValidationResult> { /* Check integrity */ }
}
```

**Testing:**
- Unit tests: CRUD operations
- Migration tests: Auto-generate from existing structure
- Validation tests: Detect orphaned groups

**Effort:** 4-6 hours

---

### Task 1.2: Add Validation Layer

**Goal:** Detect broken references on plugin load

**Files to Create:**
- `src/core/metadata/validator.ts` - New validation utilities (150-200 lines)

**Files to Modify:**
- `src/main.ts` - Add `onload()` validation step

**Implementation Outline:**
```typescript
// New file: src/core/metadata/validator.ts
class MetadataValidator {
  async validateEntityReferences(entityStore: EntityStore, groupStore: GroupStore): Promise<ValidationReport> {
    // Check: Every entity.group exists in groupStore
    // Check: Every entity in groupIndex has valid ID
    // Check: Every child note has valid parent
    // Return: List of issues found
  }
  
  async validateOrphans(vault: Vault, entityStore: EntityStore, groupStore: GroupStore): Promise<OrphanReport> {
    // Find: Child notes without entity
    // Find: Parent notes without group
    // Find: Hub entries without entities
    // Return: List of orphaned files
  }
}
```

**Validation Checks:**
- [ ] Every entity.group references existing group
- [ ] Every group.keyTermIds points to existing entity
- [ ] Every parent note file has corresponding group
- [ ] Every child note file has metadata in entity
- [ ] Every hub entry references existing entities

**Testing:**
- Unit tests: Individual validations
- Integration tests: Full vault validation
- Recovery tests: Fix operations work

**Effort:** 3-4 hours

---

### Task 1.3: Implement Orphan Detection

**Goal:** Find and optionally clean up orphaned references

**Files to Create:**
- `src/protocol/orphanManager.ts` - New orphan handling (150-200 lines)

**Files to Modify:**
- `src/main.ts` - Call orphan detection on load
- `src/ui/views/mainPanelView.ts` - Add "Cleanup Orphans" button

**Implementation Outline:**
```typescript
// New file: src/protocol/orphanManager.ts
interface OrphanReport {
  childNotesOrphaned: TFile[];
  hubEntriesStale: string[];
  groupsWithoutFolder: string[];
}

class OrphanManager {
  async detectOrphans(vault: Vault, entityStore: EntityStore, groupStore: GroupStore): Promise<OrphanReport> {
    // Find orphaned child notes
    // Find stale hub entries
    // Find groups without folders
  }
  
  async cleanupOrphans(report: OrphanReport, vault: Vault): Promise<CleanupResult> {
    // Optionally delete or move orphaned files
    // Log operations
  }
}
```

**UI Enhancement:**
- Add "Cleanup" button to main panel
- Show orphan detection results
- Allow user to confirm/cancel cleanup

**Testing:**
- Unit tests: Detection logic
- Integration tests: With real vault structure
- UI tests: Button functionality

**Effort:** 3-4 hours

---

## TIER 2: Entity Deletion (Week 3-4) - HIGH PRIORITY

### Task 2.1: Implement EntityDeletionManager

**Goal:** Enable safe entity deletion with cascade cleanup

**Files to Create:**
- `src/core/metadata/entityDeletionManager.ts` - New deletion manager (250-300 lines)

**Files to Modify:**
- `src/core/metadata/entityStore.ts` - Add deletion method
- `src/ui/handlers/modalHandlers.ts` - Add delete confirmation modals

**Implementation Outline:**
```typescript
// New file: src/core/metadata/entityDeletionManager.ts
class EntityDeletionManager {
  async canDelete(entityId: string, entityStore: EntityStore): Promise<CanDeleteResult> {
    // Check: Any child notes exist?
    // Check: Referenced in any hub entries?
    // Check: In any active groups?
  }
  
  async deleteEntity(
    entityId: string,
    entityStore: EntityStore,
    groupStore: GroupStore,
    hubManager: HubManager,
    vault: Vault
  ): Promise<DeletionResult> {
    // Delete child notes
    // Remove from parent note entity table
    // Remove from hub entries
    // Remove from entity index
    // Update group counts
  }
}
```

**Cascade Cleanup:**
- ✅ Delete child note files from vault
- ✅ Remove from parent note entity table
- ✅ Remove entity from all groups
- ✅ Clean hub entries with this entity
- ✅ Update counts/indexes

**Testing:**
- Unit tests: Each cascade operation
- Integration tests: Full deletion workflow
- Regression tests: No data corruption

**Effort:** 6-8 hours

---

### Task 2.2: Add Cascade Cleanup Testing

**Goal:** Ensure deletion doesn't leave orphans or corrupt data

**Files to Create:**
- `src/core/metadata/__tests__/entityDeletion.test.ts` - Comprehensive deletion tests

**Test Scenarios:**
- Delete entity with children: All children deleted
- Delete entity in group: Removed from group, not orphaned
- Delete entity in hub: Hub entries cleaned
- Delete entity with multiple groups: Cleaned from all
- Verify no orphans created: Post-deletion validation passes

**Effort:** 3-4 hours

---

## TIER 3: Architecture Improvements (v1.2) - MEDIUM PRIORITY

### Task 3.1: Create GroupManager Service

**Goal:** Centralized group operations coordination

**Files to Create:**
- `src/core/metadata/groupManager.ts` - Service to coordinate group ops (200-250 lines)

**Operations:**
- Create group with validation
- Rename group (updates entities + parent note)
- Delete group with cascade (orphan all entities or delete)
- Move group (rename folder, update parent path)
- Merge groups (combine entities)

**Effort:** 4-5 hours

---

### Task 3.2: Enable Entity Rename

**Goal:** Support renaming entities with bidirectional updates

**Files to Modify:**
- `src/core/metadata/entityStore.ts` - Add rename method
- `src/core/metadata/hubManager.ts` - Update hub entries on rename
- `src/ui/modals/` - Add rename confirmation UI

**Cascade on Rename:**
- ✅ Update entity name
- ✅ Rename child note file
- ✅ Update parent note entity table
- ✅ Update hub entry names
- ✅ Update all wikilinks in documents

**Effort:** 6-8 hours

---

## TIER 4: Polish & Refactoring (v1.2+) - LOW PRIORITY

### Task 4.1: Refactor Remaining Modal Handlers

**Pattern:** Follow DocumentScanHandler approach

**Target Files:**
- MetadataReviewHandler (already started)
- TimelineModalHandler
- DescriptionModalHandler
- SubMetadataHandler

**Effort:** 3-4 hours per handler

---

### Task 4.2: Consolidate Terminology in UI

**Changes:**
- Rename "Key Term Selection" → "Entity Selection" (or keep consistent with spec)
- Clarify "Group" vs "Folder" in modals
- Update UI copy to match data model

**Effort:** 1-2 hours

---

## Implementation Priority by Value

### Week 1 (High Impact):
1. Groups.json storage (fixes root issue)
2. Validation layer (detects problems)
3. Orphan detection (prevents decay)

### Week 2 (Foundation):
4. EntityDeletionManager (enables deletion)
5. Cascade cleanup tests (ensures safety)

### Week 3-4 (Optional):
6. GroupManager service (nice architecture)
7. Entity rename (user feature)
8. Terminal refactoring (polish)

---

## Estimated Timeline

| TIER | Phase | Tasks | Hours | Weeks |
|------|-------|-------|-------|-------|
| 1 | Stabilization | 3 tasks | 10-14 | 1-2 |
| 2 | Deletion | 2 tasks | 9-12 | 1-2 |
| 3 | Architecture | 2 tasks | 10-13 | 1-2 |
| 4 | Polish | 2 tasks | 4-6 | 0-1 |
| **Total** | **v1.1 Complete** | **9 tasks** | **33-45** | **3-7** |

---

## Risk Mitigation

**High-Risk Tasks (2.1, 3.2):**
- [ ] Implement feature branch isolationTT
- [ ] Write extensive tests first (TDD)
- [ ] Code review before merge
- [ ] Staging environment testing

**Moderate-Risk Tasks (1.1, 1.2, 1.3):**
- [ ] Data migration testing
- [ ] Backward compatibility checks
- [ ] User acceptance testing

**Low-Risk Tasks (1.2, 4.x):**
- [ ] Standard code review
- [ ] Unit test coverage

---

## Success Criteria

### v1.0 Stable (Current)
- ✅ Build: 0 TypeScript errors
- ✅ Tests: 514/514 passing (1 skipped)
- ✅ No feature gaps for core workflows

### v1.1 Stabilized (After TIER 1)
- ✅ groups.json created on first load
- ✅ Validation layer detects all broken references
- ✅ Orphan detection prevents data decay
- ✅ No net new features (conservative approach)
- ✅ All tests still passing + new validation tests

### v1.1 Complete (After TIER 2)
- ✅ Entity deletion works safely
- ✅ Cascade cleanup tested extensively
- ✅ No orphans created by any operation
- ✅ User can safely delete/reorganize data

### v1.2 Polish (Optional TIER 3-4)
- ✅ Entity rename fully supported
- ✅ Architecture cleaner (handlers refactored)
- ✅ UX improved (consolidated terminology)

---

## Deployment Path

1. **v1.0.0** (Current) - Feature complete, v1.1 ready in queue
2. **v1.1.0** - After TIER 1 (stabilization only, safe for production)
3. **v1.1.1** - After TIER 2 (deletion feature, slightly higher risk)
4. **v1.2.0** - After TIER 3-4 (full architecture, polish)

---

## Notes for Implementation Team

- Start with TIER 1: Low risk, high value
- GroupStore is the foundation: All other changes depend on it
- Use existing patterns: Follow DocumentScanHandler, EntityStore, etc.
- Test first: Write tests before implementation (especially TIER 2)
- Document changes: Update TERMINOLOGY_AUDIT.md as you go
- Release regularly: v1.1.0 after TIER 1, v1.1.1 after TIER 2

---

## Next Steps

1. ✅ TERMINOLOGY_AUDIT.md updated (DONE)
2. → Create branches for TIER 1 tasks
3. → Implement GroupStore (highest priority)
4. → Add validation layer
5. → Implement orphan detection
6. → Release v1.1.0
7. → Gather user feedback
8. → Plan TIER 2 based on feedback
