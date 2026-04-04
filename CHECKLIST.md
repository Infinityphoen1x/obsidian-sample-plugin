# Plugin Implementation Checklist

**Project:** Metadata Organizer for Obsidian  
**Start Date:** April 4, 2026  
**Target Completion:** ~18 weeks (6 phases)

---

## Pre-Phase Preparation

### Repository Setup

- [ ] **Update manifest.json**
  - [x] Set `isDesktopOnly: true`
  - [ ] Update `id` to unique plugin ID
  - [ ] Set `name` to "Metadata Organizer" (or chosen name)
  - [ ] Set `version` to "0.1.0"
  - [ ] Set `minAppVersion` to "0.15.0"
  - [ ] Update `description`
  - [ ] Add `author` and `authorUrl` fields

- [ ] **Update package.json**
  - [ ] Add `mammoth` for DOCX conversion (`npm install mammoth`)
  - [ ] Add `papaparse` for CSV parsing (optional, if library preferred)
  - [ ] Verify esbuild config includes new dependencies

- [ ] **Create initial TypeScript files**
  - [ ] Create `src/types.ts` with all interfaces
  - [ ] Create `src/settings.ts` with PluginSettings
  - [ ] Update `src/main.ts` with plugin lifecycle hooks

- [ ] **Create directory structure**
  - [ ] `src/core/metadata/`
  - [ ] `src/core/scanner/`
  - [ ] `src/ui/commands/`
  - [ ] `src/ui/views/`
  - [ ] `src/ui/modals/`
  - [ ] `src/ui/components/`
  - [ ] `src/protocol/`
  - [ ] `src/utils/`
  - [ ] `src/migrations/`

- [ ] **Create module stubs** (with TypeScript interfaces, no implementation)
  - [ ] `src/core/metadata/entityStore.ts`
  - [ ] `src/core/metadata/indexFile.ts`
  - [ ] `src/core/metadata/masterMetadata.ts`
  - [ ] `src/core/scanner/documentScanner.ts`
  - [ ] `src/core/scanner/tokenizer.ts`
  - [ ] `src/core/scanner/temporalTagger.ts`
  - [ ] `src/core/scanner/docxConverter.ts`
  - [ ] `src/utils/idGenerator.ts`
  - [ ] `src/utils/csvParser.ts`
  - [ ] `src/utils/wikilinker.ts`
  - [ ] `src/utils/validators.ts`
  - [ ] `src/utils/helpers.ts`
  - [ ] `src/protocol/protocolManager.ts`
  - [ ] `src/protocol/logManager.ts`
  - [ ] `src/protocol/fileStructure.ts`

- [ ] **Test build**
  - [ ] Run `npm run build` successfully
  - [ ] Verify no TypeScript errors
  - [ ] Check `main.js` and `manifest.json` generated correctly

---

## Phase 1: Foundation (Weeks 1–3)

### 1.1 Entity ID Generation

- [ ] **Implement `idGenerator.ts`**
  - [ ] Create `generateEntityId(term: string, timestamp: number): string` function
  - [ ] Format: `ent_[6-char hash]_[4-digit sequence]`
  - [ ] Add unit tests for determinism (same input = same output)
  - [ ] Test collision avoidance
  - [ ] Export helper: `hashTerm(term: string): string`

- [ ] **Test & verify**
  - [ ] `generateEntityId("Lucy", 1712250000)` deterministic
  - [ ] `generateEntityId("lucy", 1712250000)` case-insensitive hash
  - [ ] IDs sortable by creation time

### 1.2 CSV Storage & Index File

- [ ] **Implement `csvParser.ts`**
  - [ ] `readCSV(content: string): Entity[]` parser
  - [ ] `writeCSV(entities: Entity[]): string` serializer
  - [ ] Escape special characters (commas, quotes, pipes)
  - [ ] Handle arrays in CSV (pipe-delimited tags/sources)

- [ ] **Implement `indexFile.ts`**
  - [ ] `buildIndex(entities: Entity[]): MasterMetadataIndex`
  - [ ] In-memory Maps: `nameToId`, `canonicalToNames`, `groupIndex`
  - [ ] `saveIndex(vault: Vault, index: MasterMetadataIndex): Promise<void>`
  - [ ] `loadIndex(vault: Vault): Promise<MasterMetadataIndex>`
  - [ ] Add version field for future migrations

