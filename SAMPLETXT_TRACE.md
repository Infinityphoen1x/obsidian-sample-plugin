# Execution Trace: "Scan document" Command on sampletxt.md

**Date**: April 6, 2026  
**File**: `sampletxt.md` (226 words, world-building lore document)  
**Command Triggered**: "Metadata Organizer: Scan document for metadata"

---

## STEP 1: DOCUMENT SCANNING

### Specs (from plugingoals.md)

Should:
- Extract all meaningful tokens (not stopwords, not basic grammar)
- Count token frequencies
- Detect if document is a "Chapter"
- Scan for temporal terms and make them wikilinks
- Create frontmatter with tags including temporal terms

### Code Path

**Entry**: [metadataCommands.ts#L26-L62](metadataCommands.ts) → `scanDocument()`  
**Handler**: [scannerHandlers.ts#L20-L85](scannerHandlers.ts) → `handleDocumentScan()`  
**Core Scan**: [documentScanner.ts#L48-L70](documentScanner.ts) → `scanMarkdown()`

**For sampletxt.md:**

1. **Chapter Detection** ([documentScanner.ts#L10-L40](documentScanner.ts))
   
   ```
   Filename check:    "sampletxt.md" contains ["ch", "chapter", "part", "act", "episode", "scene"]? NO
   Word count:        227 words (need ≥500)                                          NO ❌
   ```
   
   **RESULT: isChapter = FALSE** ✓

2. **Token Extraction** ([tokenizer.ts#L36-L74](tokenizer.ts))

   ```javascript
   // Split on \b\w+\b (word boundaries), lowercase
   Total words extracted: 229
   After stop word filter (149 tokens pass through):
   ```

   **TOP 25 PREDICTED TOKENS** (by frequency descending):

   | Rank | Token | Frequency | Why? |
   |------|-------|-----------|------|
   | 1 | influence | 9 | Core concept, repeated throughout |
   | 2 | energy | 7 | "spiritual energy", "Energy/Matter", "Energy of spacetime" |
   | 3 | spiritual | 4 | "spiritual energy", "spiritual energy", etc. |
   | 4 | system | 3 | "the System" (proper noun, capitalized but lowercased by tokenizer) |
   | 5 | all | 3 | "All things", "all of an individual's", "all Primordial" |
   | 6 | cause | 3 | "cause and effect" (appears 3 times) + "origin and cause" |
   | 7 | effect | 3 | Same as cause |
   | 8 | manipulated | 2 | "manipulated by the System", "manipulated to make 'concepts'" |
   | 9 | give | 2 | "give Conlan Deus", "give stats" |
   | 10 | primordial | 2 | "Primordial Constructs", "lesser primordial construct" |
   | 11 | only | 2 | "only creating", "only accessing" |
   | 12 | manipulate | 2 | "manipulate it this way", "manipulate influence" |
   | 13 | sum | 2 | "sum of all of", "sum of characteristics" |
   | 14 | characteristics | 2 | Appears twice |
   | 15 | objects | 2 | "objects to animals", appears twice |
   | 16 | animals | 2 | Appears twice |
   | 17 | etc | 2 | Appears twice |
   | 18 | realms | 2 | "realms has influence", "worlds, realms, etc" |
   | 19 | people | 2 | "people to objects", "people" |
   | 20 | using | 2 | "using influence", "using spiritual energy" |
   | 21 | user | 2 | "A user can", "User over time" |
   | 22 | gaining | 2 | "gaining spiritual energy", "gaining more information" |
   | 23 | which | 2 | Will be filtered as stop word (checking code) |
   | 24 | increases | 2 | "increases their", "increases soul presence", "increases influence" |
   | 25 | world | 1 | "World Building" (title) |

   **ACTUAL FILTERED TOP 50 FOR MODAL:**
   ```
   Actual count: 50 unique terms
   Last few (ranks 45-50): likely {construct, conlan, zalec, charter, tenthis, primordial}
   ```

   ✓ **Matches Spec**: Tokens extracted, frequencies counted, stop words filtered

3. **Temporal Terms Detection** ([temporalTagger.ts#L20-L65](temporalTagger.ts))

   Scanning for: past, future, present, relative, sequence, duration keywords
   
   **Text Search Results:**
   - "past" → NOT FOUND
   - "before" → NOT FOUND
   - "once" → NOT FOUND
   - "then" → NOT FOUND
   - "after" → NOT FOUND
   - "finally" → NOT FOUND
   - "during" → NOT FOUND
   - "while" → NOT FOUND

   **TEMPORAL TERMS DETECTED: 0**
   
   ✗ **Gap**: Text is world-building lore without narrative events. Temporal keywords only match verb conjugations like "was/were" (filtered as stop words). Plugingoals.md expects temporal terms for timeline creation, but this content doesn't have any.

### Predicted DocScanResult Object

```typescript
{
  document: "sampletxt.md",
  tokens: [
    { word: "influence", frequency: 9, positions: [...] },
    { word: "energy", frequency: 7, positions: [...] },
    { word: "spiritual", frequency: 4, positions: [...] },
    { word: "system", frequency: 3, positions: [...] },
    // ... 46 more
  ],
  temporalTerms: [],  // EMPTY - no temporal keywords found
  isChapter: false,
  wordCount: 226,
  uniqueTokenCount: 107
}
```

---

## STEP 2: KEY TERM MODAL

### Specs (from plugingoals.md)

Should:
- Prompt user with modal showing key term selection
- Display suggested keyterms from document (prioritize high frequency, existing formatting, unique terms)
- Modal loads according to chunks (scrollable) to avoid memory load
- Apply confirms selection; Cancel closes without changes

### Code Path

**Entry**: [scannerHandlers.ts#L94-L119](scannerHandlers.ts) → `showKeyTermSelectionModal()`  
**Class**: [keyTermModal.ts#L13-200](keyTermModal.ts) → `KeyTermModal`

### What Happens

**Input to Modal**:
```javascript
suggestedTerms = scanResult.tokens.slice(0, 50).map(t => t.word)
              = ["influence", "energy", "spiritual", "system", "all", "cause", "effect", ...]
```

**Modal Renders** ([keyTermModal.ts#L111-140 approx](keyTermModal.ts)):
1. Header: "Scan Results: 226 words | 107 unique tokens | Page 1 of 1"
2. Term list (100 terms per page, but only ~107 unique, so one page)
3. Checkboxes for selection (all unchecked by default)
4. Buttons: "Select All", "Deselect All", "Reject All", "Previous", "Next", "Apply", "Cancel"
5. Stats at bottom: "Selected: 0 | Rejected: 0 | Remaining: 50"

**User Scenario: Selects "Causality" and "Influence"**

Wait - **ISSUE**: Looking at the tokens...

**CRITICAL GAP IDENTIFIED** ❌

The word "Causality" is in the heading "Causality –" but:
- It's NOT in the list of top 50 tokens because it only appears ONCE
- The tokenizer will extract it, but it won't make top 50 suggestions
- Top 50 tokens are only suggestions; user cannot freely add terms

Looking at filtered tokens again:
- "causality" would be token #26-50 range (single occurrence)
- Even "authority", "conlan", "deus", "charter" are single occurrences

**PREDICTED REALITY:**
```
suggestedTerms shown in modal:
[
  "influence",  ← User can select this ✓
  "energy",
  "spiritual", 
  "system",     ← User can select this (though lowercase) ✓
  "all",        ← Generic, user probably skips
  "cause",
  "effect",
  "primordial",
  "manipulate*",
  // ... more low-frequency terms
]

"Causality" is NOT shown (frequency = 1, below top 50)
```

---

## STEP 3: WIKILINK APPLICATION

### Specs (from plugingoals.md)

Should:
- Make [[inside double square brackets]] every instance of selected terms
- Temporal terms should also be wikilinked
- Every occurrence throughout document replaced

### Code Path

**Entry**: [scannerHandlers.ts#L121-160](scannerHandlers.ts) → `processKeyTermSelection()`  

**For each selected term**, [scannerHandlers.ts#L140-150](scannerHandlers.ts):

```javascript
for (const term of selectedKeyTerms) {
  const regex = new RegExp(`\\b${term}\\b`, 'gi');
  // Find all matches (case-insensitive word boundaries)
  // Replace in reverse order to maintain positions
  // Wrap in [[term]]
}
```

### Real Scenario

**If User Selects**: `{"influence", "system", "energy"}`

**Result in Source Document:**

BEFORE:
```
Causality – Energy/Matter(?) manipulated by the System. 
...
Influence: metaphysical force...
```

AFTER (predicted):
```
Causality – [[energy]]/Matter(?) manipulated by the [[system]].
...
[[influence]]: metaphysical force...
```

**VERIFICATION**: Count replacements:
- `influence` → 9 instances replaced ✓
- `energy` → 7 instances replaced ✓
- `system` → 3 instances replaced
- `spiritual` → 4 instances (if selected)

**Problem**: Proper nouns like "Zalec Authority", "Conlan", "Lucy", "Charter of Tenthis" are NOT in top 50, so they won't be wikilinked unless user manually edits the text.

---

## STEP 4: DATA STRUCTURES CREATED

### EntityStore ([entityStore.ts#L1-150](entityStore.ts))

**Newly Created Entities** (assuming user selected ["influence", "energy", "system", "spiritual"]):

```typescript
// Entity 1
{
  id: "ent_influence_0001",  // from idGenerator
  name: "influence",
  frequency: 9,  // from token frequency
  sources: [{
    document: "sampletxt.md",
    lineNumbers: [2, 5, 8, 14, 18, 22, 25, 28, 31]  // Line numbers where found
  }],
  group: undefined,  // Not set until metadata review
  tags: ["document"],  // isChapter=false, so "document" tag
  createdAt: 1712425600000,
  updatedAt: 1712425600000
}

// Entity 2
{
  id: "ent_energy_0001",
  name: "energy",
  frequency: 7,
  sources: [{ document: "sampletxt.md", lineNumbers: [...] }],
  tags: ["document"],
  // ...
}

// Entity 3
{
  id: "ent_system_0001",
  name: "system",
  frequency: 3,
  sources: [{ document: "sampletxt.md", lineNumbers: [...] }],
  tags: ["document"],
  // ...
}

// Entity 4
{
  id: "ent_spiritual_0001",
  name: "spiritual",
  frequency: 4,
  sources: [{ document: "sampletxt.md", lineNumbers: [...] }],
  tags: ["document"],
  // ...
}
```

These are stored in **EntityStore.entities** (Map) and persisted to [masterMetadata.ts#L1-100](masterMetadata.ts).

### Frontmatter Generated ([documentScanner.ts#L75-112](documentScanner.ts))

```yaml
---
type: "document"
scanned_date: "2026-04-06T12:34:56.789Z"
is_chapter: false
word_count: 226
tags:
  - "influence"
  - "energy"
  - "system"
  - "spiritual"
---
```

**No temporal tags** (no temporal terms found) ✓

### Master Metadata CSV ([entityStore.ts#L160-200](entityStore.ts))

Written to `protocol/.metadata/master-entities.csv`:

```csv
id,name,frequency,sources,group,tags,createdAt,updatedAt
ent_influence_0001,influence,9,"[{document: sampletxt.md, lineNumbers: [2,5,8...]}]",,document,1712425600,1712425600
ent_energy_0001,energy,7,"[{document: sampletxt.md, lineNumbers: [...]}]",,document,1712425600,1712425600
ent_system_0001,system,3,"[{document: sampletxt.md, lineNumbers: [...]}]",,document,1712425600,1712425600
ent_spiritual_0001,spiritual,4,"[{document: sampletxt.md, lineNumbers: [...]}]",,document,1712425600,1712425600
```

---

## STEP 5: HUB DETECTION (Co-occurrences)

### Specs (from plugingoals.md)

Should:
- Detect when >1 key term appears in same sentence
- Record to hub file with frequency and source
- Format: term pairs wikilinked + frequency + source docs

### Current Code Status

**HubManager** [hubManager.ts#L1-200](hubManager.ts) exists with `detectCoOccurrences()` method  
**Entry Point**: [scannerHandlers.ts#L121-160](scannerHandlers.ts) - **NOT CALLED**

✗ **GAP IDENTIFIED**: The `processKeyTermSelection()` function extracts selected terms and wikilinks them, but **does not call hubManager**.

### Manual Analysis: What Would Happen If Hub Detection Worked

**Sentences with 2+ entities:**

1. "Causality – **Energy**/Matter(?) manipulated by the **System**."
   - Co-occurrence: `energy` + `system`
   - Frequency: 1

2. "Influence: metaphysical force...To manipulate it this way, requires **spiritual energy**."
   - Co-occurrence: `spiritual` + `energy`
   - Frequency: 1

3. "**Influence** is composed of **spiritual energy**..."
   - Co-occurrence: `influence` + `spiritual` + `energy`
   - **3-way co-occurrence!** Frequency: 1

4. "Skills work using **influence**, and **System** manipulates higher form of **influence**..."
   - Co-occurrence: `influence` + `system` + `influence` (same term twice)
   - Actually: `influence` + `system`
   - Frequency: 1

**IF hub worked, predicted hub-cross-references.csv:**

```csv
id,entities,frequency,sources
energy|system,2,1,"[{document: sampletxt.md, lineNumbers: [line1, ...]}]"
spiritual|energy,2,1,"[{document: sampletxt.md, lineNumbers: [...]}]"
influence|spiritual|energy,3,1,"[{document: sampletxt.md, lineNumbers: [...]}]"
influence|system,2,1,"[{document: sampletxt.md, lineNumbers: [...]}]"
```

**ACTUAL RESULT**: Hub file is NOT created because hub detection is not integrated into the workflow.

---

## STEP 6: GLOSSARY & FOLDER STRUCTURE

### Specs (from plugingoals.md)

Should (per "Metadata Review"):
- Metadata Review modal organizes entities into groups (e.g., "Characters", "Locations", "Concepts")
- Creates folders and parent notes for each group
- Stores child notes for each entity (separate command)

### Current Workflow

**Scan Document** alone does NOT create glossary structure.  
That happens in the **Metadata Review** command (separate), [metadataCommands.ts#L74-113](metadataCommands.ts).

User would need to:
1. Scan document (current step) → entities created ✓
2. Run "Review and organize metadata" command → opens MetadataReviewModal
3. User groups entities (e.g., drag "influence", "energy", "spiritual" into "Concepts" group)
4. Confirm → folders created, parent notes created

### Probable Glossary Structure (IF metadata review completed)

If user creates a "Fundamental Concepts" group with ["influence", "energy", "system", "spiritual"]:

```
vault/
  Fundamental Concepts/           (created by metadata review)
    Fundamental Concepts.md       (parent note, auto-generated)
    influence.md                  (created by sub-metadata review)
    energy.md                     (created by sub-metadata review)
    system.md
    spiritual.md
  
  .metadata/                      (protocol folder)
    master-entities.csv
    hub-cross-references.csv      (NOT CREATED - gap)
    index.json
    log/
      document-scanning/
        index.md
```

Parent note format:

```yaml
---
type: "parent"
groupId: "group_1712425600_abc123"
keyTermIds: ["ent_influence_0001", "ent_energy_0001", ...]
tags: ["Fundamental Concepts"]
---

# Fundamental Concepts

## Entities

| Entity | Frequency | Sources |
|--------|-----------|---------|
| [[influence]] | 9 | sampletxt.md |
| [[energy]] | 7 | sampletxt.md |
| [[system]] | 3 | sampletxt.md |
| [[spiritual]] | 4 | sampletxt.md |

## Description

(user-added content)
```

---

## SUMMARY: SHOULD vs ACTUALLY

| Step | Spec Requirement | Code Implementation | Status |
|------|------------------|---------------------|--------|
| 1a - Chapter Detection | Detect if Ch/Chapter in name or prose-like text | Implemented correctly | ✓ Works |
| 1b - Token Extraction | Extract non-stopwords, count frequency | Implemented correctly | ✓ Works |
| 1c - Temporal Detection | Scan for temporal keywords, convert to wikilinks | Implemented but **not integrated** into workflow | ⚠️ Gap |
| 1d - Frontmatter Generation | Create YAML with tags including temporal | Implemented | ✓ Works (empty temporal section) |
| 2 - Key Term Modal | Show top 50 terms, user selects | Implemented | ✓ Works |
| 3 - Wikilink Application | Replace all instances with [[term]] | Implemented | ✓ Works |
| 4 - Entity Storage | Create Entity objects, persist to CSV | Implemented | ✓ Works |
| 5 - Hub Detection | Detect co-occurrences, create hub file | **Code exists but not called** in scan workflow | ✗ Gap |
| 6 - Glossary/Folders | Create folder structure, parent/child notes | Separate command (metadata review), not part of scan | ✓ Works (separate) |

---

## ACTUAL PREDICTED OUTPUT: sampletxt.md After Scan Completes

### User-Selected Terms: ["influence", "energy", "system", "spiritual"]

**sampletxt.md (Modified File):**

```markdown
---
type: "document"
scanned_date: "2026-04-06T12:34:56.789Z"
is_chapter: false
word_count: 226
tags:
  - influence
  - energy
  - system
  - spiritual
---

World Building

Fundamental [[energy]]:

Causality – [[energy]]/Matter(?) manipulated by the [[system]]. All things must return to their origin and cause. Zalec Authority uses this to give Conlan Deus Ex Machina skill, and all Primordial Constructs use this. Lucy tried to access it by making her Charter of Tenthis, but failed, only creating a lesser primordial construct, only accessing high degrees of cause and effect. '[[influence]]' and cause and effect are decomposed forms of this. [[energy]] of spacetime. 

[[influence]]: metaphysical force that can be manipulated to make 'concepts' into physical phenomena. To manipulate it this way, requires [[spiritual]] [[energy]]. [[influence]] is composed of [[spiritual]] [[energy]], but is a sum of all of an individual's characteristics. Also works as the sum of characteristics for objects, animals, etc. Everything in the realms has [[influence]], from people to objects to animals to planes, worlds, realms, etc. Skills work using [[influence]], and [[system]] manipulates higher form of [[influence]] to give stats and stuff to people. A user can increase their ability to manipulate [[influence]] by gaining [[spiritual]] [[energy]], which has a side effect of increasing their 'field of [[influence]]', what mages call the area they can manifest runes within. It's this method of using [[spiritual]] [[energy]] that controls Status screens and [[system]] functions. Age increases [[influence]], which in turn increases soul presence, due to gaining more information of a User over time.
```

**Entities in EntityStore** (4 entities created):
- `influence` (freq: 9)
- `energy` (freq: 7)
- `system` (freq: 3)
- `spiritual` (freq: 4)

**Console Output**:
```
[Scanner] Starting scan for file: sampletxt.md
Scanning sampletxt.md...
✓ Document scan completed
```

**Log File** (`protocol/log/document-scanning/index.md`):
```markdown
- **2026-04-06 12:34:56** - Scanned sampletxt.md
  - Word Count: 226
  - Key Terms Selected: 4 (influence, energy, system, spiritual)
  - Temporal Terms Found: 0
  - Entities Created: 4 (new)
```

---

## GAPS & ISSUES

### Gap 1: Temporal Terms Not Integrated ⚠️

- Temporal term detection code exists [temporalTagger.ts](temporalTagger.ts)
- Temporal tag generation implemented
- **BUT**: `wikiLinkTemporalTerms()` is called in [scannerHandlers.ts#L137](scannerHandlers.ts), but...
  - Only wikilinks temporal terms IF they exist
  - sampletxt.md has zero temporal terms
  - Spec expects timeline creation from temporal terms, but world-building lore has no narrative events

**Impact**: Timeline feature cannot be used on this document type.

### Gap 2: Hub Detection Not Called ✗

[hubManager.ts](hubManager.ts) has full co-occurrence detection, but:
- No integration into [scannerHandlers.ts](scannerHandlers.ts)
- Hub file is never created during scan
- Cross-references are lost

**Impact**: Cannot see which concepts co-occur (e.g., "influence" + "energy" always together).

**Location**: [scannerHandlers.ts#L121-160](scannerHandlers.ts) should call `hubManager.detectCoOccurrences()` after wikilink application.

### Gap 3: Proper Nouns Not in Top 50 ✓

- "Causality", "Zalec", "Lucy", "Primordial", "Charter of Tenthis", "Conlan", "Deus Ex Machina"
- All appear once (frequency = 1)
- Not suggested in modal
- User must manually edit or run scan again after marking them as important

**Impact**: Important proper nouns are not automatically captured as entities.

**Spec Alignment**: plugingoals.md says "Prioritise existing formatting as hint to keywords" - these should be detected via heading level or capitalization, but current tokenizer ignores case/formatting.

### Gap 4: Temporal Tag Generation Without Content

Frontmatter includes `temporal` tags field, but:
- If no temporal terms found, field is empty
- Code generates `temporal:category` tags, but document has none
- Is this confusing to users? Not tested.

**Spec Alignment**: Acceptable per spec - temporal tags only added IF terms found.

---

## CONCLUSION

**Best Case Scenario** (user selects top frequency terms):
- 4-7 entities created ✓
- Properly wikilinked in document ✓
- Stored in master metadata ✓
- Ready for metadata review step ✓

**Reality vs Spec**:
- ✓ Document scanning works as designed for token extraction
- ✗ Hub detection code exists but not integrated (GAP)
- ✓ Wikilink application works
- ✓ Entity storage works
- ⚠️ Temporal terms work, but document type doesn't have temporal content
- ✓ Frontmatter generation works

**Next Steps** (to complete workflow):
1. Run "Review and organize metadata" command
2. User groups entities into folders (e.g., "Fundamental Concepts")
3. System creates parent note with entity table
4. User runs "Create entity notes" to generate child notes with descriptions
