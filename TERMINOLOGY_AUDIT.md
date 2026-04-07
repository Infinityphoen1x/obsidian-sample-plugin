# Terminology Audit & Separation of Concerns Analysis - v1.1 Roadmap

**Date:** April 7, 2026  
**Version Target:** v1.1 (Post-v1.0 Release)  
**Status:** Prioritized for v1.1 Implementation  
**Scope:** Critical issues for stability + optional improvements

---

## Executive Summary - v1.1 Action Items

This audit identifies issues for v1.1 improvement based on v1.0 stability baseline:

**Critical for v1.1 (Data Integrity):**
1. **Group identity fragmentation** – Requires explicit `groups.json` storage
2. **Missing entity deletion** – Need cascade cleanup for orphaned references
3. **Entity ownership validation** – Add checks for broken group references

**Valuable for v1.1 (Architecture):**
4. **Refactor modal handlers** – DocumentScanHandler already shows the pattern
5. **Consolidate terminology** – Minor UX improvements

**Defer to v1.2+ (Post-deletion features):**
6. Tag synchronization, Hub staleness (only matter if rename/delete added first)

---

## Part 1: Core Terminology Catalogue (Reference - No Changes for v1.1)

### Context: User's Mental Model
The plugin helps users organize literary/historical works into an interconnected knowledge database. Users scan raw documents, select important concepts (entities), organize them into thematic groups, and create timelines of events.

---

### 1. **Entity** (Primary Concept)
**User Viewpoint:** "A concept, character, location, or important thing that appears in my documents"  
**Definition:** A unique, named concept extracted from documents  
**System Representation:**
```typescript
interface Entity {
  id: string;              // ent_abc123_0001
  name: string;            // "Lucy", "Magic System", "Port City"
  frequency: number;       // How many times it appears across all scans
  sources: SourceRef[];    // Where it appears (document + line numbers)
  group?: string;          // Optional: assigned group name (e.g., "Characters")
  tags: string[];          // Metadata tags (e.g., ["characters/lucy", "temporal:past"])
  description?: string;    // User-added details
  createdAt: number;       // Timestamp
  updatedAt: number;
}
```

**Storage:** `.metadata/master-entities.csv` (CSV format for efficiency)  
**Lifecycle:**
- Created during document scanning (token extraction)
- Presented to user for confirmation via **KeyTermModal**
- Grouped in **MetadataReviewModal**
- Can have child notes created via **SubMetadataModal**
- Wikilinked in source documents upon confirmation

**User Interactions:**
- Select/deselect in **KeyTermModal** during scanning
- Assign to groups in **MetadataReviewModal**
- Create child note via **SubMetadataModal** for descriptions
- Add description via **DescriptionModal**

---

### 2. **Key Term** (Confirmed Selection of Entity)
**User Viewpoint:** "A concept I've confirmed is important enough to track and link"  
**Definition:** An Entity that a user has explicitly selected as important during the **KeyTermModal**  
**System Representation:** 
- Internal: Part of `Entity` with confirmation status (implicit)
- Selected terms stored in `KeyTermSelection.selected` Set
- Converted to `Entity` objects with `group` and tag assignments

**Relationship to Entity:**
- **1:N mapping** - One Entity can be a key term, but not all extracted tokens become key terms
- Key terms are entities the user deems significant enough to:
  - Wikilink throughout documents
  - Add group assignments to
  - Create child notes for

**Storage:** Via parent Entity record in CSV  
**User Interactions:**
- Select on pages of **KeyTermModal**
- Bulk operations: "Select All", "Deselect All", "Reject All" per page

**⚠️ CONCERN: Naming Confusion**
- "Key term" is used in plugin goals, UI modals, and variable names
- But internally it's just an Entity with confirmed status
- No separate "KeyTerm" interface exists—it's a semantic state of an Entity
- Users may be confused about whether they're managing different types of objects

---

### 3. **Group** (Organizational Container)
**User Viewpoint:** "A category I create to organize related entities (e.g., 'Characters', 'Locations', 'Magic Systems')"  
**Definition:** A named collection of entities organized by theme/role  
**System Representation:**
```typescript
interface Group {
  id: string;
  name: string;            // "Characters", "Locations"
  folder: string;          // Vault folder path (e.g., "Characters/")
  keyTermIds: string[];    // Entity IDs in this group
  tags: string[];          // User-added tags
  createdAt: number;
}
```

**Created During:** **MetadataReviewModal** when user:
1. Clicks "Add Group"
2. Enters group name
3. Selects folder from dropdown
4. Clicks "Confirm"

**Storage:**
- Group metadata: Implied in parent note frontmatter + folder structure
- No direct storage in a "groups.csv" or "groups.json"
- Reconstructed from folder organization + parent notes

**Lifecycle:**
- Created in **MetadataReviewModal**
- Folder created in vault
- Parent markdown created with group name
- Entities tagged with format: `GroupName/EntityName`

**User Interactions:**
- Create: **MetadataReviewModal** → "Add Group"
- Name: Text input in modal
- Assign folder: Dropdown selector in modal
- Add entities: Select entities → "Add Selected"
- Modify: Edit button to rename
- Tag: Add/remove tags at modal bottom