- [ ] **Implement `entityStore.ts`**
  - [ ] `class EntityStore` manages entities + in-memory cache
  - [ ] `addEntity(entity: Entity): void`
  - [ ] `updateEntity(id: string, updates: Partial<Entity>): void`
  - [ ] `getEntity(id: string): Entity | null`
  - [ ] `findByName(name: string): Entity | null`
  - [ ] `getAllEntities(): Entity[]`
  - [ ] `persist(vault: Vault): Promise<void>` (write CSV + index)

- [ ] **Test & verify**
  - [ ] Write 10 sample entities to CSV, read back identical
  - [ ] Index lookup: name → ID instant
  - [ ] Index persistence: survives plugin reload

### 1.3 Protocol Folder Setup

- [ ] **Implement `protocolManager.ts`**
  - [ ] `initializeProtocolFolder(vault: Vault, folderName: string): Promise<void>`
  - [ ] Create `.metadata/` folder
  - [ ] Create `.metadata/logs/` subfolders
  - [ ] Create empty `master-entities.csv`
  - [ ] Create empty `index.json`
  - [ ] `ensureStructure(vault: Vault): Promise<void>` (idempotent)

- [ ] **Implement `logManager.ts`**
  - [ ] `log(category: string, message: string, data?: object): Promise<void>`
  - [ ] Auto-create dated log files in `.metadata/logs/[category]/`
  - [ ] Format: Markdown with frontmatter + content
  - [ ] Categories: `document-scanning`, `metadata-review`, `sub-metadata-review`, `description-edits`, `timeline-edits`

- [ ] **Test & verify**
  - [ ] Protocol folder created with all subfolders
  - [ ] Log files created and readable
  - [ ] CSV/index files writable

### 1.4 Document Scanner - Text Extraction

- [ ] **Implement `tokenizer.ts`**
  - [ ] `extractTokens(text: string): Token[]` interface
  - [ ] Split into words, filter stop words (the, a, and, etc.)
  - [ ] Frequency count of tokens
  - [ ] Return sorted by frequency (descending)
  - [ ] Test on sample markdown (Chapter 1, ~5000 words)

- [ ] **Implement `temporalTagger.ts`**
  - [ ] Regex patterns for temporal terms: `then`, `before`, `after`, `past`, `future`, `once`, `present`, `yesterday`, `tomorrow`, etc.
  - [ ] `extractTemporalTerms(text: string): TemporalTerm[]` with positions
  - [ ] Create wikilinks: `[[then]]`, `[[before]]`, etc.
  - [ ] Generate temporal tags for frontmatter
  - [ ] Test on sample text with temporal markers

- [ ] **Implement `documentScanner.ts`**
  - [ ] `scanMarkdown(file: TFile): DocScanResult`
  - [ ] Detect if document is a "chapter" (heuristics: filename, low-complexity words, prose-only)
  - [ ] Extract tokens (call `tokenizer`)
  - [ ] Extract temporal terms (call `temporalTagger`)
  - [ ] Check for chapter keywords: CH, Chapter, Part, Act, Episode
  - [ ] Return: tokens, temporal terms, is_chapter flag

- [ ] **Implement frontmatter generation**
  - [ ] `generateFrontmatter(scanResult): FrontmatterObject`
  - [ ] Fields: `type`, `name`, `scanned_date`, `is_chapter`, `temporal_tags`, `word_count`
  - [ ] Return as YAML string to prepend to markdown

- [ ] **Test & verify**
  - [ ] Scan sample markdown file
  - [ ] Extract 100+ unique tokens
  - [ ] Temporal terms detected and wikilinked
  - [ ] Frontmatter generated correctly

### 1.5 Main Plugin Integration

- [ ] **Update `src/main.ts`**
  - [ ] Extend `Plugin` class with settings loading
  - [ ] `onload()`: Initialize protocol folder, load index, register "New Scan" command
  - [ ] `onunload()`: Unregister listeners, save state
  - [ ] Add `this.settings` property with type safety

- [ ] **Create initial command stub**
  - [ ] Command ID: `scan-document`
  - [ ] Command name: "Scan document for metadata"
  - [ ] Placeholder callback (no-op for now)

- [ ] **Update `src/settings.ts`**
  - [ ] Implement `PluginSettings` interface
  - [ ] Export `DEFAULT_SETTINGS`
  - [ ] Create settings UI (basic form in Phase 2)

