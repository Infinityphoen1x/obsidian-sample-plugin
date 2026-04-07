# TIER 2 Integration Fixes (Critical Workflow Completion)

## Overview
These are the fixes needed to complete the core workflows identified in the simulation. They require code changes (not deletions) and have medium complexity but HIGH impact.

**Estimated Total Effort**: 4-6 hours  
**Risk Level**: Medium (well-scoped changes)  
**Impact**: Brings feature completeness from 65% to ~90%

---

## FIX #1: Wire Hub Detection into Scan Workflow

### Current State ❌
- `HubManager.detectCoOccurrences()` exists but is NEVER CALLED
- Hub file never created
- Cross-references never tracked
- Result: Hub feature completely non-functional

### Expected State ✅
- After each document scan, co-occurring terms detected
- Hub file (hub-cross-references.csv) created/updated
- Cross-reference table available for analysis

### Implementation

**File**: `src/core/scanner/scannerHandlers.ts`

**Location**: After wikilink application (around line 160)

**Current Code** (in `handleDocumentScan` function):
```typescript
// Around line 150-160
await generateFrontmatter(/* ... */);
await wikiLinkTemporalTerms(/* ... */);

// Hub detection MISSING HERE
```

**Add This**:
```typescript
// Detect and record entity co-occurrences for hub
if (hubManager) {
    console.debug("Detecting entity co-occurrences for hub...");
    try {
        // sentenceEntities: Map<sentence, Set<entityIds>>
        const sentenceEntities = await extractSentenceEntities(
            modifiedContent,
            entities
        );
        
        await hubManager.detectCoOccurrences(sentenceEntities);
        console.debug("Hub detection complete");
    } catch (error) {
        console.warn("Hub detection error:", error);
        // Non-fatal: don't block document scan
    }
}
```

**Details**:
- `hubManager` parameter already available from function signature
- `sentenceEntities` Map needed: Map from sentence string to Set of entityIds
- `detectCoOccurrences()` method already implemented in HubManager
- Error handling: Non-fatal (logs warning, continues)

**Verification**:
```bash
# After implementing:
npm run build
# Verify: hub-cross-references.csv is created after scanning
```

**Testing**:
1. Scan sampletxt.md
2. Hub file should contain:
   - energy|influence co-occurrence
   - spiritual|energy co-occurrence
   - etc.

---

## FIX #2: Wire Glossary Building into Metadata Review

### Current State ❌
- `GlossaryManager` initialized but NEVER CALLED
- Glossary never built
- Folder structure never created
- Result: Glossary feature completely non-functional

### Expected State ✅
- After metadata review groups created
- Glossary tree built showing parent-child folder structure
- Glossary file (glossary.json) contains all descriptions

### Implementation

**File**: `src/ui/handlers/modalHandlers.ts`

**Function**: `handleMetadataReview()`

**Location**: After parent notes created (around line 200)

**Current Code** (in `handleMetadataReview`):
```typescript
// After: all parent notes created, entities tagged
// Then function returns
```

**Add This Before Return**:
```typescript
// Build glossary from grouped entities
if (entityStore && glossaryManager) {
    console.debug("Building glossary from entity groups...");
    try {
        const allEntities = entityStore.getAllEntities();
        await glossaryManager.buildGlossaryTree(allEntities, groups);
        console.debug("Glossary built successfully");
    } catch (error) {
        console.warn("Glossary building error:", error);
        // Non-fatal: don't block metadata review
    }
}
```

**Details**:
- `glossaryManager` needs to be passed to `handleMetadataReview()` function
- Update function signature to accept glossaryManager parameter
- `groups` variable already available (from MetadataReviewResult)
- `buildGlossaryTree()` method needs implementation in GlossaryManager

**Modification Needed**:
Update `registerMetadataCommands()` in `src/ui/commands/metadataCommands.ts` to pass glossaryManager:
```typescript
await handleMetadataReview(
    plugin.app,
    plugin.app.vault,
    entities,
    settings,
    entityStore,
    timelineManager.glossaryManager  // ADD THIS
);
```

**Verification**:
```bash
npm run build
# Verify: glossary.json created after metadata review
```

---

## FIX #3: Complete Wikilink Key Term Replacement

### Current State ⚠️
- Only temporal terms are wikilinked: ✓
- Selected key terms are NOT wikilinked: ❌
- Result: Key terms selected but not replaced in text

### Expected State ✅
- Every instance of selected key term replaced with `[[term]]`
- Document text updated with wikilinks
- Enables hovering to preview description

### Implementation

**File**: `src/core/scanner/scannerHandlers.ts`

**Function**: `handleDocumentScan()`

**Current Code** (around line 150):
```typescript
// Wikilink temporal terms ONLY
await wikiLinkTemporalTerms(modifiedContent, temporalTerms);

// Key term wikilinks MISSING
```

**Add This**:
```typescript
// Apply wikilinks to selected key terms
console.debug("Applying wikilinks to selected key terms...");
const selectedTermIds = entityStore.getSelectedKeyTermIds();
const selectedTerms = selectedTermIds.map(id => 
    entityStore.getEntityById(id)?.term ?? ""
).filter(Boolean);

modifiedContent = applyWikilinksToKeyTerms(modifiedContent, selectedTerms);
console.debug(`Applied wikilinks to ${selectedTerms.length} key terms`);
```