**⚠️ CONCERN: Storage Ambiguity**
- Groups are **not explicitly stored** as a data structure
- Reconstructed from:
  - Folder names in vault
  - Parent markdown files
  - Entity group field
- If folder is deleted or parent note is removed, group data is implicit/lost
- No single source of truth for "what groups exist"

---

### 4. **Parent Note** (Group Index Document)
**User Viewpoint:** "An index or hub document for a group (e.g., 'Characters.md' in the Characters folder)"  
**Definition:** A markdown file that lists all entities in a group with their sources  
**System Representation:**
```typescript
interface ParentNote {
  id: string;
  groupId: string;
  name: string;            // Same as group name
  frontmatter: {
    type: "parent";
    groupId: string;
    keyTermIds: string[];  // Entity IDs
    tags: string[];
  };
}
```

**Created During:** **MetadataReviewModal** → "Apply"  
**File Structure:**
```
Characters/              (Folder)
├── Characters.md        (Parent note)
│   ---
│   type: parent
│   groupId: group_xyz
│   keyTermIds: [ent_001, ent_002, ent_003]
│   tags: [custom:tag]
│   ---
│
│   # Characters
│   ## Entities
│   | Entity | Frequency | Sources |
│   | [[Lucy]] | 70 | Ch1.md, Ch2.md |
│
│   ## Description
│
├── Lucy.md          (Child note)
└── Vincent.md       (Child note)
```

**Content Structure:**
- H1 Title: Same as group/parent name
- Table: Wikilinked entities with frequency and sources
- Description section: Empty until user adds details

**Frontmatter Fields:**
- `type: "parent"` – Marks this as a parent note
- `groupId` – Links to group
- `keyTermIds` – List of entity IDs in this group
- `tags` – Group-level tags

**Purpose:**
- Quick access hub for all entities in a group
- Wikilink entry point to child notes
- Source document reference

---

### 5. **Child Note** (Entity Detail Document)
**User Viewpoint:** "A dedicated note for one entity (e.g., 'Lucy.md') where I can add descriptions, references, and details"  
**Definition:** A markdown file dedicated to a single entity with description and source tracking  
**System Representation:**
```typescript
interface ChildNote {
  id: string;
  entityId: string;       // Links to entity
  parentId: string;       // Links to parent note
  name: string;           // Same as entity name
  frontmatter: {
    type: "child";
    parentId: string;
    entityId: string;
    tags: string[];
  };
  description: string;    // User-added content
}
```

**Created During:** 
1. Automatic: **MetadataReviewModal** → "Apply" (if enabled)
2. Manual: **SubMetadataModal** → select entities → "Create"

**File Structure:**
```
Characters/Lucy.md
---
type: child
parentId: parent_xyz
entityId: ent_lucy_001
tags: [characters/lucy, temporal:past]
---

# Lucy

## Description
(User adds details here)

## Sources
| Document | Line | Context |
| Ch1.md | 5 | First mention |
| Ch1.md | 23 | Major scene |

## Related (Auto-generated)
See hub/cross-references for linked entities

Backlink to parent: [[Characters]]
```

**Purpose:**
- Dedicated space for user to add rich descriptions
- Source tracking (document + line numbers)
- Hub integration (shows related entities mentioned in same sentences)

**Frontmatter Fields:**
- `type: "child"` – Marks as child note
- `parentId` – Links back to parent group index
- `entityId` – Links to the entity
- `tags` – Entity-level tags

---

### 6. **Tag** (Metadata Label)
**User Viewpoint:** "A label I can add to groups or entities to help me organize and filter"  
**Definition:** A string-based metadata marker  
**System Representation:**
```typescript
tags: string[];  // Part of Entity, Group, and Document frontmatter
// Format examples:
// "characters/lucy" – hierarchical tag from group/entity
// "temporal:past" – temporal categorization
// "custom:my-label" – user-added custom tag
```

**Types of Tags:**
1. **Group-based tags** (auto-generated): `GroupName/EntityName`  
   - Format: `{groupName}/{entityName}`
   - Created when entity is assigned to group
   - Added to source document frontmatter

2. **Temporal tags** (auto-generated): `temporal:{category}`  
   - Format: `temporal:past`, `temporal:present`, `temporal:ancient`
   - Created from temporal term detection
   - Added to document frontmatter

3. **Custom tags** (user-added): `custom:*` or any user-defined format  
   - User can add in **MetadataReviewModal** and **SubMetadataModal**
   - Appear in tag section at bottom of groups
   - Stored in Entity.tags array

**Storage:**
- Entity.tags[] – For entity-level tags
- Group.tags[] – For group-level tags
- DocumentFrontmatter.tags[] – For source documents
- ParentNote.frontmatter.tags[] – For parent notes
- ChildNote.frontmatter.tags[] – For child notes

**⚠️ CONCERN: Hierarchical Ambiguity**
- Tags appear in multiple places (entity, group, document)
- Same tag can exist in entity AND its source document
- No clear ownership model for tag lifecycle
- Example: Entity has `"characters/lucy"` tag, but where does it get updated when group is renamed?

---