- [ ] **Test plugin loads**
  - [ ] Run `npm run dev`
  - [ ] Plugin appears in Obsidian
  - [ ] No console errors
  - [ ] Protocol folder created on first load

### 1.6 Phase 1 Verification

- [ ] **Build & bundle**
  - [ ] `npm run build` succeeds
  - [ ] `main.js` and `manifest.json` generated
  - [ ] No TypeScript errors

- [ ] **Manual testing in dev vault**
  - [ ] Copy `main.js`, `manifest.json`, `styles.css` to test vault
  - [ ] Enable plugin in Obsidian
  - [ ] Verify protocol folder created
  - [ ] Manually test entity creation
  - [ ] Verify CSV + index files generate correctly

- [ ] **Commit Phase 1**
  - [ ] Git commit with message: "Phase 1: Foundation - scanner, CSV storage, protocol folder"
  - [ ] Tag: `v0.1.0-phase1`

---

## Phase 2: Metadata Review Modal (Weeks 4–6)

### 2.1 Key Term Selection Modal

- [ ] **Implement `keyTermModal.ts`**
  - [ ] `class KeyTermModal extends Modal`
  - [ ] Render suggested terms in chunks (50–200 per page)
  - [ ] Display `m/n` counter (current page / total pages)
  - [ ] Render checkboxes for each term
  - [ ] Buttons: `Select All`, `Deselect All`, `Previous`, `Next`, `Apply`, `Cancel`
  - [ ] Styling with Obsidian CSS

- [ ] **Implement chunking logic**
  - [ ] Calculate total chunks based on term count
  - [ ] Load chunk `i` on demand
  - [ ] Persist selections across page navigation
  - [ ] State stored in Modal object (temporary)

- [ ] **Implement Apply functionality**
  - [ ] Collect all selected terms
  - [ ] Create Entity for each selected term
  - [ ] Inject wikilinks into source markdown (call `wikilinker`)
  - [ ] Log to protocol folder

- [ ] **Test & verify**
  - [ ] Modal displays 100+ terms properly
  - [ ] Pagination works (prev/next)
  - [ ] Apply creates entities
  - [ ] Cancel exits without changes

### 2.2 Wikilink Injection

- [ ] **Implement `wikilinker.ts`**
  - [ ] `injectWikilinks(text: string, terms: string[]): string`
  - [ ] For each term, find all occurrences (case-insensitive, word boundary)
  - [ ] Wrap in `[[term]]` (but not if already wikilinked)
  - [ ] Handle aliases in wikilinks (if applicable)
  - [ ] Return modified text

- [ ] **Implement `updateSourceMarkdown(file: TFile, entity: Entity[])`**
  - [ ] Read file content
  - [ ] Call `injectWikilinks`
  - [ ] Prepend/update frontmatter
  - [ ] Write back to file

- [ ] **Test & verify**
  - [ ] Wikilink all occurrences of a term
  - [ ] Don't double-link already linked terms
  - [ ] Frontmatter updated on source file

### 2.3 Master Metadata Persistence

- [ ] **Implement `masterMetadata.ts`**
  - [ ] `class MasterMetadata`
  - [ ] `addEntities(entities: Entity[]): void`
  - [ ] Update frequency counts if entity already exists
  - [ ] Update sources with new document
  - [ ] `persist(): Promise<void>` (save CSV + index)

- [ ] **Implement merge logic**
  - [ ] When scanning new document: check if term exists in index
  - [ ] If exists: increment frequency, add sources
  - [ ] If new: add as new Entity
  - [ ] Never overwrite existing data unless explicitly requested

- [ ] **Test & verify**
  - [ ] Scan document A: 50 entities created
  - [ ] Scan document B: 30 new + 20 duplicates
  - [ ] Master metadata now has 80 unique entities
  - [ ] Frequency counts correct (50 from A + 20 from B = 70 for duplicates)

### 2.4 Group Organization & Parent Notes

- [ ] **Implement group management**
  - [ ] `createGroup(name: string, folder: string, entities: Entity[]): Group`
  - [ ] Create folder in vault at specified path
  - [ ] Store group metadata in index

- [ ] **Implement parent note generation**
  - [ ] `generateParentNote(group: Group): TFile`
  - [ ] File name: same as group name
  - [ ] File location: group folder
  - [ ] Content: table with entity names (wikilinked) + source links
  - [ ] Frontmatter: type="parent", groupId, keyTermIds, tags

