import { Plugin, Notice } from "obsidian";
import { PluginSettings } from "../../types";
import { EntityStore } from "../../core/metadata/entityStore";
import { handleDescriptionModal } from "../handlers/modalHandlers";

/**
 * Register description editing context menu
 */
export function registerDescriptionContextMenu(
	plugin: Plugin,
	settings: PluginSettings,
	entityStore: EntityStore | null
): void {
	plugin.registerEvent(
		plugin.app.workspace.on("editor-menu", (menu, editor) => {
			const selectedText = editor.getSelection().trim();

			if (selectedText.length === 0) {
				return;
			}

			if (!entityStore) {
				return;
			}

			const entities = entityStore.getAllEntities();

			if (entities.length === 0) {
				return;
			}

			menu.addItem((item) => {
				item
					.setTitle("Edit description (Metadata Organizer)")
					.setIcon("pencil")
					.onClick(async () => {
						if (!entityStore) {
							new Notice("❌ Entity store not initialized");
							return;
						}

						await handleDescriptionModal(
							plugin.app,
							plugin.app.vault,
							selectedText,
							entities,
							entityStore,
							settings
						);
					});
			});
		})
	);
}