### 7. **Temporal Term** (Time Marker)
**User Viewpoint:** "A word or phrase that indicates when something happened (e.g., 'then', 'after', 'yesterday')"  
**Definition:** A detected word indicating temporal reference in text  
**System Representation:**
```typescript
interface TemporalTerm {
  term: string;           // "then", "past", "after"
  position: number;       // Character position in document
  lineNumber: number;     // Line number of first occurrence
  frequency: number;      // Count in document
  wikilinked: boolean;    // Already [[wrapped]]
}
```

**Detection:** Automatic during document scanning via `extractTemporalTerms()`  
**Predefined Keywords:**
- Past: "past", "once", "before", "then"
- Present: "now", "currently", "presently"
- Future: "soon", "later", "eventually", "will"
- Ancient: "ancient", "primordial", "time immemorial"

**Processing:**
1. Extracted during **Document Scanning**
2. Wikilinked if selected in **KeyTermModal** (optional)
3. Converted to temporal tags in frontmatter
4. Used for **Timeline** generation

**Relationship to Timeline Events:**
- Temporal terms identify potential timeline events
- Full sentences containing temporal terms become candidates for **TimelineEvent**
- User reviews and confirms event order in **TimelineSnapshotModal**

**Storage:**
- DocScanResult.temporalTerms[] – During scan
- Document frontmatter: `temporal_tags: [...]`
- Not persisted as separate database entities

**⚠️ CONCERN: Fuzzy Definition**
- Temporal terms are detected but **not explicitly tracked as entities**
- Create a gray area: are they entities or just metadata?
- Can't easily query "what events involve 'past'?"
- No persistent record of temporal term frequency across all documents

---

### 8. **Source / SourceRef** (Document Location Tracker)
**User Viewpoint:** "Where did this entity appear in my documents?"  
**Definition:** A reference to a document and line numbers where an entity appears  
**System Representation:**
```typescript
interface SourceRef {
  document: string;        // "Ch1.md", "Chapter_2.docx"
  lineNumbers: number[];   // [5, 12, 23, 45]
}

// Stored in Entity:
entity.sources: SourceRef[]
```

**Lifecycle:**
1. **Document Scanning:** Detected when tokens extracted
2. **Entity Creation:** SourceRef created with document path + line numbers
3. **Frequency Merging:** When scanning new document, if entity exists, sources merged
4. **Persistence:** Stored in CSV as pipe-delimited format

**Storage Format (CSV):**
```csv
id,name,frequency,sources
ent_lucy_001,Lucy,70,"Ch1.md:5|Ch1.md:12|Ch2.md:8"
```

**Usage:**
- Entity.sources[] – Which documents mention this entity
- HubEntry.sources[] – Which documents have co-occurrences
- TimelineEvent.source – Where event/sentence came from
- Child note table – Show all line numbers for an entity

---

### 9. **Hub / HubEntry** (Cross-Reference Index)
**User Viewpoint:** "Which entities appear together? If I see 'Lucy' and 'Magic', are they mentioned in the same place?"  
**Definition:** A record of entity co-occurrences (2+ entities in the same sentence)  
**System Representation:**
```typescript
interface HubEntry {
  id: string;              // "ent_lucy_001|ent_magic_003"
  entities: string[];      // Entity IDs that co-occur
  frequency: number;       // How many times they appear together
  sources: SourceRef[];    // Where the co-occurrences are
}
```

**Created During:** Document scanning via `detectCoOccurrences()`  
**Logic:**
- For each sentence in scanned document:
  - Find all entities mentioned
  - If 2+ entities: create/update hub entry
  - Increment co-occurrence frequency
  - Add source (document + line)

**Storage:** `.metadata/hub-cross-references.csv`  
**Format:**
```csv
id,entities,frequency,sources
ent_lucy_001|ent_magic_003,ent_lucy_001|ent_magic_003,5,"Ch1.md:23|Ch2.md:15|Ch3.md:8"
```

**Purpose:**
- Discover thematic connections
- Identify related entities automatically
- Build relationship network
- Support future "relationship graph" features

**User Access:**
- Auto-generated during scanning
- Displayed in child note "Related" section (if implemented)
- No direct UI for hub browsing yet

---

### 10. **Glossary / GlossaryEntry** (Hierarchical Index)
**User Viewpoint:** "Show me all my entities organized by group, with their descriptions"  
**Definition:** A tree-structured index mapping groups → entities  
**System Representation:**
```typescript
interface GlossaryEntry {
  name: string;
  type: "group" | "entity";
  path: string;            // Vault path
  description?: string;    // Entity description
  children?: GlossaryEntry[];
  entityId?: string;
  frequency?: number;
}

interface GlossaryTree {
  version: number;
  lastUpdated: number;
  entries: GlossaryEntry[];  // Root-level groups
}
```

**Structure:**
```
Glossary Tree
├── Characters (group)
│   ├── Lucy (entity) - description here
│   ├── Vincent (entity) - description here
│   └── Eleanor (entity)
├── Locations (group)
│   ├── Port City (entity)
│   └── The Forest (entity)
└── Ungrouped (auto-created for entities without group)
    └── Magic System (entity)
```

**Built From:** Groups + Entities via `buildFromGroupsAndEntities()`  
**Storage:** `.metadata/glossary.json`  
**Purpose:**
- Quick hierarchical view of all content
- Alphabetical organization within groups
- Frequency display (how common is each entity)
- Human-readable reference