- [ ] **Implement metadata review modal**
  - [ ] `class MetadataReviewModal extends Modal`
  - [ ] Chunked display of entities from current page
  - [ ] Group creation UI: text box (group name) + folder combobox
  - [ ] Buttons to add/remove entities from group
  - [ ] Tag management section
  - [ ] Footer: `Previous`, `Next`, `Apply`, `Cancel`

- [ ] **Test & verify**
  - [ ] Create group "Characters" with 5 entities
  - [ ] Parent note generated with correct table
  - [ ] Frontmatter created properly
  - [ ] Clicking entity in parent note goes to source document

### 2.5 Phase 2 Verification

- [ ] **Integration test**
  - [ ] Scan document with 80 unique terms
  - [ ] Select 30 as key terms
  - [ ] Create 2 groups: Characters (15 terms), Locations (15 terms)
  - [ ] Parent notes created in correct folders
  - [ ] Master metadata persisted

- [ ] **Commit Phase 2**
  - [ ] Git commit: "Phase 2: Metadata review - modals, grouping, parent notes"
  - [ ] Tag: `v0.1.0-phase2`

---

## Phase 3: Sub-Metadata & Linking (Weeks 7–8)

### 3.1 Auto-Fill Folder Combobox Component

- [ ] **Implement `folderCombobox.ts`**
  - [ ] `class FolderCombobox` component
  - [ ] Input field + dropdown suggestions
  - [ ] Filter folders as user types (real-time)
  - [ ] Arrow keys / scroll wheel navigation
  - [ ] Enter to select, Escape to cancel
  - [ ] Show folder path in dropdown (e.g., `Characters/` or `Locations/Magic/`)

- [ ] **Test & verify**
  - [ ] Type "Char" → shows "Characters/" + variants
  - [ ] Scroll wheel changes selection
  - [ ] Enter selects folder, updates input

### 3.2 Child Note Creation Modal

- [ ] **Implement `subMetadataModal.ts`**
  - [ ] `class SubMetadataModal extends Modal`
  - [ ] Display entity name
  - [ ] List all sources (document, line numbers)
  - [ ] Folder selector (use `FolderCombobox`)
  - [ ] Text area for description (optional)
  - [ ] Buttons: `Apply`, `Cancel`

- [ ] **Implement child note generation**
  - [ ] Create markdown file: `[EntityName].md`
  - [ ] Location: selected folder
  - [ ] Frontmatter: type="child", parentId, entityId, tags
  - [ ] Content: Empty description section (user-fillable)
  - [ ] Table of all sources (document, line number)
  - [ ] Wikilink to parent note

- [ ] **Test & verify**
  - [ ] Create child note for "Lucy" in "Characters/" folder
  - [ ] File: `Characters/Lucy.md`
  - [ ] All `[[Lucy]]` links now resolve to this file

### 3.3 Description Modal & Context Menu

- [ ] **Implement context menu handler**
  - [ ] Register right-click menu for selected text
  - [ ] Add option: "Add description to entity"
  - [ ] Callback: open `descriptionModal`

- [ ] **Implement `descriptionModal.ts`**
  - [ ] `class DescriptionModal extends Modal`
  - [ ] Display: highlighted text in read-only box
  - [ ] Combobox to search for entity/note to add description to
  - [ ] Text area to edit/add description
  - [ ] Buttons: `Apply`, `Cancel`

- [ ] **Implement description persistence**
  - [ ] Update entity description in master metadata
  - [ ] Update child note content
  - [ ] Log to protocol folder

- [ ] **Test & verify**
  - [ ] Highlight text in any document
  - [ ] Right-click → "Add description to entity"
  - [ ] Select "Lucy" from combobox
  - [ ] Add descriptive text
  - [ ] Child note description updates

### 3.4 Wikilink Resolution Testing

- [ ] **Test native Obsidian linking**
  - [ ] Create child note: `Characters/Lucy.md`
  - [ ] Click `[[Lucy]]` in source document
  - [ ] Verify: navigates to `Characters/Lucy.md`
  - [ ] Verify: hover preview shows description

- [ ] **Test unlinked mention workflow**
  - [ ] Create wikilink to non-existent term: `[[UnknownTerm]]`
  - [ ] Obsidian shows "unlinked mention"
  - [ ] Create child note: `UnknownTerm.md`
  - [ ] Verify: link now resolves

