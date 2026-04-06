/**
 * Core type definitions for Metadata Organizer plugin
 */

// ============================================================================
// === Entity & Metadata ===
// ============================================================================

export interface Entity {
  id: string; // "ent_abc123_0001"
  name: string; // "Lucy"
  canonical?: string; // "lucyName" (for aliases)
  frequency: number; // 70
  sources: SourceRef[]; // [{doc: "Ch1.md", lines: [5, 12, 23]}]
  group?: string; // "Characters"
  tags: string[]; // ["characters/lucy", "temporal:past"]
  createdAt: number; // Timestamp
  updatedAt: number;
  description?: string; // User-added content
}

export interface SourceRef {
  document: string; // "Ch1.md"
  lineNumbers: number[]; // [5, 12, 23]
}

export interface MasterMetadataIndex {
  // Quick lookup: term name → entity ID
  nameToId: Map<string, string>;
  // Canonical name → term names (for aliases)
  canonicalToNames: Map<string, string[]>;
  // Group name → entity IDs
  groupIndex: Map<string, string[]>;
  // Last updated timestamp
  lastUpdated: number;
  // Schema version for migrations
  version: number;
}

// ============================================================================
// === Groups & Organization ===
// ============================================================================

export interface Group {
  id: string;
  name: string; // "Characters"
  folder: string; // "Characters/" (vault path)
  keyTermIds: string[]; // ["ent_abc_001", "ent_def_002"]
  tags: string[]; // User-added tags
  createdAt: number;
}

export interface ParentNote {
  id: string;
  groupId: string;
  name: string; // Same as group name
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
  name: string; // Same as entity name
  frontmatter: {
    type: "child";
    parentId: string;
    entityId: string;
    tags: string[];
  };
  description: string; // User additions
}

// ============================================================================
// === Timeline ===
// ============================================================================

export interface TimelineEvent {
  id: string; // "evt_xyz_0001"
  sentence: string; // Full sentence from document (primary field)
  text?: string; // UI convenience: same as sentence
  source: {
    document: string; // "Ch1.md"
    line: number;
  };
  sourceDocument?: string; // UI convenience: duplicates source.document
  temporalTerms: string[]; // ["then", "past"]
  timestamp?: number; // UI convenience: optional timestamp
  order: number; // Position in timeline
  color?: string; // "#FF5733"
  status: "draft" | "confirmed";
  isCustom?: boolean; // Flag for user-created events (modals)
}

export interface SnapshotTimeline {
  id: string;
  name: string; // "Ch1 Events"
  documentSource: string; // "Ch1.md"
  events: TimelineEvent[];
  createdAt: number;
}

export interface MasterTimeline {
  snapshots: SnapshotTimeline[];
  version: number;
  lastUpdated: number;
}

// ============================================================================
// === Hub & Cross-Reference ===
// ============================================================================

export interface HubEntry {
  id: string;
  entities: string[]; // ["ent_abc_001", "ent_def_002"]
  frequency: number; // How many times they co-occur
  sources: SourceRef[];
}

// ============================================================================
// === Document Scanning ===
// ============================================================================

export interface Token {
  word: string;
  frequency: number;
  positions: number[]; // Character positions in text
}

export interface TemporalTerm {
  term: string;
  position: number; // Character position of first occurrence
  lineNumber: number; // Line of first occurrence
  frequency: number; // Count of occurrences in document
  wikilinked: boolean; // Already [[wrapped]]
}

export interface DocScanResult {
  document: string; // "Ch1.md"
  tokens: Token[];
  temporalTerms: TemporalTerm[];
  isChapter: boolean;
  wordCount: number;
  uniqueTokenCount: number;
}

export interface ScanSession {
  document: string; // "Ch1.md"
  timestamp: number;
  wordsScanned: number;
  newEntities: string[];
  updatedEntities: string[];
  isChapter: boolean;
}

// ============================================================================
// === Frontmatter & Metadata ===
// ============================================================================

export interface DocumentFrontmatter {
  type: "document" | "parent" | "child"; // Document type
  scanned_date?: string; // ISO date
  is_chapter?: boolean;
  temporal_tags?: string[]; // ["past", "present"]
  word_count?: number;
  group?: string;
  groupId?: string;
  keyTermIds?: string[]; // For parent notes
  parentId?: string; // For child notes
  entityId?: string; // For child notes
  tags: string[];
}

// ============================================================================
// === Plugin Settings ===
// ============================================================================

export interface PluginSettings {
  // Folder configuration
  protocolFolderName: string; // ".metadata"
  masterMetadataFile: string; // "master-entities.csv"
  indexFile: string; // "index.json"

  // Feature flags
  desktopOnly: boolean; // Set to true for non-mobile
  mobileWarning: boolean; // Show warning on mobile

  // Performance tuning
  logLevel: "debug" | "info" | "warn"; // Logging detail
  chunkSize: number; // For modal pagination (50–200 recommended)

  // UI preferences
  timelineMode: "static" | "interactive"; // Auto-downgrade on mobile
  showDescriptions: boolean; // Show entity descriptions in modals
  autoFormatFrontmatter: boolean; // Auto-format on save

  // Advanced
  enableLogging: boolean; // Log all operations
  logRetentionDays: number; // How long to keep logs
}

export const DEFAULT_SETTINGS: PluginSettings = {
  protocolFolderName: ".metadata",
  masterMetadataFile: "master-entities.csv",
  indexFile: "index.json",
  desktopOnly: true,
  mobileWarning: true,
  logLevel: "info",
  chunkSize: 100,
  timelineMode: "interactive",
  showDescriptions: true,
  autoFormatFrontmatter: true,
  enableLogging: true,
  logRetentionDays: 30,
};

// ============================================================================
// === Internal API Interfaces ===
// ============================================================================

export interface EntityStoreInterface {
  addEntity(entity: Entity): void;
  updateEntity(id: string, updates: Partial<Entity>): void;
  getEntity(id: string): Entity | null;
  findByName(name: string): Entity | null;
  getAllEntities(): Entity[];
  persist(): Promise<void>;
}

export interface ProtocolManagerInterface {
  initializeProtocolFolder(): Promise<void>;
  ensureStructure(): Promise<void>;
  getProtocolFolderPath(): string;
}

export interface LoggerInterface {
  debug(message: string, data?: object): Promise<void>;
  info(message: string, data?: object): Promise<void>;
  warn(message: string, data?: object): Promise<void>;
  error(message: string, data?: object): Promise<void>;
}

// ============================================================================
// === Event Types ===
// ============================================================================

export type ScanEventData = {
  document: string;
  entitiesFound: number;
  entitiesCreated: number;
  entitiesUpdated: number;
};

export type GroupEventData = {
  groupId: string;
  groupName: string;
  entitiesAdded: number;
};

export type TimelineEventData = {
  snapshotId: string;
  eventsCount: number;
  modified: boolean;
};
