/**
 * Document Scanner Handlers
 *
 * Integration layer for document scanning with key term selection.
 * Handles full workflow: scan → select key terms → apply → persist entities.
 *
 * DEPRECATED: Use DocumentScanHandler class directly instead.
 * These exports maintained for backward compatibility.
 */

import { App, TFile, Vault } from 'obsidian';
import { PluginSettings } from '../../types';
import { EntityStore } from '../metadata/entityStore';
import { HubManager } from '../metadata/hubManager';
import { GlossaryManager } from '../metadata/glossaryManager';
import { BlacklistManager } from '../scanner/blacklistManager';
import { DocumentScanHandler } from './documentScanHandler';

/**
 * Handle complete document scanning workflow
 * 
 * Delegates to DocumentScanHandler class
 */
export async function handleDocumentScan(
	app: App,
	vault: Vault,
	file: TFile,
	settings: PluginSettings,
	entityStore?: EntityStore,
	hubManager?: HubManager | null,
	glossaryManager?: GlossaryManager | null,
	blacklistManager?: BlacklistManager | null
): Promise<void> {
	const handler = new DocumentScanHandler(
		app,
		vault,
		settings,
		entityStore,
		hubManager,
		glossaryManager,
		blacklistManager
	);
	await handler.scan(file);
}