### 3.5 Phase 3 Verification

- [ ] **Integration test**
  - [ ] Complete Phase 2 workflow
  - [ ] Create 5 child notes via sub-metadata modal
  - [ ] Verify all links resolve
  - [ ] Add descriptions to 3 entities
  - [ ] Verify descriptions persist

- [ ] **Commit Phase 3**
  - [ ] Git commit: "Phase 3: Sub-metadata - child notes, linking, descriptions"
  - [ ] Tag: `v0.1.0-phase3`

---

## Phase 4: Timeline UI (Weeks 9–12)

### 4.1 Event Extraction & Timeline Modal

- [ ] **Extract events from temporal terms**
  - [ ] For each temporal term in source document
  - [ ] Extract full sentence containing term
  - [ ] Store: sentence, document, line number, temporal terms
  - [ ] Return as `TimelineEvent[]`

- [ ] **Implement `timelineSnapshotModal.ts`**
  - [ ] `class TimelineSnapshotModal extends Modal`
  - [ ] Display events from current document
  - [ ] Each event: sentence + reorder controls
  - [ ] Reorder method 1: Arrow buttons (▲ Up, ▼ Down)
  - [ ] Reorder method 2: Number input (current position)
  - [ ] Delete button (✕) for each event
  - [ ] Buttons: `Apply`, `Cancel`

- [ ] **Implement event reordering component**
  - [ ] `class EventReorderer`
  - [ ] `swapEvents(index1, index2): void`
  - [ ] `moveToPosition(currentIndex, newPosition): void`
  - [ ] Persist state locally during modal session
  - [ ] On Apply: save to JSON file

- [ ] **Test & verify**
  - [ ] Extract 10 events from sample chapter
  - [ ] Reorder using arrows (verify order changes)
  - [ ] Reorder using number input
  - [ ] Apply persists order to timeline JSON

### 4.2 Master Timeline Panel View

- [ ] **Implement `timelineView.ts`**
  - [ ] `class TimelineView extends ItemView`
  - [ ] Register as custom view type: `timeline-view`
  - [ ] Display master timeline in app panel (top-right or custom location)
  - [ ] Show all snapshot timelines as collapsible sections
  - [ ] Each event: sentence + source link

- [ ] **Implement master timeline management**
  - [ ] `class MasterTimeline`
  - [ ] `addSnapshot(snapshot: SnapshotTimeline): void`
  - [ ] `removeSnapshot(id: string): void`
  - [ ] Order snapshots
  - [ ] Persist to `master-timeline.json`

- [ ] **Implement timeline rendering**
  - [ ] `class TimelineRenderer`
  - [ ] Render events as vertical/horizontal timeline
  - [ ] Use HTML/CSS (no external library)
  - [ ] Show event text + source link
  - [ ] Clickable events

- [ ] **Test & verify**
  - [ ] View panel opens and displays
  - [ ] Snapshots load correctly
  - [ ] Events clickable, navigate to source

### 4.3 Event Color Coding

- [ ] **Implement color picker component**
  - [ ] `class ColorPicker` (simple hex input or preset buttons)
  - [ ] Preset colors: red, blue, green, yellow, orange, purple
  - [ ] Or custom hex input

- [ ] **Add color to events**
  - [ ] `TimelineEvent.color?: string` field
  - [ ] Right-click event → "Set color"
  - [ ] Apply color to UI
  - [ ] Persist to JSON

- [ ] **Test & verify**
  - [ ] Color event, reload plugin, color persists
  - [ ] Color picker accessible

### 4.4 Timeline JSON Persistence

- [ ] **Implement timeline file structure**
  - [ ] File: `.metadata/master-timeline.json`
  - [ ] Schema: `{ snapshots: SnapshotTimeline[], version: 1 }`
  - [ ] Each snapshot: events, creation date, source document

- [ ] **Implement save/load**
  - [ ] `saveTimeline(timeline: MasterTimeline): Promise<void>`
  - [ ] `loadTimeline(vault: Vault): Promise<MasterTimeline>`
  - [ ] Idempotent writes

- [ ] **Test & verify**
  - [ ] Create snapshot, plugin reload, snapshot persists
  - [ ] Modify event order, save, reload, order preserved

### 4.5 Phase 4 Verification