**User Access:**
- Via **Glossary View** (not yet fully implemented)
- Generated after **MetadataReviewModal** completes

---

### 11. **Timeline / TimelineEvent / SnapshotTimeline** (Temporal Organization)
**User Viewpoint:** "Show me the sequence of events in my story/history. Let me reorder them and mark concurrent events"  
**Definition:** A structured representation of events along a temporal axis  

#### 11a. **TimelineEvent** (Individual Event)
**System Representation:**
```typescript
interface TimelineEvent {
  id: string;              // evt_xyz_0001
  sentence: string;        // Full sentence from document (primary content)
  source: {
    document: string;      // "Ch1.md"
    line: number;
  };
  temporalTerms: string[]; // ["then", "past"] – hints about when
  order: number;           // Position in timeline (user-defined)
  color?: string;          // "#FF5733" – visual grouping
  status: "draft" | "confirmed";
  isCustom?: boolean;      // User-created vs. auto-suggested
}
```

**Sources of Events:**
1. **Auto-detected from temporal terms:**
   - Full sentences containing temporal keywords
   - Generated from document scan
   - User reviews in **TimelineSnapshotModal**

2. **User-created custom events:**
   - Click on empty space in timeline
   - Enter custom text
   - Manual event creation

**Storage:** `.metadata/timeline-events.csv`

#### 11b. **SnapshotTimeline** (Document-Scoped Events)
**System Representation:**
```typescript
interface SnapshotTimeline {
  id: string;
  name: string;            // "Ch1 Events", "Chapter 2 Timeline"
  documentSource: string;  // "Ch1.md"
  events: TimelineEvent[];
  createdAt: number;
}
```

**Created During:** User runs "Generate Timeline" on active document  
**Purpose:**
- Organize events from a single document
- Allow user to reorder and color-code
- Confirm event status (draft → confirmed)

#### 11c. **MasterTimeline** (Global Events)
**System Representation:**
```typescript
interface MasterTimeline {
  snapshots: SnapshotTimeline[];
  version: number;
  lastUpdated: number;
}
```

**Composition:** Union of all SnapshotTimelines  
**User Interactions:**
- View in **Timeline View Panel** (master UI)
- Drag events across snapshots
- Create markers/labels
- Color-code by theme
- Add concurrent events (mermaid visualization)

**Storage:** `.metadata/master-timeline.csv` + `.metadata/timeline-events.csv`

**⚠️ CONCERN: Relationship Complexity**
- TimelineEvent contains sentence text (redundant with source document)
- Temporal terms are SEPARATE from timeline events
- If entity is renamed, sentences in events don't auto-update
- No link back to entity—timeline is standalone document references only

---

### 12. **Token** (Raw Extracted Word/Phrase)
**User Viewpoint:** "A meaningful word or phrase the plugin found in my document"  
**Definition:** A word or short phrase extracted during tokenization  
**System Representation:**
```typescript
interface Token {
  word: string;            // "Lucy", "Magic System", "Portal"
  frequency: number;       // 70 occurrences in document
  positions: number[];     // Character positions in text
}
```

**Created During:** Document scanning via `extractTokens()`  
**Processing:**
1. Split document into tokens (words + noun phrases)
2. Filter out stopwords (common English words)
3. Calculate frequency
4. Sort by frequency
5. Suggest top 50 for user selection in **KeyTermModal**

**Relationship to Entity:**
- Tokens are RAW → Entities are CONFIRMED+PERSISTENT
- Selected tokens become key terms (which are entities)
- Tokens are session-local (not persisted)

**Storage:** `DocScanResult.tokens[]` (in-memory only)

---

### 13. **Document** (Source File)
**User Viewpoint:** "A markdown or Word document I want to scan and extract concepts from"  
**Definition:** A markdown or .docx file to be scanned  
**System Representation:**
```typescript
// Not an interface, but represented as:
// - TFile (Obsidian file object)
// - file.path, file.basename, file.extension
// - file.extension in ["md", "docx"]
```

**Processing:**
1. User runs "Scan Document" command
2. Active file (md or docx) is scanned
3. If docx: converted to markdown via mammoth library
4. Content tokenized → entities extracted → presented to user

**Metadata:**
```typescript
interface DocumentFrontmatter {
  type: "document" | "parent" | "child";
  is_chapter?: boolean;    // Detected during scan
  word_count?: number;
  temporal_tags?: string[];
  tags: string[];
  scanned_date?: string;
}
```

**Types:**
1. **Source documents:** Original markdown/docx files user scans
2. **Parent notes:** Generated index documents
3. **Child notes:** Generated entity detail documents
4. **DOCX conversion markdown:** Temporary generated markdown from DOCX

---

### 14. **Chapter** (Document Classification)
**User Viewpoint:** "Is this document a narrative chapter or something else (glossary, reference, index)?"  
**Definition:** A document classification indicating narrative content  
**System Representation:**
```typescript
// Not an interface; stored as:
is_chapter: boolean  // In DocScanResult and DocumentFrontmatter
```

**Detection Heuristics (in `detectChapter()`):**
- Filename contains: "CH", "Chapter", "Part", "Act", "Episode", "Scene"
- Content characteristics:
  - Word count ≥ 500
  - Markdown syntax ratio < 5% (not heavily formatted)
  - Special characters ratio < 2% (mostly prose)

