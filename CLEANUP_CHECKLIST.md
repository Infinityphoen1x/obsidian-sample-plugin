# Dead Code Cleanup Checklist

## SAFE TO DELETE (TIER 1)

### Files to Delete Entirely (SAFE - Never Imported)

#### 1. ❌ DELETE: `src/utils/helpers.ts`
**Reason**: All 5 functions are unused and never imported  
**Functions**:
- `formatDate()` - Unused date formatter
- `formatTimestamp()` - Unused timestamp formatter
- `sanitizeFilename()` - Unused filename sanitizer
- `deepClone()` - Unused utility
- `capitalize()` - Unused case utility

**Verification**: 
```bash
grep -r "formatDate\|formatTimestamp\|sanitizeFilename\|deepClone\|capitalize" src/
# Result: 0 matches (they're only in helpers.ts)
```

**After deletion impact**: ZERO (nothing imports this file)  
**Action**: Use `rm src/utils/helpers.ts`

---

#### 2. ❌ DELETE: `src/utils/validators.ts`
**Reason**: All 4 functions are unused and never imported  
**Functions**:
- `validateEntity()` - Unused entity validator
- `validateSettings()` - Unused settings validator
- `isValidFolderPath()` - Unused path validator
- `isValidMarkdownFilename()` - Unused filename validator

**Verification**:
```bash
grep -r "validateEntity\|validateSettings\|isValidFolderPath\|isValidMarkdownFilename" src/
# Result: 0 matches (only in validators.ts)
```

**After deletion impact**: ZERO (nothing imports this file)  
**Action**: Use `rm src/utils/validators.ts`

---

### Functions to Delete from Existing Files

#### 3. 🔴 FROM: `src/utils/idGenerator.ts` (Delete 3 functions)
**Keep**: `generateEntityId()` - actively used  
**Delete**:
- Line 44: `isValidEntityId()` - Unused validator
- Line 53: `getHashFromId()` - Unused parser
- Line 63: `getSeqFromId()` - Unused parser

**Verification**: No imports of these 3 functions anywhere

**Action**: Edit file, remove functions 44-75 (3 functions)

---

#### 4. 🔴 FROM: `src/core/metadata/indexFile.ts` (Delete 1 function)
**Find and Delete**: `findEntityByName()` function  
**Reason**: Never called anywhere in codebase

**Action**: Search for function definition, delete it

---

#### 5. 🔴 FROM: `src/core/scanner/documentScanner.ts` (Delete 1 function)
**Find and Delete**: `prependFrontmatter()` function (usually around line 120)  
**Reason**: Test-only, not used in production code

**Keep**: `generateFrontmatter()` and `scanMarkdown()` - actively used

**Action**: Delete just this function definition

---

#### 6. 🔴 FROM: `src/utils/performanceLogger.ts` (Delete 1 class)
**Fix**: Remove `PerformanceLogger` class instantiation code  
**Keep**: File structure (might be useful)  
**Reason**: Class never instantiated; metrics not collected

**Action**: Delete class definition, could delete entire file if desired

---

### ERROR HANDLING MODULE DECISION REQUIRED

#### DECISION POINT: `src/utils/errorHandler.ts`
**Functions in this file**:
- `safeOperation()` - Line 18
- `safeSyncOperation()` - Line 47
- `retryOperation()` - Line 109
- `validateData()` - Line 74
- `safeJSONParse()` - Line 90

**Current Status**: None of these are used anywhere

**Options**:

**Option A: DELETE ENTIRE MODULE** ✅ RECOMMENDED
```bash
rm src/utils/errorHandler.ts
```
- Saves ~150 LOC
- No impact (nothing imports it)
- Cleaner codebase
- If needed later, can be rewritten

**Option B: INTEGRATE THROUGHOUT**
- Every async operation would wrap with `safeOperation()`
- Would require changes to ~30+ files
- Provides consistent error handling
- More effort but larger benefit
- Recommended for future refactoring

**Current Recommendation**: Go with **Option A** (DELETE)

---

## WIKILINKER MODULE (KEEP FOR NOW)

#### ⚠️ DO NOT DELETE: `src/utils/wikilinker.ts`
**Functions**:
- `injectWikilinks()` - Not yet called (glossary feature)
- `isTermWikilinked()` - Support function
- `countTermOccurrences()` - Support function
- `countWikilinkedOccurrences()` - Support function
- `removeWikilinks()` - Support function
- `replaceWikilinkedTerm()` - Support function

**Reason**: These are designed for glossary features (TIER 3 future work)

**Action**: Keep file; add code comment flagging as "Planned for Q2 glossary expansion"

