# Refactoring Analysis & Mock File Investigation

**Date**: April 6, 2026  
**Total Source Lines**: ~9,500 LOC (excluding tests)  
**Build Artifacts**: main.js, manifest.json, styles.css

## Executive Summary

The plugin is well-organized but has **three areas for improvement**:

1. **main.ts is too large** (412 lines) - violates AGENTS.md guideline to keep it "small and focused"
2. **Large manager files** could benefit from decomposition
3. **Mock files need updates** for production Obsidian usage

---

## 1. FILE SIZE ANALYSIS

### Largest Files by Category

```
CRITICAL (>400 lines):
  ├─ glossaryManager.ts      509 lines  [Manager]
  ├─ main.ts                 412 lines  [Entry point - SHOULD BE < 200]
  └─ timelineManager.ts      423 lines  [Manager]

HIGH (300-400 lines):
  ├─ hubManager.ts           382 lines  [Manager]
  ├─ modalHandlers.ts        358 lines  [Handler orchestration]  
  ├─ metadataReviewModal.ts  336 lines  [UI Modal]
  ├─ subMetadataModal.ts     335 lines  [UI Modal]
  └─ keyTermModal.ts         331 lines  [UI Modal]

MEDIUM (250-300 lines):
  ├─ timelineModal.ts        277 lines  [UI Modal]
  ├─ masterMetadata.ts       304 lines  [Manager]
  ├─ scannerHandlers.ts      301 lines  [Handler orchestration]
  ├─ performanceLogger.ts    309 lines  [Utility]
  ├─ types.ts                269 lines  [Type definitions]
  └─ folderCombobox.ts       269 lines  [UI Component]

Directory Breakdown:
  ├─ core/      272K (metadata managers + scanner)
  ├─ ui/        188K (modals, views, components, handlers)
  ├─ utils/      88K (helpers, validators, parsers)
  ├─ protocol/   40K (file structure, logging)
  └─ root/       28K (main.ts, types.ts, settings.ts)
```

### Size Guideline Violations

Per **AGENTS.md**:
- ✅ Source in `src/` directory ✓
- ❌ Keep main.ts **small** - Currently 412 lines (should be ~100-150)
- ⚠️ Large file splitting - Some managers >400 lines (but acceptable for complex managers)
- ✅ Don't commit build artifacts ✓

---

## 2. MAIN.TS REFACTORING OPPORTUNITY

### Current Structure (412 lines):

```typescript
├─ Plugin class definition & properties (37 lines)
├─ onload() - Manager initialization (90 lines)
│  ├─ Settings loading
│  ├─ Settings tab registration
│  ├─ View registration (×2)
│  ├─ Mobile warning
│  ├─ Protocol folder init
│  ├─ Blacklist manager init
│  ├─ Entity store init
│  ├─ Timeline manager init
│  ├─ Hub manager init
│  ├─ Glossary manager init
│  ├─ Command registration
│  ├─ Context menu registration
│  └─ Main panel auto-open
├─ onunload() - Cleanup (16 lines)
├─ registerCommands() - 9 commands (150+ lines)
├─ registerDescriptionContextMenu() (38 lines)
├─ openMainPanel() (6 lines)
├─ openTimeline() (6 lines)
├─ handleMetadataReviewCommand() (32 lines)
├─ handleSubMetadataCommand() (29 lines)
└─ handleTimelineCommand() (42 lines)
```

### Refactoring Plan

**Extract to separate files:**

```
src/
├─ main.ts                          [~80 lines - lifecycle only]
├─ initialization/
│  ├─ initializeManagers.ts         [Initialize all managers]
│  ├─ initializeViews.ts            [Register views]
│  └─ initializeSettings.ts         [Load settings, register tab]
├─ ui/commands/
│  ├─ mainCommands.ts               [Core plugin commands]
│  ├─ metadataReviewCommand.ts      [Metadata review flow]
│  ├─ subMetadataCommand.ts         [Sub-metadata flow]
│  └─ timelineCommand.ts            [Timeline flow]
└─ ui/contextMenu/
   └─ descriptionContextMenu.ts     [Description editing menu]
```

**Benefit**: main.ts becomes 80 lines focused on plugin lifecycle

---

## 3. LARGE MANAGER DECOMPOSITION OPTIONS

### A. glossaryManager.ts (509 lines)

**Current Structure:**
- Glossary data model (terms, definitions, relationships)
- Persistence (load/save from vault)
- Glossary operations (add, update, delete terms)
- Hierarchy management (parent/child relationships)
- Serialization (toJSON, fromJSON)

**Suggestion**: Generally OK at 509 lines - it's a complex manager.  
**Minor optimization**: Consider extracting glossary types to shared `types/glossary.ts`

### B. timelineManager.ts (423 lines)

**Current Structure:**
- Timeline events & snapshots
- Persistence (load/save)
- Event operations (add, update, sort)
- Snapshot management
- Temporal tagging