**Purpose:**
- Hint for document type classification
- May affect scanning strategy (future expansion)
- Stored metadata for context

---

## Part 2: Redundancies & Overlaps

### REDUNDANCY 1: Entity vs. Token vs. Key Term

| Concept | Definition | Storage | Lifecycle |
|---------|-----------|---------|-----------|
| **Token** | Raw extracted word | `DocScanResult.tokens[]` (session) | Scan → Suggest → Discard |
| **Key Term** | Confirmed token (semantic status) | Entity.id (CSV) | Suggested → Selected → Persisted |
| **Entity** | Persistent tracked concept | `.metadata/master-entities.csv` | Created → Tagged → Grouped → Wikilinked |

**Problem:** Three overlapping layers of abstraction for "something important to track"

**Example Workflow:**
```
Document scan → Token "Lucy" (raw)
                      ↓
            KeyTermModal suggests "Lucy"
                      ↓
            User selects "Lucy" (key term status)
                      ↓
            Entity created with name "Lucy"
                      ↓
            Entity.id = ent_lucy_001
                      ↓
            Assigned to Group "Characters"
                      ↓
            Wikilinked in document
```

**Issue:** No formal "transition" between states. All three exist in code but language is used interchangeably.

**Recommendation:** Unify terminology or create formal state machine:
- Option A: Call all of them "entities" with status field
- Option B: Formalize "Token → KeyTerm → Entity" progression

---

### REDUNDANCY 2: Group vs. Folder vs. Parent Note

| Component | Purpose | Storage | Owner |
|-----------|---------|---------|-------|
| **Group** | Logical collection | Entity.group field + implicit folder | Entity? or folder? |
| **Folder** | Vault file structure | Real directory in vault | Vault |
| **Parent Note** | Group index document | Markdown file in folder | Folder? or Entity? |

**Problem:** Group identity is **distributed across three representations**

**Example:**
```
User creates "Characters" group in MetadataReviewModal
                      ↓
Creates folder: Characters/
                      ↓
Creates file: Characters/Characters.md
                      ↓
Sets Entity.group = "Characters"
                      ↓
Updates frontmatter with keyTermIds
```

If user:
- Deletes folder → Group effectively deleted (but entities still reference it)
- Renames parent note → Group metadata loses sync
- Manually creates folder → Plugin doesn't know about it

**Single Source of Truth Problem:** No canonical record. Reconstruction requires:
1. Scan all entities
2. Extract unique group names
3. Check if folders exist
4. Check if parent notes exist
5. Reconcile mismatches

**Recommendation:** Create explicit `groups.json` to store canonical group metadata.

---

### REDUNDANCY 3: Source vs. SourceRef vs. Document Frontmatter Tags

| Representation | What It Tracks | Usage |
|---|---|---|
| **Entity.sources** | Document + line numbers | "Where does this entity appear?" |
| **SourceRef array** | Serialized in CSV | CSV persistence |
| **Document frontmatter tags** | `groupname/entityname` tags | "What groups is this doc involved in?" |

**Problem:** Source information stored in two ways:

1. **Entity-centric (Entity.sources):**
   ```typescript
   entity.sources = [
     { document: "Ch1.md", lineNumbers: [5, 12, 23] },
     { document: "Ch2.md", lineNumbers: [8] }
   ]
   ```
   - Query: "Where does Lucy appear?"
   - Answer: Entity.sources

2. **Document-centric (Frontmatter tags):**
   ```yaml
   ---
   tags: [characters/lucy, locations/port]
   ---
   ```
   - Query: "What entities does this document mention?"
   - Answer: Parse frontmatter tags

**Inconsistency:** If user deletes a tag from frontmatter but doesn't update entity.sources, they diverge.

---

### REDUNDANCY 4: Temporal Terms vs. Timeline Events

| Concept | Meaning | Storage |
|---------|---------|---------|
| **Temporal Term** | A detected time marker (word) | `DocScanResult.temporalTerms[]` |
| **Timeline Event** | A full sentence with temporal context | `TimelineEvent.sentence` |

**Problem:** Temporal terms suggest events, but no explicit link

**Current Flow:**
1. Scan document → Extract temporal terms
2. User sees suggestion in **KeyTermModal**: "Wikilink temporal terms?"
3. User reviews events in **TimelineSnapshotModal**: "Confirm these events?"
4. Events stored separately from temporal terms

**Confusion:**
- Temporal terms are metadata HINTS for event identification
- But events are FULL SENTENCES
- No bidirectional link: editing an event doesn't delete temporal term

**Example:**
```
Temporal terms extracted: ["then", "past", "after"]
Events suggested (sentences containing temporal terms):
  - "Then they entered the forest" → TemportalTerms: ["then"]
  - "In the past, the city prospered" → TemporalTerms: ["past"]

User modifies event to: "Later they entered" (removes "then")
→ But temporal term "then" still exists!
```

---

### REDUNDANCY 5: Hub Entity IDs vs. Entity References

| Concept | Format | Purpose |
|---------|--------|---------|
| **HubEntry.entities** | `["ent_lucy_001", "ent_magic_003"]` | Cross-reference IDs |
| **Entity.id** | `"ent_lucy_001"` | Primary entity identifier |
| **ChildNote.entityId** | `"ent_lucy_001"` | Backlink to entity |

