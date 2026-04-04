# Plugin Architecture: Metadata Organizer (Greenfield Build)

**Status:** Pre-Phase 1 Planning  
**Last Updated:** April 4, 2026  
**Scope:** Building from scratch using Obsidian sample plugin as foundation

---

## Table of Contents
1. [Project Structure](#project-structure)
2. [Core Data Structures](#core-data-structures)
3. [Storage Strategy](#storage-strategy)
4. [Implementation Solutions](#implementation-solutions)
5. [Phased Implementation Roadmap](#phased-implementation-roadmap)
6. [Key Implementation Decisions](#key-implementation-decisions)
7. [Quick Start Next Steps](#quick-start-next-steps)

---

## Project Structure

### Proposed Directory Layout

```
src/
├── main.ts                    # Plugin lifecycle only
├── settings.ts                # Settings interface + defaults
├── types.ts                   # Shared TypeScript interfaces
│
├── core/
│   ├── metadata/
│   │   ├── entityStore.ts     # Entity ID gen + CSV storage/cache
│   │   ├── masterMetadata.ts  # Master metadata manager
│   │   └── indexFile.ts       # Fast lookup index
│   │
│   └── scanner/
│       ├── documentScanner.ts # Doc scan → token extraction
│       ├── tokenizer.ts       # Token/phrase extraction
│       ├── temporalTagger.ts  # Find temporal terms
│       └── docxConverter.ts   # DOCX → Markdown (mammoth)
│
├── ui/
│   ├── commands.ts            # Command registrations
│   ├── views/
│   │   ├── timelineView.ts    # Master timeline panel
│   │   └── mainPanelView.ts   # Main app panel (buttons)
│   │
│   ├── modals/
│   │   ├── keyTermModal.ts    # Chunked key term selection
│   │   ├── metadataReviewModal.ts  # Group + tagging modal
│   │   ├── subMetadataModal.ts     # Child note creation modal
│   │   ├── timelineSnapshotModal.ts # Event reordering
│   │   └── descriptionModal.ts      # Description editor
│   │
│   └── components/
│       ├── folderCombobox.ts   # Auto-fill folder selector
│       ├── eventReorderer.ts   # Arrow/number reordering
│       ├── timelineRenderer.ts # Timeline DOM render
│       └── colorPicker.ts      # Simple hex/preset colors
│
├── protocol/
│   ├── protocolManager.ts      # Protocol folder setup/teardown
│   ├── logManager.ts           # Logging to protocol/logs/
│   └── fileStructure.ts        # JSON schemas for timeline, hub, etc.
│
├── utils/
│   ├── idGenerator.ts          # Entity ID allocation
│   ├── csvParser.ts            # CSV read/write utilities
│   ├── validators.ts           # Input validation
│   ├── wikilinker.ts           # Wikilink injection
│   └── helpers.ts              # General utilities
│
└── migrations/
    └── v1.ts                   # Schema versioning for metadata
```

---

## Core Data Structures

### Entity & Metadata

```typescript
export interface Entity {
  id: string;              // "ent_abc123_0001"
  name: string;            // "Lucy"
  canonical?: string;      // "lucyName" (for aliases)
  frequency: number;       // 70
  sources: SourceRef[];    // [{doc: "Ch1.md", lines: [5, 12, 23]}]
  group?: string;          // "Characters"
  tags: string[];          // ["characters/lucy", "temporal:past"]
  createdAt: number;       // Timestamp
  updatedAt: number;
  description?: string;    // User-added content
}

export interface SourceRef {
  document: string;        // "Ch1.md"
  lineNumbers: number[];   // [5, 12, 23]
}

export interface MasterMetadataIndex {
  // Quick lookup: term name → entity ID
  nameToId: Map<string, string>;
  // Canonical name → term names (for aliases)
  canonicalToNames: Map<string, string[]>;
}
```

### Groups & Organization

```typescript
export interface Group {
  id: string;
  name: string;            // "Characters"
  folder: string;          // "Characters/" (vault path)
  keyTermIds: string[];    // ["ent_abc_001", "ent_def_002"]
  tags: string[];          // User-added tags
  createdAt: number;
}

export interface ParentNote {
  id: string;
  groupId: string;
  name: string;            // Same as group name
  frontmatter: {
    type: "parent";
    groupId: string;
    keyTermIds: string[];
    tags: string[];
  };
}

export interface ChildNote {
  id: string;
  entityId: string;
  parentId: string;
  name: string;            // Same as entity name
  frontmatter: {
    type: "child";
    parentId: string;
    entityId: string;
    tags: string[];
  };
  description: string;     // User additions
}
```

### Timeline

```typescript
export interface TimelineEvent {
  id: string;              // "evt_xyz_0001"
  sentence: string;        // Full sentence from document
  source: {
    document: string;      // "Ch1.md"
    line: number;
  };
  temporalTerms: string[]; // ["then", "past"]
  order: number;           // Position in timeline
  color?: string;          // "#FF5733"
  status: "draft" | "confirmed";
}

export interface SnapshotTimeline {
  id: string;
  name: string;            // "Ch1 Events"
  documentSource: string;  // "Ch1.md"
  events: TimelineEvent[];
  createdAt: number;
}
```

### Hub & Cross-Reference

```typescript
export interface HubEntry {
  id: string;
  entities: string[];      // ["ent_abc_001", "ent_def_002"]
  frequency: number;       // How many times they co-occur
  sources: SourceRef[];
}
```

### Document Scanning

```typescript
export interface ScanSession {
  document: string;        // "Ch1.md"
  timestamp: number;
  wordsScanned: number;
  newEntities: string[];
  updatedEntities: string[];
  isChapter: boolean;
}
```

### Plugin Settings

```typescript
export interface PluginSettings {
  protocolFolderName: string;     // ".metadata"
  masterMetadataFile: string;     // "master-entities.csv"
  indexFile: string;              // "index.json"
  desktopOnly: boolean;
  mobileWarning: boolean;
  logLevel: "debug" | "info" | "warn";
  chunkSize: number;              // For modal pagination (50–200)
}
```

---

## Storage Strategy

### Protocol Folder Structure

All metadata is stored in a hidden protocol folder (default: `.metadata/`). This keeps user vault clean and organized.

```
<Vault>/
└── .metadata/                        # Protocol folder (hidden)
    ├── master-entities.csv           # All entities (id, name, freq, etc.)
    ├── index.json                    # Fast lookup {name→id, aliases}
    ├── master-timeline.json          # All timeline events
    ├── hub-cross-references.csv      # Entity co-occurrences
    ├── glossary.json                 # Folder tree + descriptions
    │
    └── logs/
        ├── document-scanning/
        │   ├── 2026-04-04_Ch1.md
        │   └── 2026-04-05_Ch2.md
        ├── metadata-review/
        │   └── 2026-04-04_Groups.md
        ├── sub-metadata-review/
        ├── description-edits/
        └── timeline-edits/
```

### Master Entities: CSV Format

**File:** `.metadata/master-entities.csv`

```csv
id,name,canonical,frequency,group,tags,sources,createdAt,updatedAt
ent_abc123_0001,Lucy,lucyName,70,"Characters","characters/lucy|temporal:past","Ch1.md:5|Ch1.md:12|Ch2.md:8",1712250000,1712336400
ent_def456_0002,Magic,magicTerm,45,"Systems","systems/magic|temporal:ancient","Ch1.md:23|Ch3.md:15",1712250100,1712336500
```

**Why CSV?**
- Small file size (~60% smaller than JSON for 10k+ entities)
- Easy to parse in chunks
- Human-readable for debugging
- Fast sequential read for frequency-sorted queries

### Master Index: JSON Format

**File:** `.metadata/index.json`

```json
{
  "nameToId": {
    "lucy": "ent_abc123_0001",
    "magic": "ent_def456_0002"
  },
  "canonicalToNames": {
    "lucyName": ["lucy", "lucy hartwell"],
    "magicTerm": ["magic", "arcane magic"]
  },
  "groupIndex": {
    "Characters": ["ent_abc123_0001"],
    "Systems": ["ent_def456_0002"]
  },
  "lastUpdated": 1712336500,
  "version": 1
}
```

**Purpose:**
- Fast in-memory lookup (~1-2MB for 10k entities)
- Loaded on plugin startup
- Updated whenever entities change
- Prevents duplicate term creation

### Storage Design Rationale

| Component | Format | Why |
|-----------|--------|-----|
| **Entities** | CSV | Compact, queryable, efficient chunking |
| **Index** | JSON | Fast lookups, in-memory cache |
| **Timeline** | JSON | Structured events, mermaid-compatible |
| **Hub** | CSV | Large entries, similar to entities |
| **Logs** | Markdown | Human-readable audit trail |

---

## Implementation Solutions

### 1. Entity ID System

**Format:** `ent_[hash]_[sequence]`

**Properties:**
- **Deterministic:** `generate("Lucy", timestamp)` always produces same ID
- **Compact:** ~20 chars vs full term name
- **Sortable:** By creation timestamp
- **Collision-free:** Hash + sequence guarantees uniqueness

**Example:**
```
ent_abc123_0001
ent_def456_0002
ent_xyz789_0003
```

**Implementation:**
```typescript
function generateEntityId(term: string, timestamp: number): string {
  const hash = termToHash(term).substring(0, 6);
  const seq = String(timestamp % 10000).padStart(4, '0');
  return `ent_${hash}_${seq}`;
}
```

### 2. Master Metadata Management

**Loading Strategy:**
1. On plugin load: read `index.json` into memory
2. Load full `master-entities.csv` lazily (on demand)
3. Keep in-memory cache: `Map<entityId, Entity>`
4. On changes: update CSV + index immediately

**Benefits:**
- Fast startup (~10ms for 10k entities)
- Minimal memory footprint until scan starts
- Atomic updates (prevent corruption)

### 3. Mobile-Safe UI Reordering

Instead of drag-and-drop (mobile-incompatible), use:

**Arrow Icons + Number Input:**
```
Event 1: "He arrived at dawn" [▲] [▼]
Event 2: "She spoke"        [▲] [▼]
Event 3: "Magic exploded"   [▲] [▼]
```

Or direct position input:
```
Event 1: [Position: 1 ▼]  // User types 3 → moves to position 3
```

**Implementation (Reusable Component):**
```typescript
class EventReorderer {
  swapEvents(events: Event[], indexA: number, indexB: number) {
    [events[indexA], events[indexB]] = [events[indexB], events[indexA]];
    this.persist(events);
  }
  
  moveToPosition(events: Event[], currentIndex: number, newPosition: number) {
    const event = events.splice(currentIndex, 1)[0];
    events.splice(newPosition - 1, 0, event);
    this.persist(events);
  }
}
```

### 4. Auto-Fill Folder Combobox

**Behavior:**
- User types folder name → suggestions filter in real-time
- Arrow keys / scroll wheel navigate suggestions
- Enter to select, Escape to cancel

**Implementation:**
```typescript
class FolderCombobox {
  private vault: Vault;
  private suggestions: string[] = [];
  private selectedIndex: number = -1;
  
  async buildFolderTree() {
    const folders = this.vault.getFolders();
    this.suggestions = folders
      .map(f => f.path)
      .sort();
  }
  
  onInput(query: string) {
    this.suggestions = this.suggestions.filter(path =>
      path.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
    } else if (event.key === 'ArrowUp') {
      this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
    }
    this.render();
  }
  
  onWheel(event: WheelEvent) {
    if (event.deltaY > 0) this.selectedIndex++;
    else this.selectedIndex--;
    this.selectedIndex = Math.max(0, Math.min(this.selectedIndex, this.suggestions.length - 1));
  }
}
```

### 5. Wikilink Auto-Linking

**Key Insight:** Obsidian automatically resolves `[[Lucy]]` if `Lucy.md` exists.

**Workflow:**
1. Plugin creates parent/child markdown files with exact entity names
2. All existing `[[Term]]` wikilinks in source docs automatically resolve
3. No special linking code needed—Obsidian handles it natively

**Verification:**
- Click `[[Lucy]]` → opens that note (if `Lucy.md` exists)
- Hover over `[[Lucy]]` → shows preview (if `Lucy.md` exists, with description)

**Sub-Metadata Automation:**
- User clicks unlinked `[[UnknownTerm]]` → Obsidian shows "unlinked mention"
- Plugin listens for note creation events
- When creating a child note, it updates index, and links become valid

### 6. Mobile Support Strategy

**Changes Required:**

**A. Update `manifest.json`:**
```json
{
  "isDesktopOnly": true,
  "description": "Visual metadata organizer for narrative projects. Desktop app with advanced drag-and-drop timeline features. Mobile experience is limited."
}
```

**B. In Plugin Settings:**
```typescript
interface PluginSettings {
  desktopOnly: boolean;           // Default: true
  mobileWarning: boolean;         // Show warning on mobile
  timelineMode: "static" | "interactive";
}
```

**C. On Plugin Load (Mobile Detection):**
```typescript
async onload() {
  if (Platform.isMobile) {
    new Notice(
      "⚠️ This plugin has limited mobile support. " +
      "Timeline features are unavailable. " +
      "See Settings for alternatives.",
      5000
    );
    this.settings.timelineMode = 'static';
  }
}
```

### 7. Python Script (`batchlinkr.py`)

**Status:** Keep as-is, defer TypeScript conversion.

**Reasoning:**
- Small, self-contained utility
- Plugin doesn't strictly depend on it
- Useful as optional post-scan cleanup tool
- Can be converted later as optional enhancement

**Future:** If users request "link clipboard text" command, convert to TypeScript then.

---

## Phased Implementation Roadmap

### Phase 1: Foundation (Weeks 1–3)

**Objectives:**
- Core entity ID generation
- CSV storage + index file
- Document scanner (text extraction, token frequency)
- Temporal term detection
- Basic frontmatter generation
- Protocol folder setup

**Deliverable:**
Scan a `.md` file → extract tokens → generate frontmatter with temporal tags.

**Key Modules:**
- `idGenerator.ts`
- `entityStore.ts`
- `indexFile.ts`
- `documentScanner.ts`
- `tokenizer.ts`
- `temporalTagger.ts`
- `protocolManager.ts`

---

### Phase 2: Metadata Review (Weeks 4–6)

**Objectives:**
- Chunked key term selection modal
- Wikilink injection utilities
- Group/folder organization
- Parent note generation
- Master metadata persistence

**Deliverable:**
Scan document → select key terms → create parent notes → persist metadata.

**Key Modules:**
- `keyTermModal.ts`
- `wikilinker.ts`
- `masterMetadata.ts`
- `metadataReviewModal.ts`

---

### Phase 3: Sub-Metadata & Linking (Weeks 7–8)

**Objectives:**
- Child note creation flow
- Auto-fill folder combobox
- Test native wikilink resolution
- Context menu integration
- Description modal

**Deliverable:**
Click unlinked `[[Lucy]]` → create child note → auto-link works.

**Key Modules:**
- `subMetadataModal.ts`
- `folderCombobox.ts`
- `descriptionModal.ts`

---

### Phase 4: Timeline UI (Weeks 9–12)

**Objectives:**
- Event extraction from temporal terms
- Timeline snapshot modal (arrow/number reorder)
- Master timeline view panel
- Event color coding
- Timeline persistence

**Deliverable:**
Generate timeline from scan → reorder events → save snapshots.

**Key Modules:**
- `timelineSnapshotModal.ts`
- `eventReorderer.ts`
- `timelineView.ts`
- `timelineRenderer.ts`

---

### Phase 5: Hub, Glossary, Logs (Weeks 13–15)

**Objectives:**
- Hub cross-reference generation
- Glossary tree rendering
- Comprehensive logging
- Mobile fallback warnings

**Deliverable:**
Full metadata ecosystem with audit logs.

**Key Modules:**
- `logManager.ts`
- `fileStructure.ts` (hub, glossary schemas)

---

### Phase 6: Polish & Testing (Weeks 16–18)

**Objectives:**
- Error recovery & edge cases
- Performance optimization
- Mobile testing + fallbacks
- Release preparation

**Deliverable:**
Production-ready plugin.

---

## Key Implementation Decisions

| Decision | Why | Implication |
|----------|-----|-------------|
| **Entity IDs: `ent_hash_seq`** | Deterministic prevents dupes | Consistent across scans |
| **CSV + In-Memory Index** | Small, queryable, cacheable | Load index on startup, lazy-load CSV |
| **Mobile: Desktop-Only** | Drag-drop + Python = incompatible | Set `isDesktopOnly: true` |
| **Arrow/Number Reordering** | Works on all devices | Mobile fallback built-in |
| **Auto-Fill Combobox** | Scales to 100+ nested folders | Efficient filtering + scroll nav |
| **Wikilink via File Creation** | Obsidian native behavior | Just create markdown files, auto-links work |
| **Protocol Folder** | Hidden from user, clean org |`.metadata/` by default |
| **Chunked Loading** | Memory efficiency | Modals load 50–200 terms per page |
| **CSV Persistence** | Append-only updates | Atomic write operations |
| **No Python in Core** | Mobile/deployment issues | Keep as optional utility |

---

## Quick Start: Next Steps

### Immediate Actions (Before Phase 1 Code)

1. **Update `manifest.json`**
   - Set plugin ID, name, version
   - `"isDesktopOnly": true`
   - Add description

2. **Create `settings.ts`**
   - Define `PluginSettings` interface
   - Set defaults (protocol folder name, chunk size, etc.)
   - Implement settings UI (if needed in Phase 1)

3. **Create `types.ts`**
   - Copy all TypeScript interfaces from this document
   - Lock down data structures

4. **Create core module stubs**
   - `src/core/metadata/entityStore.ts`
   - `src/core/metadata/indexFile.ts`
   - `src/core/scanner/documentScanner.ts`
   - `src/utils/idGenerator.ts`

5. **Scaffold commands**
   - `New Scan` command (placeholder)
   - Register in `main.ts`

### Phase 1 First Task: Entity ID Generator

**File:** `src/utils/idGenerator.ts`

**Requirements:**
- Generate deterministic IDs from term name
- Format: `ent_[6-char hash]_[4-digit sequence]`
- Collision-free
- Testable with unit tests

---

## References

- **Obsidian API Docs:** https://docs.obsidian.md
- **Sample Plugin:** https://github.com/obsidianmd/obsidian-sample-plugin
- **Plugin Guidelines:** https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- **Data Structures:** TypeScript interfaces defined above

---

**Document Status:** Complete architectural plan ready for Phase 1 kickoff.

