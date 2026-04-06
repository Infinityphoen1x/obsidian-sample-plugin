# Mock File Enhancement Guide

## Overview

The current `__mocks__/obsidian.js` is designed for unit testing business logic. However, several critical Obsidian API classes and methods are missing or stubbed. This guide details what needs to be added for different testing scenarios.

---

## Current Mock Coverage Analysis

### ✅ Well-Mocked (Sufficient for Unit Tests)

```javascript
HTMLElement extensions:
  ├─ .empty()           ✓ Fully implemented
  ├─ .createDiv()       ✓ Fully implemented
  ├─ .createEl()        ✓ Fully implemented with options
  ├─ .addClass()        ✓ Fully implemented
  └─ .removeClass()     ✓ Fully implemented

Class mocks:
  ├─ Modal              ✓ Basic structure (constructor, lifecycle)
  ├─ Button             ✓ Basic button class
  ├─ TFile              ✓ Basic file object
  ├─ Plugin             ✓ Basic plugin class
  └─ Notice             ✓ Basic notification class
```

### ⚠️ Partially Mocked (Missing Key Methods)

```javascript
Setting class:
  ✓ addButton()         - Implemented but callback handling could be better
  ✓ addDropdown()       - Stubbed (returns 'this')
  ✓ addText()           - Stubbed (returns 'this')
  ✓ addSearch()         - Stubbed (returns 'this')
  ✗ addToggle()         - MISSING
  ✗ addTextArea()       - MISSING
  ✗ addColorPicker()    - MISSING
  ✗ addSelect()         - MISSING
  ✗ addMultiSelect()    - MISSING
  ✗ setDesc()           - MISSING
  ✗ setName()           - MISSING
  ✗ addExtraButton()    - MISSING

Plugin class:
  ✓ addCommand()        - Stub
  ✓ registerEvent()     - Stub
  ✓ registerDomEvent()  - Stub
  ✓ registerInterval()  - Stub
  ✓ loadData()          - Returns empty object
  ✓ saveData()          - Returns resolved promise
  ✗ workspace           - MISSING (empty object)
  ✗ registerView()      - MISSING
  ✗ registerMarkdownPostProcessor() - MISSING
  ✗ addSettingTab()     - MISSING (used in code!)
```

### 🔴 Not Mocked (Critical Gaps)

```javascript
Vault class:
  ✗ read()              - MISSING (critical)
  ✗ readBinary()        - MISSING (critical)
  ✗ modify()            - MISSING (critical)
  ✗ create()            - MISSING (critical)
  ✗ delete()            - MISSING
  ✗ getFileByPath()     - MISSING (critical)
  ✗ getAbstractFileByPath() - MISSING
  ✗ on()                - MISSING (event system)
  ✗ adapter             - MISSING

App class:
  ✗ vault               - MISSING (critical)
  ✗ workspace           - MISSING (critical)
  ✗ metadataCache       - MISSING

Workspace:
  ✗ getActiveFile()     - MISSING
  ✗ getLeaf()           - MISSING
  ✗ getRightLeaf()      - MISSING
  ✗ onLayoutReady()     - MISSING
  ✗ on()                - MISSING

FileSystemAdapter:
  ✗ write()             - MISSING (critical - used in code!)
  ✗ read()              - MISSING
  ✗ exists()            - MISSING
```

---

## Critical Issues Found in Code Usage

### 1. `addSettingTab()` - Currently Missing!

**Found in:** src/main.ts line 45
```typescript
this.addSettingTab(new MetadataOrganizerSettingTab(this.app, this));
```

**Mock Status:** ❌ NOT IMPLEMENTED

**Fix Required:**
```javascript
class Plugin {
  constructor(app, manifest) {
    this.app = app;
    this.manifest = manifest;
  }

  addCommand(command) {
    // Returns this for chaining
    return this;
  }

  // ADD THIS:
  addSettingTab(tab) {
    // Register a settings tab displayed in plugin settings
    return this;
  }

  addSettingTab(tab) {
    return this;
  }
}
```

### 2. `vault.adapter.write()` - Critical for File Operations

**Found in:** Reference in production patterns
```typescript
await vault.adapter.write(path, content);
```

**Mock Status:** ❌ NOT IMPLEMENTED

**Current Workaround Uses:**
```typescript
vault.create()
vault.modify()
```