**Problem:** Multiple systems reference entities by ID, creating fragility

**Risk Scenarios:**
1. If entity is deleted: Hub entries become invalid references
2. If entity ID format changes: Hubs need migration
3. If entity is renamed: ID stays same, but child note name doesn't match

**Example mismatch:**
```
Entity: id="ent_lucy_001", name="Lucy"
Child note: "Lucy.md" (name-based)
Hub: "ent_lucy_001|ent_magic_003" (ID-based)

User renames entity to "Lucy Hartwell"
→ Child note should update to "Lucy Hartwell.md"?
→ But ID-based hub doesn't care
→ Filename diverges from entity name
```

---

## Part 3: Separation of Concerns Violations

### VIOLATION 1: Entity Store owns too much
**Current State:**
```typescript
class EntityStore {
  addEntity(entity: Entity)           // Create
  updateEntity(id, updates)           // Update
  getEntity(id)                       // Read
  findByName(name)                    // Search
  getAllEntities()                    // List
  persist()                           // Save to CSV
}
```

**Problem:** EntityStore is responsible for:
1. **In-memory cache** (entities Map)
2. **Index management** (partial responsibility)
3. **CSV serialization** (format-specific)
4. **File I/O** (vault operations)

**Violation:** Mixes data access, persistence, and format concerns

**Example Issue:**
- To change storage from CSV to JSON: must modify EntityStore
- To add new search capability: must modify EntityStore
- To add validation: must modify EntityStore

**Better Separation:**
```
EntityStore        (In-memory cache only)
  ↓
EntityRepository   (Abstraction: CRUD interface)
  ↓
CSVPersistence     (CSV-specific format)
EntityIndex        (Search & lookup separate)
```

---

### VIOLATION 2: DocumentScanHandler does too many things
**Current State:**
```typescript
class DocumentScanHandler {
  scan(file)                          // Orchestration
  convertDocxIfNeeded()               // DOCX handling
  showKeyTermModal()                  // UI interaction
  processKeyTermSelection()           // Business logic
  wikiLinkEntities()                  // Document modification
  finalizeScan()                      // Persistence
}
```

**Problem:** Single class handles:
1. **File conversion** (DOCX → Markdown)
2. **Tokenization & extraction** (scanner logic)
3. **UI presentation** (modals)
4. **Entity persistence** (CSV writes)
5. **Document modification** (wikilink injection)
6. **Logging** (multiple audit trails)

**Violation:** God object; hard to test in isolation; hard to reuse components

**Better Separation:**
```
DocxConverter         (DOCX → Markdown)
TokenExtractor        (Scanning logic)
ScanOrchestrator      (Workflow coordination)
KeyTermPresenter      (UI layer)
EntityPersister       (Save entities)
DocumentModifier      (Wikilink injection)
```

---

### VIOLATION 3: Modal handlers duplicate orchestration
**Current State:**
```typescript
// modalHandlers.ts
async function handleMetadataReview(...)  {
  // Opens modal
  // Waits for user
  // Creates folders
  // Creates parent notes
  // Updates source docs
  // Logs action
  // Saves glossary
}
```

**Problem:** Modal handler is also a business logic orchestrator

**Responsibilities (should be separate):**
1. **UI** (show modal, wait for input)
2. **Folder management** (create folders)
3. **Note creation** (write parent/child files)
4. **Tagging logic** (update frontmatter)
5. **Persistence** (save glossary)
6. **Logging** (audit trail)

**Violation:** Mixes UI coordination with business logic

**Example Issue:**
- To test group creation logic: must mock entire modal
- To create groups programmatically: can't reuse logic, must re-implement
- To add new actions on group creation: must modify handler

**Better Separation:**
```
MetadataReviewModal       (UI only: display, input handling)
GroupOrchestrator         (Business logic: coordinate group operations)
FolderManager             (Create/rename folders)
NoteFactory               (Create parent/child notes)
TagManager                (Update tags)
GlossaryBuilder           (Build glossary)
```

---

## Part 4: Terminology Naming Inconsistencies

### Issue 1: "Key Term" vs. "Entity"
**In User Goals:**
- "key term selection modal"
- "every keyterm should be wikilinked"
- "master metadata for each keyterm"

**In Code:**
- Interface: `Entity` (not `KeyTerm`)
- Class: `KeyTermModal` ✓ (consistent)
- Variable: `keyTermIds` ✓ (consistent)
- Storage: "master-entities.csv" (uses "entities", not "terms")

**Confusion:** Terms used interchangeably but no formal distinction

---

### Issue 2: "Group" vs. "EntityGroup"
**Code:**
```typescript
// In types.ts
interface Group { ... }        // Canonical

// In metadataReviewModal.ts
interface EntityGroup { ... }  // Local variant

// Different field names!
Group {
  id, name, folder, keyTermIds, tags, createdAt
}

EntityGroup {
  name, folderPath, entities, tags, isConfirmed
}
```

**Problem:** Two similar interfaces with incompatible fields

**Confusion:**
- Converting Group ↔ EntityGroup requires manual mapping
- Properties have different names (keyTermIds vs. entities, folder vs. folderPath)
- isConfirmed field only in EntityGroup

