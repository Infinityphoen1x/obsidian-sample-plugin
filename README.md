# Timeline Metadata Manager - Obsidian Plugin

A powerful metadata management plugin for Obsidian that transforms raw documents into a rich interconnected knowledge system. Automatically extracts entities, builds timelines, generates glossaries, and creates cross-reference hubs.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Performance](#performance)
- [FAQ & Troubleshooting](#faq--troubleshooting)
- [Mobile Support](#mobile-support)
- [Release Notes](#release-notes)

## Features

### Core Capabilities

**🔍 Document Scanning & Entity Extraction**
- Automatic scanning of markdown documents for temporal references and entities
- Named Entity Recognition (NER) for persons, organizations, locations, and concepts
- Temporal expression tagging and normalization
- Customizable entity types and extraction patterns

**📅 Timeline Management**
- Create interactive timeline snapshots from documents
- Organize events along temporal axes
- Support for custom events and temporal markers
- Edit and reorder events with drag-and-drop UI
- Visual timeline rendering with color coding

**📚 Glossary Construction**
- Hierarchical glossary tree builder
- Group-based entity organization
- Automatic frequency tracking
- Search and export functionality
- Markdown-formatted glossary export

**🔗 Cross-Reference Hub**
- Co-occurrence detection across documents
- Build entity relationship networks
- Frequency-weighted connections
- Source tracking and citation management
- Entity statistics and analytics

**📊 Metadata Review Interface**
- Comprehensive metadata review modal
- Entity editing with validation
- Group assignments and relationships
- Description management
- Bulk operations support

**🎯 Key Term Management**
- Highlight and marking system
- Custom descriptions
- Temporal association
- Frequency metrics

### Advanced Features

**💾 Persistent Storage**
- CSV-based entity storage
- JSON hierarchical glossary structure
- Timeline snapshot persistence
- Cross-reference index files
- Automatic backup and recovery

**📱 Mobile Support**
- Graceful degradation on mobile devices
- Touch-friendly interfaces
- Simplified timeline mode on iOS/Android
- Responsive modal designs

**⚡ Performance**
- Optimized for large documents (50k+ words)
- Batch processing with progress tracking
- Debounced operations
- Memory-efficient data structures
- Incremental indexing

**🛡️ Error Handling & Recovery**
- Comprehensive error boundaries
- Graceful degradation on failures
- Modal state recovery
- Crash recovery mechanism
- Detailed error logging

**📈 Performance Monitoring**
- Built-in performance profiler
- Operation timing metrics
- Performance threshold warnings
- Exportable performance reports

## Quick Start

1. **Install the plugin:** Download from Obsidian Community Plugins → Enable in Settings

2. **Scan your first document:**
   - Open a markdown document
   - Run command: `Timeline: Scan Document`
   - Review extracted entities in the metadata review modal

3. **Create a timeline:**
   - Run command: `Timeline: Create Timeline Snapshot`
   - Select sentences/events to include
   - Organize them chronologically

4. **Build your glossary:**
   - Run command: `Timeline: Build Glossary`
   - Entities organized by group
   - Export as formatted markdown

5. **Explore relationships:**
   - Run command: `Timeline: Show Hub`
   - View co-occurrences
   - Analyze patterns

## Installation & Setup

See [INSTALL.md](INSTALL.md) for detailed instructions.

### Quick Setup

```bash
# Unix/Linux/macOS
bash setup.sh

# Windows
setup.bat
```

## Architecture Overview

The plugin is organized into modules:

- **core/scanner**: Document analysis and entity extraction
- **core/metadata**: Entity, timeline, glossary, and hub management
- **protocol**: Logging, state recovery, and file organization
- **ui**: Commands, modals, views, and components
- **utils**: Error handling, performance logging, helpers

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture.

## Performance

### Operation Benchmarks

| Operation | Duration | Target |
|-----------|----------|--------|
| Document Scan (50k words) | ~2.3s | <5s ✓ |
| Hub Detection (1000 entities) | ~145ms | <1s ✓ |
| Glossary Build (500 entities) | ~45ms | <100ms ✓ |
| Timeline Creation (100 events) | ~120ms | <500ms ✓ |

**Note**: Performance depends on system hardware and vault size.

## Mobile Support

- ✅ iOS (iPad/iPhone)
- ✅ Android
- ⚠️ Some features limited (timeline drag-drop disabled)

See [Mobile Support](#mobile-support) section for details.

## Troubleshooting

### Plugin won't load?
- Check console (Ctrl+Shift+I) for errors
- Verify files in `.obsidian/plugins/timeline-metadata/`
- Try reloading plugins in Settings

### Entities not extracting?
- Check Settings → Natural Language Processing
- Ensure document has relevant content
- Run scan command from palette

### Performance issues?
- Check `.metadata/performance.json` for bottlenecks
- Reduce document size
- Close unused modals

See FAQ section in full documentation for more troubleshooting.

## Development

```bash
npm install       # Install dependencies
npm run dev       # Watch mode
npm run build     # Production build
npm test          # Run tests (537+ tests)
```

## License

MIT

## Support

- **Issues**: Report on GitHub
- **Documentation**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Obsidian API**: https://docs.obsidian.md

---

**Plugin Version**: 0.1.0  
**Obsidian Minimum**: 1.0.0  
**Last Updated**: January 2025