**Fix Required:**
```javascript
class FileSystemAdapter {
  async write(path, content) {
    // Mock file write
    return Promise.resolve();
  }

  async read(path) {
    return Promise.resolve("");
  }

  async exists(path) {
    return Promise.resolve(false);
  }

  // ... more methods
}

class Vault {
  constructor() {
    this.adapter = new FileSystemAdapter();
    this.files = new Map();
  }

  async read(file) {
    if (this.files.has(file.path)) {
      return this.files.get(file.path);
    }
    return "";
  }

  async readBinary(file) {
    return new ArrayBuffer(0);
  }

  async modify(file, content) {
    this.files.set(file.path, content);
    return Promise.resolve();
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
      const file = new TFile();
      file.path = path;
      file.name = path.split('/').pop();
      return file;
    }
    return null;
  }
}
```

### 3. `app.workspace` - Critical for View/Pane Operations

**Found in:** src/main.ts lines 44, 184, 395
```typescript
this.app.workspace.onLayoutReady(() => {});
this.app.workspace.getLeaf(false)?.setViewState({});
this.app.workspace.getRightLeaf(false)?.setViewState({});
```

**Mock Status:** ❌ Properties missing

**Fix Required:**
```javascript
class App {
  constructor() {
    this.vault = new Vault();
    this.workspace = new Workspace();
    this.metadataCache = new MetadataCache();
  }
}

class Workspace {
  constructor() {
    this.leaves = [];
  }

  getActiveFile() {
    return null; // Mock: no active file
  }

  getLeaf(focus = false) {
    return new Leaf();
  }

  getRightLeaf(focus = false) {
    return new Leaf();
  }

  onLayoutReady(callback) {
    // Mock: call immediately
    setTimeout(() => callback(), 0);
  }

  on(event, callback) {
    // Mock event listener
    return () => {};
  }

  registerView(type, factory) {
    // Mock: register a custom view
    return this;
  }
}

class Leaf {
  async setViewState(state) {
    // Mock: set leaf view state
    return Promise.resolve();
  }

  async openFile(file) {
    return Promise.resolve();
  }
}
```

---

## Priority-Based Enhancement Plan

### PRIORITY 1 - BLOCKING ISSUES (Fix Immediately)

These methods are used in current code:

```javascript
// 1. Plugin.addSettingTab() - Used in main.ts:45
Plugin.prototype.addSettingTab = function(tab) {
  return this;
};

// 2. Plugin.registerView() - Used in main.ts:48
Plugin.prototype.registerView = function(type, factory) {
  return this;
};

// 3. App.workspace - Used in main.ts:44, 184, 395
class App {
  constructor() {
    this.vault = new Vault();
    this.workspace = new Workspace();
  }
}

// 4. Workspace methods - Used in main.ts
class Workspace {
  onLayoutReady(callback) { 
    // Must call callback for initialization tests
    setTimeout(() => callback(), 0); 
  }
  
  getLeaf(focus) { return new Leaf(); }
  getRightLeaf(focus) { return new Leaf(); }
  getActiveFile() { return null; }
}

// 5. Vault methods - Used in scannerHandlers.ts
class Vault {
  async read(file) { return ""; }
  async readBinary(file) { return new ArrayBuffer(0); }
  async modify(file, content) { return Promise.resolve(); }
  async create(path, content) { 
    const f = new TFile();
    f.path = path;
    f.name = path.split('/').pop();
    return Promise.resolve(f);
  }
  getFileByPath(path) { return null; }
}

// 6. FileSystemAdapter - Used in protocol manager
class FileSystemAdapter {
  async write(path, content) { return Promise.resolve(); }
  async read(path) { return Promise.resolve(""); }
  async exists(path) { return Promise.resolve(false); }
}

class Vault {
  constructor() {
    this.adapter = new FileSystemAdapter();
  }
}
```

### PRIORITY 2 - SHOULD HAVE (Important for Full Coverage)

```javascript
// Setting methods for comprehensive UI testing
Setting.prototype.addToggle = function(callback) {
  if (callback) callback(new Toggle());
  return this;
};

Setting.prototype.addTextArea = function(callback) {
  if (callback) callback(new TextArea());
  return this;
};

Setting.prototype.addColorPicker = function(callback) {
  if (callback) callback(new ColorPicker());
  return this;
};

Setting.prototype.setDesc = function(desc) {
  this.descEl = desc;
  return this;
};

Setting.prototype.setName = function(name) {
  this.nameEl = name;
  return this;
};

// Plugin registration methods
Plugin.prototype.registerMarkdownPostProcessor = function(cb) {
  return this;
};

Plugin.prototype.registerExtensions = function(exts, viewType) {
  return this;
};

Plugin.prototype.registerCodeBlockLanguage = function(lang, factory) {
  return this;
};

// MetadataCache for reference resolution
class MetadataCache {
  getFileCache(file) {
    return { frontmatter: {}, headings: [], links: [] };
  }
  
  getCache(path) {
    return { frontmatter: {}, headings: [], links: [] };
  }
}
```