---

### Issue 3: "Temporal Term" (singular) vs. "Temporal Tags" (plural)
**In Code:**
```typescript
// Storage
interface TemporalTerm { term, position, lineNumber, frequency }
interface DocScanResult { temporalTerms: TemporalTerm[] }

// But also:
function generateTemporalTags(terms: TemporalTerm[]): string[] {
  // Returns array of tag strings like ["past", "present"]
}

// Stored as:
frontmatter {
  temporal_tags: ["past", "present"]  // Different naming!
}
```

**Naming:** "Term" vs. "Tag" – same concept, two names

**Issue:** Unclear which is canonical:
- `TemporalTerm` interface vs.
- `temporal_tags` frontmatter field

---

### Issue 4: "Source" vs. "SourceRef" vs. "Source Document"
**Uses:**
```typescript
// As reference
interface SourceRef {
  document: string;
  lineNumbers: number[];
}

// As string (in hub)
entities: string[];                    // But called what?
sources: string[];                     // Sometimes this

// In documents
sourceDocument?: string;               // In TimelineEvent
source: { document, line };           // In TimelineEvent
```

**Confusion:** Multiple ways to reference the same concept

---

### Issue 5: "Snapshot" vs. "Timeline"
**Uses:**
```typescript
interface SnapshotTimeline { ... }     // Document-scoped
interface MasterTimeline { ... }       // Global

// But UI refers to?
"Timeline View"   // Is this master or snapshot?
"Timeline Editor" // Which one?
"Timeline Modal"  // Which one?
```

**Unclear:** Without context, doesn't know which timeline concept is meant

---

## Part 5: Data Ownership & State Management Gaps

### Gap 1: Who owns Group state?
**Current:**
- Entity.group field references group name (string)
- Group object exists (partially) in folder structure
- Parent note contains keyTermIds list

**Problem:** No single owner

**Cascade Issues:**
- If group is renamed: Entity.group must update (no mechanism)
- If group is deleted: References become orphaned (no cleanup)
- If parent note is deleted: Group becomes invisible (but entities still reference it)

---

### Gap 2: Who owns Child Note state?
**Created from:** Entity + Group

**Owned by:**
- ChildNote.entityId → Entity
- ChildNote.parentId → Parent Note (← Group)

**Problem:** If entity is deleted, child note becomes orphan

**Current handling:**
- No cascading delete
- No validation that entity/parent still exist
- No sync mechanism

---

### Gap 3: Who owns Hub state?
**Created from:** Entity pairs + co-occurrence frequency

**Problem:** Hub is self-contained; doesn't update if entities change

**Cascade Issues:**
- If entity is renamed: Hub ID becomes stale (but still refers to entity.id, so might work)
- If entity is deleted: Hub entry becomes ghost reference
- If entity frequencies change: Hub frequency values don't update

---

## Part 6: Summary & Recommendations

### Terminology Consolidation

| Issue | Current | Recommended |
|-------|---------|-------------|
| Token vs Key Term vs Entity | Three names | Use "Entity" with state: raw → selected → confirmed |
| Group vs Folder vs Parent Note | Three concepts | Define Group formally, store canonical data |
| Temporal Term vs Timeline Event | Two separate concepts | Create explicit connection (event.temporalTermIds?) |
| Source vs SourceRef | Different formats | Standardize on SourceRef interface everywhere |
| KeyTermIds vs Entities | Field name variance | Standardize on entityIds |

### Separation of Concerns - v1.1 Status

**Already Implemented (v1.0):**
1. ✅ **Data Layer:** EntityStore (working)
2. ✅ **Business Logic:** DocumentScanHandler (already refactored)
3. ✅ **Persistence:** CSV format (stable)
4. ✅ **UI Layer:** Modals + Views (functional)
5. ✅ **Protocol:** Logging system (comprehensive)

**Improvements for v1.1:**
- Add MetadataReviewHandler (already structured in code)
- Add GroupManager service (new - handles groups.json)
- Add EntityDeletionManager (new - cascade cleanup)

### v1.1 Implementation Roadmap

**MUST DO (Data Integrity):**
1. **Create explicit Group storage** – Add `groups.json` with canonical group metadata
   - Fixes: Group fragmentation, orphaned references
   - Effort: 2-3 hours
   - Risk: Medium (migration needed)

2. **Implement entity deletion** – Add `EntityDeletionManager` with cascade cleanup
   - Fixes: Orphaned child notes, stale hub entries
   - Effort: 3-4 hours
   - Risk: High (must be thorough)

3. **Add validation layer** – Verify group/parent references exist on load
   - Fixes: Data corruption detection
   - Effort: 1-2 hours
   - Risk: Low

**SHOULD DO (Architecture):**
4. **Add GroupManager service** – Coordinate group operations
5. **Refactor remaining handlers** – Follow DocumentScanHandler pattern

**COULD DO (v1.2+):**
6. State transitions (Token → Entity)
7. Bidirectional linking (Hub update on rename)
8. Temporal term ↔ event linkage

### v1.1 Migration Strategy