**New Function Needed** (in `src/utils/wikilinker.ts`):
```typescript
/**
 * Replace all instances of key terms with wikilinks
 * @param content Document content
 * @param terms Array of key terms to wikilink
 * @returns Content with wikilinked terms
 */
export function applyWikilinksToKeyTerms(
    content: string, 
    terms: string[]
): string {
    let result = content;
    
    for (const term of terms) {
        // Case-sensitive replacement
        // Avoid replacing already-wikilinked terms
        const regex = new RegExp(
            `(?<!\\[\\[)\\b${escapeRegex(term)}\\b(?!\\]\\])`,
            'g'
        );
        result = result.replace(regex, `[[${term}]]`);
    }
    
    return result;
}

// Helper
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

**Verification**:
```bash
npm run build
# Verify: Selected terms appear as [[term]] in scanned document
```

**Testing**:
1. Scan document
2. Select "influence" and "energy"
3. Apply
4. Document should have [[influence]] and [[energy]] throughout

---

## FIX #4: Complete Sub-metadata Modal Workflow

### Current State ⚠️
- `SubMetadataModal` class exists
- Child note creation logic partially defined
- Workflow not fully connected
- Result: Sub-metadata feature doesn't work end-to-end

### Expected State ✅
- Open modal on command
- Select entities to create notes for
- Apply creates child notes
- Each child linked to parent

### Implementation

**File**: `src/ui/handlers/modalHandlers.ts`

**Function**: `handleSubMetadata()` (around line 180)

**Required Logic**:
```typescript
export async function handleSubMetadata(
    app: App,
    vault: Vault,
    entities: Entity[],
    parentPath: string,
    sourceFile: string,
    settings: PluginSettings
): Promise<void> {
    const modal = new SubMetadataModal(app, entities);
    
    modal.onClose = async () => {
        if (!modal.submitted) return; // User cancelled
        
        const result: SubMetadataResult = modal.getResult();
        
        // Create child notes
        for (const entityId of result.selectedEntities) {
            const entity = entityStore.getEntityById(entityId);
            if (!entity) continue;
            
            // Create child note file
            const childPath = `${parentPath}/${entity.term}.md`;
            const childContent = generateChildNoteFrontmatter(
                entity,
                sourceFile,
                result.tags
            );
            
            await vault.create(childPath, childContent);
            console.debug(`Created child note: ${childPath}`);
        }
        
        new Notice(`✓ Created ${result.selectedEntities.length} child notes`);
    };
    
    modal.open();
}
```

**Details**:
- Modal should be non-blocking (async/await)
- Child notes created in same folder as parent
- Each includes frontmatter with parent link + description area
- Non-fatal if entity not found

**Verification**:
```bash
npm run build
# Verify: Command works without errors
```

---

## INTEGRATION TESTING PLAN

### Test Scenario: Full Workflow with sampletxt.md

```
1. Open sampletxt.md in Obsidian
2. Run: "Scan document for metadata"
   ✓ Should detect 107 tokens
   ✓ Should show modal with top 50
3. Select: "influence", "energy", "system", "spiritual"
4. Apply
   ✓ Should wikilink all instances (23 replacements)
   ✓ Should create 4 entities
   ✓ Should create hub file ← FIX #1
5. Run: "Review and organize metadata"
   ✓ Should show groups modal
6. Create group: "Core Concepts"
   ✓ Add: influence, energy, spiritual, system
7. Select folder path and confirm
   ✓ Should create parent notes
   ✓ Should build glossary ← FIX #2
8. Run: "Create entity notes"
   ✓ Should create child notes ← FIX #4
9. Verify results:
   ✓ Master metadata updated
   ✓ Hub file contains co-occurrences
   ✓ Glossary tree created
   ✓ Child notes created
```

---

## FIX PRIORITY & EFFORT

| Fix # | Feature | Effort | Complexity | Impact | Priority |
|-------|---------|--------|-----------|--------|----------|
| 1 | Hub Integration | 1-2 hrs | Low | High | 🔴 HIGH |
| 2 | Glossary Building | 1-2 hrs | Low | High | 🔴 HIGH |
| 3 | Wikilink Key Terms | 1-2 hrs | Low | High | 🔴 HIGH |
| 4 | Sub-metadata Complete | 2-3 hrs | Medium | Medium | 🟡 MEDIUM |

**Total**: 5-9 hours (conservative estimate)  
**Recommended Order**: 1 → 2 → 3 → 4

---

## Success Criteria

After all TIER 2 fixes implemented:

✅ Hub file created and populated during scan  
✅ Glossary tree built during metadata review  
✅ Key terms wikilinked in source documents  
✅ Sub-metadata workflow completes end-to-end  
✅ Build succeeds with 0 errors  
✅ All commands functional  

**Expected Result**: Feature completeness increases from 65% → 90%

---

## Rollback Plan

If any fix causes issues:

```bash
# Revert to previous working state
git restore <modified-file>

# Rebuild
npm run build

# Verify
npm run build 2>&1 | grep "error TS"
```

All fixes are isolated (no cascading dependencies), so reverting one doesn't affect others.

---

## Next Steps

1. Execute TIER 1 cleanup (delete dead code)
2. Implement TIER 2 fixes using this guide
3. Test with sampletxt.md
4. Verify all managers working correctly