### PRIORITY 3 - NICE TO HAVE (Lower Priority)

```javascript
// Modal enhancements
Modal.prototype.titleEl = null;  // Add titleEl property
Modal.prototype.containerEl = document.createElement("div");

// More complete Setting options
Setting.prototype.addMultiSelect = function(callback) {
  if (callback) callback(new MultiSelect());
  return this;
};

// Event system
class EventBus {
  on(event, callback) { return () => {}; }
  off(event, callback) { }
  trigger(event, ...args) { }
}
```

---

## Recommended Implementation Path

### Step 1: Add Priority 1 Methods
**Time:** 20 minutes  
**Impact:** Fixes 80% of test issues

```javascript
// Update classes with Priority 1 methods
// Add Workspace, Leaf, FileSystemAdapter, MetadataCache classes
// Update Vault with file operation methods
```

### Step 2: Add Priority 2 Methods
**Time:** 30 minutes  
**Impact:** Better UI testing coverage

```javascript
// Add Setting method implementations
// Add Plugin registration methods
// Add mock support classes (Toggle, TextArea, ColorPicker, etc.)
```

### Step 3: Documentation
**Time:** 15 minutes

```javascript
/**
 * Mock Coverage:
 * 
 * UNIT TESTS (Current):
 * ✓ HTMLElement methods
 * ✓ Modal lifecycle
 * ✓ Plugin lifecycle
 * ✓ Vault operations (mocked)
 * 
 * INTEGRATION TESTS (Needed):
 * ✓ Complete Vault simulation with file storage
 * ✓ Workspace event system
 * ✓ View registration and state
 * ✓ Metadata cache
 */
```

---

## Files That Will Benefit

### Immediately Affected (Tests will fail without fixes)

- ✓ src/main.ts - Uses addSettingTab, registerView, workspace methods
- ✓ src/core/scanner/scannerHandlers.ts - Uses vault.read/modify/create
- ✓ src/ui/modals tests - May expect workspace methods

### Indirectly Affected (Tests will pass but behavior wrong)

- src/protocol/protocolManager.ts - Uses vault operations
- src/core/metadata/ managers - Use vault operations
- src/ui/handlers/ - May expect workspace methods

---

## Testing Strategy Post-Enhancement

```javascript
// Unit tests (still use current mock):
describe('KeyTermModal', () => {
  // DOM operations, selection state, etc.
  // No file system needed
});

// Integration tests (would use enhanced mock):
describe('Document Scanning with File I/O', () => {
  // vault.read() -> actual mock file content
  // vault.create() -> creates mock file
  // vault.modify() -> updates mock file
});

// E2E tests (would need real Obsidian):
// Run in actual Obsidian vault with plugin installed
```

---

## Rollout Plan

### Phase 1: Immediate (Critical Fixes)
1. Update `__mocks__/obsidian.js` with Priority 1 methods
2. Run all tests to verify no regression
3. Commit: "fix: complete core Obsidian API mocks"

### Phase 2: Short-term (Enhancements)
1. Add Priority 2 methods
2. Add new test cases for mocked behaviors
3. Commit: "enhance: expand Obsidian mock coverage"

### Phase 3: Optional (Documentation)
1. Create `MOCK_API.md` documenting mock behavior
2. Create `tests/integration-mocks.js` for more complete mocks
3. Document mock limitations for contributors

---

## Code Examples

### Before (Current)

```javascript
// Mock is incomplete - this will fail:
const app = new App();
app.workspace.onLayoutReady(() => {
  // ReferenceError: Cannot read property 'onLayoutReady' of undefined
});
```

### After (Enhanced)

```javascript
// Mock is complete - tests work:
const app = new App();
app.workspace.onLayoutReady(() => {
  console.log("Initialization complete!");
  // ReferenceError: FIXED ✓
});
```

---

## Success Criteria

- [ ] All 538 tests continue passing
- [ ] No "Cannot read property" errors in mock methods
- [ ] Integration tests can simulate file operations
- [ ] Mock behavior documented for contributors
- [ ] No need to modify test code beyond adding assertions