- [ ] **Integration test**
  - [ ] Scan chapter → generate timeline
  - [ ] Create 2+ snapshots
  - [ ] Reorder events in snapshots
  - [ ] Add colors to events
  - [ ] View persists and displays correctly
  - [ ] Plugin reload: all data intact

- [ ] **Commit Phase 4**
  - [ ] Git commit: "Phase 4: Timeline UI - events, snapshots, rendering, persistence"
  - [ ] Tag: `v0.1.0-phase4`

---

## Phase 5: Hub, Glossary, Logs (Weeks 13–15)

### 5.1 Hub Cross-Reference Generation

- [ ] **Implement co-occurrence detection**
  - [ ] For each sentence in scanned document
  - [ ] Find all entities mentioned
  - [ ] If 2+ entities in same sentence: create HubEntry
  - [ ] Track frequency of each pair

- [ ] **Implement hub persistence**
  - [ ] File: `.metadata/hub-cross-references.csv`
  - [ ] Schema: `id,entities,frequency,sources`
  - [ ] Append new entries, update frequency on rescans

- [ ] **Test & verify**
  - [ ] Scan chapter with "Lucy" and "Magic" in same sentence 5 times
  - [ ] Hub entry: "Lucy + Magic", frequency=5
  - [ ] Rescan: frequency updates correctly

### 5.2 Glossary Tree Rendering

- [ ] **Implement glossary structure**
  - [ ] File: `.metadata/glossary.json`
  - [ ] Folder tree with all entity descriptions
  - [ ] Format: nested JSON matching folder structure

- [ ] **Implement glossary UI**
  - [ ] Create command: "Open glossary"
  - [ ] Display tree view in modal or panel
  - [ ] Click entry → show full entity + description

- [ ] **Test & verify**
  - [ ] Glossary displays all groups correctly
  - [ ] Descriptions accessible
  - [ ] Folder hierarchy preserved

### 5.3 Comprehensive Logging

- [ ] **Expand `logManager.ts`**
  - [ ] Log all major operations:
    - Document scanning (terms found, entities created)
    - Metadata review (groups created, entities added)
    - Sub-metadata review (child notes created)
    - Description edits (timestamp, before/after)
    - Timeline edits (event reordered, color changed)
  - [ ] Log format: Markdown frontmatter + structured content
  - [ ] Include user, timestamp, operation type, details

- [ ] **Create audit trail**
  - [ ] Logs are read-only (archived)
  - [ ] All changes traceable
  - [ ] Can review history of metadata evolution

- [ ] **Test & verify**
  - [ ] Each operation creates log entry
  - [ ] Logs readable and accurate
  - [ ] No sensitive data logged

### 5.4 Mobile Fallback Warnings

- [ ] **Implement mobile detection**
  - [ ] On plugin load: check `Platform.isMobile`
  - [ ] If mobile: show warning notice
  - [ ] Update settings: `timelineMode = 'static'`

- [ ] **Implement static timeline fallback**
  - [ ] For mobile: disable drag-drop
  - [ ] Show arrow buttons + number input only
  - [ ] Verify UX on mobile device

- [ ] **Test & verify**
  - [ ] Test on iOS Obsidian vault (if available)
  - [ ] Verify warning shows
  - [ ] Verify reordering still works (arrows/numbers)

### 5.5 Phase 5 Verification

- [ ] **Integration test**
  - [ ] Complete Phases 1–5
  - [ ] Scan 3 documents
  - [ ] Create groups, parent/child notes
  - [ ] Generate timeline, reorder events
  - [ ] Verify hub entries created
  - [ ] Glossary displays all entities
  - [ ] All logs in protocol folder

- [ ] **Commit Phase 5**
  - [ ] Git commit: "Phase 5: Hub, glossary, logging, mobile fallbacks"
  - [ ] Tag: `v0.1.0-phase5`

---

## Phase 6: Polish & Testing (Weeks 16–18)

### 6.1 Error Handling & Recovery

- [ ] **Implement error boundaries**
  - [ ] Try/catch around all file I/O
  - [ ] Graceful error messages to user
  - [ ] Log errors to protocol folder

- [ ] **Implement recovery mechanisms**
  - [ ] Save modal state to temp file
  - [ ] If plugin crashes mid-modal: recover state on reload
  - [ ] Rollback partial changes if operation fails

