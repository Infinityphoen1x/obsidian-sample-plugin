# Action Plan: File Size & Mock File Improvements

## Quick Reference Index

- **REFACTORING_ANALYSIS.md** - Full refactoring analysis with priority matrix
- **MOCK_FILE_ENHANCEMENT.md** - Detailed mock file investigation and enhancement guide
- **This file** - Implementation checklist and quick reference

---

## Executive Findings

| Finding | Severity | Impact | Effort |
|---------|----------|--------|--------|
| main.ts is 412 lines (violates AGENTS.md) | 🔴 HIGH | Code organization | LOW (1-2h) |
| __mocks__/obsidian.js missing 40+ critical methods | 🔴 HIGH | Test reliability | MEDIUM (2-3h) |
| Vault class is empty stub | 🔴 HIGH | File ops fail in tests | MEDIUM (1-2h) |
| App.workspace undefined | 🔴 HIGH | View registration fails | LOW (30m) |
| Large managers (>400 lines) | 🟡 MEDIUM | Code maintainability | MEDIUM (2-3h) |

---

## Quick Wins (Do First - 30 minutes)

### 1. Fix Critical Mock Gaps

Add to `__mocks__/obsidian.js`:

```javascript
// 1. Fix App class (currently empty):
class App {
  constructor() {
    this.vault = new Vault();
    this.workspace = new Workspace();
  }
}

// 2. Add Workspace class:
class Workspace {
  onLayoutReady(callback) {
    setTimeout(() => callback(), 0);
  }
  getLeaf(focus) { return new Leaf(); }
  getRightLeaf(focus) { return new Leaf(); }
  getActiveFile() { return null; }
}

// 3. Add Leaf class:
class Leaf {
  async setViewState(state) { return Promise.resolve(); }
}

// 4. Fix Vault to include adapter and basic operations:
class FileSystemAdapter {
  async write(path, content) { return Promise.resolve(); }
  async read(path) { return Promise.resolve(""); }
}

class Vault {
  constructor() {
    this.adapter = new FileSystemAdapter();
    this.files = new Map();
  }
  
  async read(file) {
    return this.files.get(file.path) || "";
  }
  
  async create(path, content) {
    const file = new TFile();
    file.path = path;
    file.name = path.split('/').pop();
    this.files.set(path, content);
    return Promise.resolve(file);
  }
  
  getFileByPath(path) {
    if (this.files.has(path)) {
      const f = new TFile();
      f.path = path;
      f.name = path.split('/').pop();
      return f;
    }
    return null;
  }
}

// 5. Fix Plugin class:
class Plugin {
  // ... existing methods ...
  
  addSettingTab(tab) { return this; }
  registerView(type, factory) { return this; }
}
```

**Time:** ~20 minutes  
**Files:** `__mocks__/obsidian.js`  
**Impact:** Fixes 80% of mock issues

### 2. Verify All Mock Methods Exported

Ensure end of `__mocks__/obsidian.js`:

```javascript
module.exports = {
  App,
  Modal,
  Setting,
  Button,
  TFile,
  Vault,
  Plugin,
  Notice,
  PluginSettingTab,
  FileSystemAdapter,
  Workspace,
  Leaf,
  requestUrl,
  // Add any missing
};
```

**Time:** ~5 minutes

### 3. Run Tests to Verify

```bash
npm test
```

**Expected:** All 538 tests still passing

---

## Main.ts Refactoring Roadmap

### Current State
- 412 lines
- Main plugin class mixed with command implementations
- Settings, views, managers all initialized inline

### Target State
- ~80 lines (lifecycle only)
- Clear separation of concerns
- Easy to understand at a glance

### Phase 1: Extract Initialization (1 hour)

**Create:** `src/initialization/initializeManagers.ts`