**Future**: When glossary features are implemented, `injectWikilinks()` will be called from `metadataReview` workflow

---

## VERIFICATION CHECKLIST

After making all deletions, run:

```bash
# 1. Verify build still works
npm run build

# 2. Check for references to deleted functions
grep -r "formatDate\|sanitizeFilename\|validateEntity\|isValidEntityId" src/
# Should return: 0 matches

# 3. Verify TypeScript errors
npm run build 2>&1 | grep "error TS"
# Should return: 0 errors

# 4. Verify main.js still generates
ls -lh main.js
# Should be ~580KB
```

---

## DELETE ORDER (Recommended Sequence)

Execute deletions in this order to minimize risk:

### Step 1: Delete Orphaned Files (Safest)
```bash
rm src/utils/helpers.ts
rm src/utils/validators.ts
```
✓ Nothing imports these files  
✓ Rebuild immediately to verify

### Step 2: Delete Functions from Shared Modules
```bash
# Edit src/utils/idGenerator.ts
#   - Delete isValidEntityId() 
#   - Delete getHashFromId()
#   - Delete getSeqFromId()
# Keep: generateEntityId() still in use

# Edit src/utils/performanceLogger.ts
#   - Delete PerformanceLogger class
#   - Check if any imports exist first
```
✓ Rebuild to verify

### Step 3: Delete Functions from Core Modules
```bash
# Edit src/core/metadata/indexFile.ts
#   - Delete findEntityByName()

# Edit src/core/scanner/documentScanner.ts
#   - Delete prependFrontmatter() function
#   - Keep generateFrontmatter() and scanMarkdown()
```
✓ Rebuild to verify

### Step 4: Make Error Handling Decision
```bash
# Option A: Delete file
rm src/utils/errorHandler.ts

# OR Option B: Keep and flag
# (Edit file to add: // TODO: Integrate error handling in TIER 3 refactor)
```
✓ Final rebuild

---

## EXPECTED RESULTS

**Before Cleanup**:
- main.js: 583KB
- TypeScript errors: 0
- Dead code items: 33
- Unused imports: 0 (already fixed)

**After Cleanup**:
- main.js: ~575KB (8KB reduction)
- TypeScript errors: 0
- Dead code items: 0-3 (depends on Option A vs B)
- Files deleted: 2-3
- Functions deleted: 12-17
- Lines removed: 300-400 LOC

**Benefit**: Cleaner codebase, easier to maintain

---

## SAFETY NOTES

⚠️ **Before each deletion**:
1. Verify file is not imported anywhere (`grep -r "import.*from.*filename"`)
2. Verify function is not called anywhere (`grep -r "functionName("`)
3. Run `npm run build` after each deletion
4. Check build succeeded (no TypeScript errors)

✅ **Safe to proceed** if:
- No grep matches found
- Build succeeds with 0 errors
- main.js generates successfully

---

## Files Marked for Future Integration

### `src/utils/wikilinker.ts` (Keep, Not Dead)
- **Status**: Designed for glossary features
- **Future use**: TIER 3 implementation
- **Action**: Add comment noting planned Q2 use

### `src/core/metadata/hubManager.ts` (Keep, Partially Used)
- **Status**: Detection logic complete, not called in scan
- **Fix needed**: Call `detectCoOccurrences()` in scannerHandlers.ts:160
- **Action**: TIER 2 integration (4-6 hours of work)

### `src/core/metadata/glossaryManager.ts` (Keep, Partially Used)
- **Status**: Manager created, never called
- **Fix needed**: Call `buildTree()` after metadata review
- **Action**: TIER 2 integration (1-2 hours of work)

---

## IMPLEMENTATION GUIDE

To execute this cleanup:

1. **Read this file completely** (you are here)
2. **Follow DELETE ORDER above** (Section: "DELETE ORDER")
3. **After each step, run**:
   ```bash
   npm run build 2>&1 | tail -10
   echo "Exit code: $?"
   ```
4. **If error occurs**, stop and investigate (no cascading failures expected)
5. **Update COMPREHENSIVE_ANALYSIS.md** when complete

---

## Questions Before Starting?

**Q: Will this break the plugin?**  
A: No. No active code depends on these deletions.

**Q: Can I undo this?**  
A: Yes, use `git restore <file>` to undo any file deletion.

**Q: What if I miss a reference?**  
A: Build will fail with clear error. Easy to revert and find the reference.

**Q: Should I delete errorHandler.ts?**  
A: Recommended YES (cleaner), but decision is yours. See DECISION POINT section.

Ready to proceed? Start with Step 1 above.