- [ ] **Test edge cases**
  - [ ] Very large documents (50k+ words)
  - [ ] 10,000+ unique entities
  - [ ] Deeply nested folder structures
  - [ ] Special characters in entity names
  - [ ] Concurrent operations (if applicable)

### 6.2 Performance Optimization

- [ ] **Profile and optimize**
  - [ ] Measure scan time on large documents
  - [ ] Index lookup should be <10ms
  - [ ] Modal chunk rendering should be <100ms
  - [ ] Timeline rendering <200ms

- [ ] **Implement caching**
  - [ ] Cache frequently accessed indices
  - [ ] Lazy-load entity descriptions
  - [ ] Debounce modal searches

- [ ] **Optimize bundle size**
  - [ ] Check esbuild output size
  - [ ] Remove unnecessary dependencies
  - [ ] Tree-shake unused code

- [ ] **Test & verify**
  - [ ] Plugin startup < 1 second
  - [ ] Scan 50k-word document < 5 seconds
  - [ ] Main.js size < 500KB

### 6.3 Mobile Testing & Fallbacks

- [ ] **Test on iOS Obsidian**
  - [ ] Plugin loads and runs
  - [ ] No UI elements cut off or unreadable
  - [ ] Buttons clickable in mobile layout
  - [ ] Reordering works with arrows/numbers

- [ ] **Test on Android Obsidian**
  - [ ] Plugin loads and runs
  - [ ] UI responsive on various screen sizes
  - [ ] Combobox auto-fill works on mobile keyboard

- [ ] **Verify desktop-only flag**
  - [ ] Plugin only shows on desktop vault
  - [ ] Warning message on mobile vault

### 6.4 Documentation & Release

- [ ] **Write user documentation**
  - [ ] README.md with usage guide
  - [ ] Screenshots/GIFs of main workflows
  - [ ] Troubleshooting section
  - [ ] FAQ

- [ ] **Create release artifacts**
  - [ ] `main.js` built
  - [ ] `manifest.json` verified
  - [ ] `styles.css` (if any custom styles added)

- [ ] **Final build & test**
  - [ ] `npm run build` succeeds
  - [ ] Install in fresh Obsidian vault
  - [ ] Full workflow test: scan → group → timeline → publish

- [ ] **Create GitHub release**
  - [ ] Tag: `v0.1.0` (matches manifest.json)
  - [ ] Attach `main.js`, `manifest.json`, `styles.css`
  - [ ] Add release notes
  - [ ] Copy `manifest.json` to `versions.json` for version mapping

### 6.5 Final Verification

- [ ] **Checklist before release**
  - [ ] All phases complete and tested
  - [ ] No console errors or warnings
  - [ ] Plugin settings load/save correctly
  - [ ] Protocol folder created and functional
  - [ ] All commands registered and working
  - [ ] Mobile warning displays on mobile
  - [ ] Built bundle size acceptable

- [ ] **Commit & Tag Phase 6**
  - [ ] Git commit: "Phase 6: Polish, testing, documentation, release"
  - [ ] Tag: `v0.1.0`
  - [ ] Mark as "ready for public release"

---

## Post-Release: Future Enhancements

- [ ] Convert `batchlinkr.py` to TypeScript (optional)
- [ ] Mermaid diagram export for timelines
- [ ] Advanced search/filter for entities
- [ ] Bulk import from existing vaults
- [ ] Export to JSON/CSV formats
- [ ] Theme customization
- [ ] Community plugin catalog submission

---

## Quick Status Tracker

| Phase | Status | Est. Weeks |
|-------|--------|-----------|
| Pre-Phase Setup | ⏳ In Progress | Week 0 |
| Phase 1: Foundation | ⬜ Not Started | Weeks 1–3 |
| Phase 2: Metadata Review | ⬜ Not Started | Weeks 4–6 |
| Phase 3: Sub-Metadata | ⬜ Not Started | Weeks 7–8 |
| Phase 4: Timeline UI | ⬜ Not Started | Weeks 9–12 |
| Phase 5: Hub/Glossary/Logs | ⬜ Not Started | Weeks 13–15 |
| Phase 6: Polish & Release | ⬜ Not Started | Weeks 16–18 |

**Total Project Duration:** ~18 weeks (4.5 months)

---

**Notes:**
- Each task is executable and has clear pass/fail criteria
- Commit after each phase for version control
- Run tests frequently to catch issues early
- Document decisions as they're made in repository memory