```typescript
import { App, Vault } from "obsidian";
import { PluginSettings } from "../types";
import { BlacklistManager } from "../core/scanner/blacklistManager";
import { EntityStore } from "../core/metadata/entityStore";
import { TimelineManager } from "../core/metadata/timelineManager";
import { HubManager } from "../core/metadata/hubManager";
import { GlossaryManager } from "../core/metadata/glossaryManager";

export async function initializeAllManagers(
  app: App,
  settings: PluginSettings
): Promise<{
  blacklistManager: BlacklistManager;
  entityStore: EntityStore;
  timelineManager: TimelineManager;
  hubManager: HubManager;
  glossaryManager: GlossaryManager;
}> {
  // Move all manager initialization from main.ts onload()
  // Return initialized manager object
}
```

**Time:** ~30 minutes

**Phase 2: Extract Commands (1 hour)**

**Create:** `src/ui/commands/mainCommands.ts`

```typescript
export function registerMainCommands(plugin: Plugin, app: App) {
  // Move: Scan Document command
  // Move: Open Main Panel command
  // Move: Open Timeline command
  // Move: Show Index command
}
```

**Other command files:**
- `src/ui/commands/metadataCommands.ts` - Metadata Review + Sub-Metadata
- `src/ui/commands/timelineCommand.ts` - Timeline command

**Time:** ~30 minutes

**Phase 3: Extract Context Menu (30 min)**

**Create:** `src/ui/contextMenu/descriptionContextMenu.ts`

Move `registerDescriptionContextMenu()` method.

**Phase 4: Simplify main.ts**

```typescript
// Result: Clean, minimal main.ts
export default class MetadataOrganizerPlugin extends Plugin {
  settings: PluginSettings;
  // Managers declared
  
  async onload() {
    // Load settings
    // Register tabs/views
    // Initialize managers (one line call)
    // Register commands (one line call)
    // Register context menus (one line call)
  }
  
  onunload() {
    // Cleanup
  }
}
```

---

## Large File Management

### Option A: Monitor (Current Approach) ✓

Files 300-400 lines are at the limit for Obsidian modals, but acceptable:
- metadataReviewModal.ts (336 lines)
- subMetadataModal.ts (335 lines)
- keyTermModal.ts (331 lines)

**Action:** Keep as-is, but monitor growth

### Option B: Extract Serializers (Future)

Move persistence logic:
- glossaryManager.ts (509) → glossarySerializer.ts (200)
- timelineManager.ts (423) → timelineSerializer.ts (180)

**Impact:** Improves code organization  
**Time:** ~1-2 hours  
**Priority:** LOW - everything works fine currently

---

## Implementation Checklist

### ✅ Phase 0: Analysis (COMPLETE)
- [x] Identify all files > 300 lines
- [x] Analyze mock file gaps
- [x] Create comprehensive reports

### 🔄 Phase 1: Mock Fixes (DO NEXT - 30 minutes)

- [ ] Add App, Workspace, Leaf classes to mock
- [ ] Complete Vault implementation
- [ ] Add FileSystemAdapter
- [ ] Add Plugin.addSettingTab() and registerView()
- [ ] Update module.exports
- [ ] Run full test suite
- [ ] Commit: "fix: complete core Obsidian API mocks"

### Phase 2: Main.ts Refactoring (1-2 hours)

- [ ] Create src/initialization/initializeManagers.ts
- [ ] Create src/initialization/initializeViews.ts
- [ ] Create src/ui/commands/ folder
- [ ] Extract command registration to src/ui/commands/mainCommands.ts
- [ ] Extract context menu to src/ui/contextMenu/
- [ ] Simplify src/main.ts to ~80 lines
- [ ] Run full test suite
- [ ] Commit: "refactor: extract lifecycle logic from main.ts"

### Phase 3: Enhanced Mocks (30-60 minutes, Optional)

- [ ] Add Setting method implementations (addToggle, addTextArea, etc.)
- [ ] Add MetadataCache class
- [ ] Document mock behavior
- [ ] Create integration-specific mock file (optional)
- [ ] Commit: "enhance: expand mock API coverage"

### Phase 4: Manager Optimization (Optional, ~2 hours)

- [ ] Extract glossaryManager serialization
- [ ] Extract timelineManager serialization
- [ ] Extract hubManager serialization
- [ ] Run full test suite
- [ ] Commit: "refactor: separate manager persistence logic"