| Component | v1.0 State | v1.1 Action | Complexity |
|-----------|-----------|------------|------------|
| Entity storage | `.metadata/master-entities.csv` | Keep CSV, add groups.json | Low |
| Group storage | Implicit (folder + parent note) | Explicit groups.json | Medium |
| Entity.group field | String reference | Add validation | Low |
| Parent note frontmatter | Has keyTermIds | Keep (dual storage OK) | None |
| Document tags | Hierarchical | Add sync mechanism | Low-Medium |
| Child notes | No orphan handling | Add validation on load | Low |

**Migration Plan:**
1. Auto-generate groups.json on first v1.1 load from existing structure
2. Add validation that all groups in entities exist
3. Add orphan detection for stale child notes
4. Implement cleanup UI for orphaned files

### v1.0 Assessment (Baseline - Currently Stable)
**Why v1.0 works despite issues:**
- No entity deletion supported → Cascade issues don't manifest
- No group rename supported → Fragmentation not exploitable
- All groups created via UI → Implicit identity sufficient
- Users can't corrupt data through normal operations

### v1.1 Triggers (When to fix)
**IF we implement entity deletion → MUST add cascade cleanup (HIGH PRIORITY)**
**IF we implement group rename → MUST add explicit groups.json (HIGH PRIORITY)**
**IF data corruption reported → Add validation layer (MEDIUM PRIORITY)**

### Risk by Implementation Phase

**Phase 1 (weeks 1-2): Stabilization**
- Add explicit groups.json storage (prevents future cascading issues)
- Add validation layer (detects corruption early)
- Risk: Low (additive, no breaking changes)

**Phase 2 (weeks 3-4): Entity deletion**
- Implement EntityDeletionManager
- Add cascade cleanup
- Risk: High (must be thorough, test extensively)

**Phase 3 (v1.2+): Rename support**
- Enable entity rename
- Update bidirectional links
- Add hub staleness handling
- Risk: Medium-High (complex refactoring)

---

## Conclusion

The system has **solid high-level concepts** but suffers from:
1. **Distributed state** – Core objects (Group, Entity, ChildNote) span multiple data structures
2. **Overlapping abstractions** – Token, KeyTerm, Entity are distinct but underspecified
3. **Blurred responsibilities** – Handlers do too much; hard to test/reuse
4. **Implicit relationships** – Links between concepts exist but aren't formalized

**v1.1 Recommended Priority:**

**TIER 1 - Critical (Weeks 1-2):**
1. **P1:** Add explicit `groups.json` storage (root cause of fragmentation)
2. **P1:** Add validation layer (detect broken references)
3. **P1:** Create orphan detection on load (prevent data decay)

**TIER 2 - High (Weeks 3-4):**
4. **P2:** Implement EntityDeletionManager (enable deletion feature)
5. **P2:** Add cascade cleanup (child notes + hub entries)
6. **P2:** Test deletion workflows extensively

**TIER 3 - Medium (v1.2):**
7. **P3:** Create GroupManager service (coordinate group ops)
8. **P3:** Enable entity rename (with hub update)
9. **P3:** Add bidirectional linking

**TIER 4 - Polish (v1.2+):**
10. **P4:** Refactor remaining modal handlers (follow DocumentScanHandler pattern)
11. **P4:** Consolidate terminology in UI copy
12. **P4:** Add state machine formalization

**Why this order:**
- P1 items prevent data corruption without adding new features
- P2 enables deletion (requested feature, highest risk)
- P3 improves architecture with new features
- P4 is pure polish and refactoring

---

## Conclusion - v1.1 Roadmap

### v1.0 Status: STABLE ✅
The plugin works well for v1.0 because:
- ✅ No deletion = no orphans
- ✅ No rename = no broken links
- ✅ Implicit groups = adequate
- ✅ All workflows functional
- ✅ 514 tests passing

### v1.1 Direction: ROBUSTNESS
The audit identified real issues that will matter as users add features:

**If we enable deletion in v1.1** → Must complete TIER 1 + TIER 2  
**If we enable rename in v1.1** → Must complete all TIERS  
**If we keep v1.1 feature-locked** → TIER 1 only (recommended)

### Recommended v1.1 Strategy

**Phase 1 (Stabilization):**
- Add explicit `groups.json` (TIER 1, Item 1)
- Add validation layer (TIER 1, Item 2)
- Add orphan detection (TIER 1, Item 3)
- **Outcome:** Data integrity guaranteed, but no new user features
- **Time:** 1 week
- **Risk:** Low

**Phase 2 (Enhancement) - Optional:**
- Implement entity deletion (TIER 2, Item 4)
- Add cascade cleanup (TIER 2, Item 5)
- Extensive testing
- **Outcome:** Users can delete entities safely
- **Time:** 1-2 weeks
- **Risk:** Medium-High

**Phase 3 (Polish) - v1.2:**
- Refactor handlers (TIER 3)
- Enable rename with bidirectional links (TIER 3)
- Consolidate terminology (TIER 4)
- **Outcome:** Cleaner architecture, rename support
- **Time:** 2 weeks
- **Risk:** Medium

### Key Insight
The system has **solid architecture** and **high test coverage**. The issues identified are **edge cases that don't affect normal usage**. The v1.1 roadmap adds **defensive programming** (validation, orphan detection) while **keeping feature scope tight**.

**Recommendation:** Release v1.0 now, implement TIER 1 for v1.1, defer TIER 2-4 based on user feedback.