**Suggestion**: Break into:
```
Core:
├─ timelineManager.ts      [Core management]
└─ timelineSerializer.ts   [Persist/load logic - ~100 lines]
```

### C. hubManager.ts (382 lines)

**Suggestion**: Break into:
```
├─ hubManager.ts           [Core management]
└─ hubSerializer.ts        [Persist/load logic - ~80 lines]
```

---

## 4. MODAL FILES ANALYSIS

### Modal Size Breakdown

```
metadataReviewModal.ts     336 lines  - Complex modal, may be OK
subMetadataModal.ts        335 lines  - Complex modal, may be OK
keyTermModal.ts            331 lines  - Complex modal, optimized
timelineModal.ts           277 lines  - Medium modal
descriptionModal.ts        205 lines  - Good size
timelineSnapshotModal.ts   171 lines  - Good size
```

**Recommendation**: Modal files 270-336 lines are at the upper acceptable limit for complex Obsidian modals. Monitor but no immediate action needed.

---

## 5. MOCK FILE INVESTIGATION

### Current __mocks__/obsidian.js Issues

✅ **What's Good:**
- Extends HTMLElement with Obsidian methods (empty, createDiv, createEl, addClass, removeClass)
- Basic Mock classes: App, Modal, Setting, Button, TFile, Vault, Plugin, Notice, PluginSettingTab
- Basic requestUrl mock

❌ **What Needs Updates for Production Usage:**

1. **Missing Methods in Modal class:**
   ```javascript
   // Current: Only has constructor, onOpen(), onClose(), close()
   // Missing:
   - titleEl  // Title container
   - contentEl properties (already has this)
   - More complete lifecycle methods
   ```

2. **Setting class incomplete:**
   ```javascript
   // Missing implementations for callbacks in:
   - addButton() - should call callback properly
   - addDropdown() - completely stubbed
   - addText() - completely stubbed
   - addSearch() - completely stubbed
   - Many more Setting methods (addToggle, addTextArea, etc.)
   ```

3. **Plugin class gaps:**
   ```javascript
   // Missing:
   - workspace property with methods
   - registerMarkdownPostProcessor()
   - registerCodeBlockLanguage()
   - registerExtensions()
   - Other registration methods
   ```

4. **Vault class is completely empty:**
   ```javascript
   // Missing ALL Vault methods:
   - read(), readBinary(), modify(), create(), delete()
   - adapter, getFileByPath(), getAbstractFileByPath()
   - getMarkdownFiles(), getAllLoadedFiles()
   - on() for file events
   ```

5. **App class is completely empty:**
   ```javascript
   // Missing:
   - vault (Vault instance)
   - workspace (Workspace instance)
   - metadataCache
   - fileManager
   - Many more app-level APIs
   ```

### Mock File Assessment

**Current Purpose**: Unit test mock
**Problem**: Not suitable for integration tests with actual Obsidian APIs

**Recommendation**: 
- Keep current mock for unit tests ✓
- Create a **second, more complete mock** for integration testing
- Document which mock is for which test type

---

## 6. REFACTORING PRIORITY MATRIX

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| Extract main.ts logic | High - keeps entry point clean | Low - 1-2 hours | **HIGH** |
| Extend mock file for integration tests | Medium - better testing | Medium - 2-3 hours | **MEDIUM** |
| Split timelineManager serialization | Low - minor code org | Low - 30 min | **LOW** |
| Split hubManager serialization | Low - minor code org | Low - 30 min | **LOW** |
| Modal optimization | Low - at acceptable size limit | High - risky | **LOW** |

---

## 7. CONCRETE REFACTORING STEPS

### Phase 1: Main.ts Extraction (1-2 hours)

1. Create `src/initialization/initializeManagers.ts`
2. Create `src/initialization/initializeViews.ts`
3. Create `src/ui/commands/mainCommands.ts`
   - Move Scan Document command
   - Move Open Panel command
   - Move Open Timeline command
   - Move Show Index command
4. Create `src/ui/commands/metadataCommands.ts`
   - Move Metadata Review command
   - Move Sub-Metadata command
5. Create `src/ui/commands/timelineCommand.ts`
6. Create `src/ui/contextMenu/descriptionContextMenu.ts`
7. Simplify main.ts to ~80 lines

### Phase 2: Manager Serialization Split (1 hour)

1. Extract persistence logic from `timelineManager.ts` → `timelineSerializer.ts`
2. Extract persistence logic from `hubManager.ts` → `hubSerializer.ts`

### Phase 3: Enhanced Mock Files (30 min - 1 hour)

1. Enhance __mocks__/obsidian.js with more complete stubs
2. Create tests/integration-mocks/ folder if needed

---

## 8. CODE ORGANIZATION RECOMMENDATIONS

### Follow AGENTS.md Best Practices

✅ **Already Following:**
- Code split across focused modules
- Clear separation: ui/, core/, utils/, protocol/
- Types defined in types.ts
- Settings in settings.ts

