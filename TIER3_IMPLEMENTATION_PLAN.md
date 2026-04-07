# TIER 3 Implementation Plan - UI Features

## Overview
**Status**: Pre-implementation planning  
**Scope**: Master Timeline UI + Main Panel UI  
**Estimated Duration**: 8-12 hours  
**Risk Level**: Medium (UI-heavy, mostly visual components)

---

## TIER 3 Breakdown

### 1. Main Panel UI (Priority 1 - Simpler)
**File**: `src/ui/views/mainPanelView.ts`  
**Est. Time**: 2-3 hours

#### Features:
- [ ] View container with header ("Metadata Organizer")
- [ ] Command buttons:
  - [ ] "Scan Document" (blue)
  - [ ] "Review Metadata" (purple)
  - [ ] "Create Child Notes" (green)
  - [ ] "Generate Timeline" (orange)
  - [ ] "Add Description" (gray)
- [ ] Status display section (empty/current file/stats)
- [ ] Quick stats display (entities: N, groups: N, hubs: N, timeline events: N)
- [ ] Settings toggle button (gear icon)

#### Implementation Strategy:
1. Create view class extending `ItemView`
2. Build HTML structure in `onOpen()`
3. Wire button click handlers to commands
4. Add CSS styling for buttons and layout
5. Implement status update mechanism

---

### 2. Master Timeline UI (Priority 2 - More Complex)
**Files**:
- `src/ui/views/timelineView.ts` (main container)
- `src/ui/components/timelineRenderer.ts` (Mermaid rendering)
- `src/ui/components/eventReorderer.ts` (drag-and-drop logic)

**Est. Time**: 5-7 hours

#### Features:
- [ ] Timeline view container with horizontal scrolling
- [ ] Mermaid diagram for timeline visualization
  - [ ] Events as nodes
  - [ ] Time axis as horizontal line
  - [ ] Concurrent events grouped vertically
  - [ ] Colored event markers
- [ ] Drag-and-drop event reordering
- [ ] Add/edit/delete event buttons
- [ ] Event detail panel (side panel)
- [ ] Event filtering (by document, tag, date range)
- [ ] Event color-coding

#### Implementation Strategy:
1. Create TimelineView extending ItemView
2. Implement getMermaidDiagram() to convert timeline data to Mermaid
3. Add mermaid.js library integration
4. Implement drag-and-drop handlers
5. Create event detail panel
6. Add event persistence on change

---

## File Structure

```typescript
// New files to create:
src/ui/views/
  ├── mainPanelView.ts       (NEW - Main panel UI)
  └── timelineView.ts        (UPDATE - Enhance existing)

src/ui/components/
  └── timelineRenderer.ts    (NEW - Mermaid rendering)

// Register views in main.ts:
- mainPanelView as "metadata-organizer-main"
- timelineView as "metadata-organizer-timeline"
```

---

## Data Structures

### Timeline Event (in types.ts)
```typescript
export interface TimelineEvent {
  id: string;           // ent_[hash]_[seq]
  title: string;        // Event title
  description: string;  // Event details
  sourceDoc: string;    // Source document path
  lineNumber: number;   // Line in source
  timestamp?: number;   // Epoch timestamp
  temporalTerms: string[]; // ["past", "during", "future"]
  color?: string;       // Hex color for display
  tags: string[];       // Custom tags
  createdAt: number;    // Creation timestamp
  orderedPosition: number; // Manual ordering
}

export interface Timeline {
  id: string;
  name: string;         // "Master Timeline" or "Chapter 1 Timeline"
  events: TimelineEvent[];
  createdAt: number;
  updatedAt: number;
}
```

---

## Implementation Phases

### Phase 3.1: Main Panel UI
1. [ ] Create mainPanelView.ts with view class
2. [ ] Build UI structure (buttons, status area)
3. [ ] Wire button handlers to existing commands
4. [ ] Add CSS styling
5. [ ] Test button functionality
6. [ ] Register view in main.ts

### Phase 3.2: Timeline Visualization Foundation
1. [ ] Add mermaid.js to package.json
2. [ ] Create timelineRenderer.ts component
3. [ ] Implement getMermaidDiagram() converter
4. [ ] Create timelineView with Mermaid rendering
5. [ ] Add basic event list below diagram
6. [ ] Test diagram rendering

### Phase 3.3: Timeline Interactivity
1. [ ] Implement drag-and-drop event reordering
2. [ ] Add event detail panel (side)
3. [ ] Add add/edit/delete event buttons
4. [ ] Implement event persistence
5. [ ] Add event filtering
6. [ ] Test interactivity

---

## CSS Considerations

### Main Panel
```css
.metadata-organizer-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.main-panel-header {
  font-size: 1.2rem;
  font-weight: bold;
  border-bottom: 1px solid var(--background-modifier-border);
  padding-bottom: 0.5rem;
}

.main-panel-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.main-panel-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.main-panel-stats {
  background: var(--background-secondary);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}
```

### Timeline View
```css
.timeline-container {
  display: flex;
  height: 100%;
  gap: 1rem;
}

.timeline-diagram {
  flex: 1;
  overflow-x: auto;
  border: 1px solid var(--background-modifier-border);
  padding: 1rem;
  background: var(--background-secondary);
}

.timeline-details {
  width: 300px;
  border-left: 1px solid var(--background-modifier-border);
  padding: 1rem;
  overflow-y: auto;
}

.mermaid {
  display: flex;
  justify-content: center;
  min-height: 300px;
}
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "mermaid": "^10.6.0"  // For timeline diagrams
  }
}
```

---

## Testing Plan

### Main Panel
- [ ] View registers and opens
- [ ] All buttons are clickable
- [ ] Button clicks trigger correct commands
- [ ] Status display updates on file change
- [ ] Stats are calculated correctly

### Timeline View
- [ ] View registers and opens
- [ ] Mermaid diagram renders without errors
- [ ] Events display in correct order
- [ ] Drag-and-drop changes order
- [ ] Event details panel updates on selection
- [ ] Add/edit/delete buttons work
- [ ] Colors apply correctly to events

---

## Error Handling

- [ ] Handle missing Timeline data gracefully
- [ ] Display message if no events exist
- [ ] Handle Mermaid rendering failures
- [ ] Validate event data before rendering
- [ ] Add console logging for debugging

---

## Next Steps After TIER 3

- Optional: Timeline storage conversion (CSV → JSON)
- Optional: Advanced filtering and search
- Optional: Export timeline as image
- Consider: Advanced markdown rendering in event details
- Consider: Integration with Obsidian's timeline plugin if it exists

---

## Summary

**TIER 3** adds the visual layer to the plugin:
1. **Main Panel** - Command center for user interactions
2. **Master Timeline** - Visual representation of events with Mermaid

This completes the plugin to **100% specification compliance**, adding the "quick reorganisation and instant linking" visual experience mentioned in plugingoals.md.

After TIER 3, the plugin will be:
✅ Fully functional
✅ Production-ready
✅ Feature-complete per specification