---

## Validation After Each Phase

```bash
# After Phase 1 (Mocks)
npm test
# Expected: All 538 tests passing ✓

# After Phase 2 (main.ts)
npm run build
npm test
# Expected: All 538 tests passing ✓

# After Phase 3 (Enhanced mocks)
npm test
# Expected: All tests passing + better mock coverage ✓

# After Phase 4 (Manager optimization)
npm run build
npm test
# Expected: All tests passing + better code organization ✓
```

---

## File Size Targets

### Current vs Target

```
CURRENT:
├─ main.ts                    412 lines  → TARGET: ~80 lines ⚠️
├─ glossaryManager.ts         509 lines  → TARGET: Monitor at 400
├─ timelineManager.ts         423 lines  → TARGET: Monitor at 350
└─ hubManager.ts              382 lines  → TARGET: Monitor at 350

AFTER REFACTORING:
├─ main.ts                     80 lines  ✓
├─ src/initialization/
│  ├─ initializeManagers.ts    150 lines ✓
│  └─ initializeViews.ts        70 lines ✓
├─ src/ui/commands/
│  ├─ mainCommands.ts          120 lines ✓
│  ├─ metadataCommands.ts      100 lines ✓
│  └─ timelineCommand.ts        80 lines ✓
└─ src/ui/contextMenu/
   └─ descriptionContextMenu.ts 80 lines ✓
```

---

## Recommended Timeline

### Session 1 (NOW)
- [x] Analysis & report creation (done)
- [ ] Phase 1: Mock fixes (~30 min)
- [ ] Phase 2 Part A: Initialize extraction (~30 min)
- **Estimated:** 1 hour total

### Session 2
- [ ] Phase 2 Part B: Command extraction (~1 hour)
- [ ] Phase 2 Part C: Context menu extraction (~30 min)
- [ ] Phase 2 Part D: main.ts cleanup (~30 min)
- **Estimated:** 2 hours total

### Session 3 (Optional)
- [ ] Phase 3: Enhanced mocks (~45 min)
- [ ] Phase 4: Manager serialization (~1.5-2 hours)
- **Estimated:** 2-3 hours total

---

## Priority vs Difficulty Matrix

```
HIGH PRIORITY, LOW EFFORT → DO FIRST
├─ Fix mock gaps (Vault, Workspace, App)
├─ Add addSettingTab() to Plugin mock
└─ Simplify main.ts lifecycle

MEDIUM PRIORITY, MEDIUM EFFORT → DO SECOND
├─ Extract command registration
├─ Extract context menus
└─ Improve mock coverage

LOW PRIORITY, MEDIUM EFFORT → DO LATER
├─ Extract manager serializers
├─ Performance profiling
└─ Bundle size optimization
```

---

## Success Metrics

### After Phase 1 (Mock Fixes)
- ✓ All 538 tests passing
- ✓ No "Cannot read property" errors from mocks
- ✓ Vault file operations work in tests

### After Phase 2 (main.ts Refactoring)
- ✓ main.ts < 100 lines
- ✓ Clear file organization
- ✓ Easy to navigate code
- ✓ All 538 tests passing

### After Phase 3 (Enhanced Mocks)
- ✓ Better integration test coverage
- ✓ Mock behavior documented
- ✓ Easy for contributors to understand

### After Phase 4 (Manager Optimization)
- ✓ All managers < 300 lines
- ✓ Clear separation of concerns
- ✓ Better maintainability

---

## Related Documentation

See also:
- `REFACTORING_ANALYSIS.md` - Detailed analysis with code examples
- `MOCK_FILE_ENHANCEMENT.md` - Complete mock API investigation
- `AGENTS.md` - Obsidian plugin best practices
- `package.json` - Build configuration

---

## Questions?

Refer to:
1. **For mock file details** → See MOCK_FILE_ENHANCEMENT.md
2. **For refactoring details** → See REFACTORING_ANALYSIS.md
3. **For best practices** → See AGENTS.md
4. **For code examples** → Check src/ directory against examples in documentation