⚠️ **Could Improve:**
- Move commands to dedicated folder (src/ui/commands/)
- Move context menus to dedicated folder (src/ui/contextMenu/)
- Extract initialization logic from main.ts

### Suggested Final Structure

```
src/
├─ main.ts                      [80 lines - lifecycle only]
├─ types.ts                     [Type definitions]
├─ settings.ts                  [Settings UI]
├─ initialization/
│  ├─ initializeManagers.ts
│  ├─ initializeViews.ts
│  └─ initializeSettings.ts
├─ core/                        [Business logic]
│  ├─ metadata/
│  ├─ scanner/
│  └─ migrations/
├─ ui/                          [User interface]
│  ├─ commands/                 [NEW - Command implementations]
│  ├─ contextMenu/              [NEW - Context menu handlers]
│  ├─ handlers/
│  ├─ modals/
│  ├─ components/
│  └─ views/
├─ utils/                       [Utilities & helpers]
├─ protocol/                    [File structure & logging]
└─ migrations/

tests/
├─ __mocks__/
│  ├─ obsidian.js              [Unit test mock - enhanced]
│  └─ obsidian.integration.js  [Integration test mock - more complete]
```

---

## 9. MOCK FILE SPECIFIC RECOMMENDATIONS

### Update __mocks__/obsidian.js

**Add to Setting class:**
```javascript
addToggle(callback) { return this; }
addTextArea(callback) { return this; }
addColorPicker(callback) { return this; }
addSelect(callback) { return this; }
addMultiSelect(callback) { return this; }
setDesc(desc) { return this; }
setName(name) { return this; }
addExtraButton(callback) { return this; }
```

**Fix Vault class:**
```javascript
class Vault {
  read(file) { return Promise.resolve(""); }
  readBinary(file) { return Promise.resolve(new ArrayBuffer(0)); }
  modify(file, content) { return Promise.resolve(); }
  create(path, content) { 
    // Mock: return a TFile
    const tf = new TFile();
    tf.path = path;
    tf.name = path.split('/').pop();
    return Promise.resolve(tf);
  }
  delete(file) { return Promise.resolve(); }
  getFileByPath(path) { return null; }
  getAbstractFileByPath(path) { return null; }
  // ... more methods
}
```

**Fix App class:**
```javascript
class App {
  constructor() {
    this.vault = new Vault();
    this.workspace = {
      getActiveFile() { return null; },
      getLeaf(focus) { return null; },
      getRightLeaf(focus) { return null; },
      onLayoutReady(callback) { callback(); },
      on(event, callback) { return () => {}; },
      // ... more methods
    };
  }
}
```

### Document Mock Limitations

Add comments to __mocks__/obsidian.js:
```javascript
/**
 * Manual mock for obsidian module
 * 
 * USAGE:
 * - Unit tests: This mock is sufficient for testing business logic
 * - Integration tests: Use obsidian.integration.js for more complete mocks
 * - Actual Obsidian: This mock is NOT for production - use real Obsidian API
 * 
 * LIMITATIONS:
 * - Vault operations are stubbed (no actual file I/O)
 * - App events are not fully replicated
 * - DOM manipulation works via jsdom
 * - Modal lifecycle is simplified
 */
```

---

## 10. SUMMARY TABLE

| Aspect | Current | Target | Status |
|--------|---------|--------|--------|
| main.ts size | 412 lines | <150 lines | ⚠️ Needs refactor |
| File organization | Good | Excellent | ✓ Minor improvements |
| Build artifacts | Committed? | Not committed | ✓ Check .gitignore |
| Mock completeness | ~30% | 60-80% | 🔴 Needs work |
| Large files (>400) | 3 files | 1-2 files | ⚠️ Monitor |
| Test mock coverage | Unit tests | Unit + integration | 🔴 Needs new mocks |

---

## NEXT STEPS

### Immediate (This Session)
1. Review this analysis
2. Create initialization/ folder structure
3. Extract main.ts logic

### Short-term (Next Session)
1. Extract command implementations
2. Extract context menu implementations
3. Update mock files

### Later
1. Decompose serialization logic from managers
2. Performance profiling
3. Bundle size analysis

---

## FILES TO CREATE/MODIFY

### New Files to Create
- [ ] `src/initialization/initializeManagers.ts`
- [ ] `src/initialization/initializeViews.ts`
- [ ] `src/initialization/initializeSettings.ts`
- [ ] `src/ui/commands/mainCommands.ts`
- [ ] `src/ui/commands/metadataCommands.ts`
- [ ] `src/ui/commands/timelineCommand.ts`
- [ ] `src/ui/contextMenu/descriptionContextMenu.ts`

### Files to Modify
- [ ] `src/main.ts` - Simplify to 80-100 lines
- [ ] `__mocks__/obsidian.js` - Enhance with missing methods
- [ ] `.gitignore` - Verify build artifacts excluded

### Optional
- [ ] `__mocks__/obsidian.integration.js` - More complete mock
- [ ] Update test configuration to use different mocks
