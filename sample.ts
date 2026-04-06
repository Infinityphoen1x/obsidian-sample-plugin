import {App, Modal} from "obsidian";
import {LoreType, ScanCandidate, MasterMetadataStore} from "./types/shared";
import {groupCandidatesByStrategy, ExtendedCandidate, termGroupsToModalFormat} from "./grouping";

export interface MetadataModalOptions {
  candidates: ScanCandidate[];
  mode?: "overall" | "sub";
  pageLabel?: string;
  conflicts?: string[];
  initialTags?: string[];
  suggestedTags?: string[];
  store?: MasterMetadataStore;
  onAccept: (accepted: ScanCandidate[], tags: string[]) => Promise<void>;
  onCancel?: () => void;
}

export class MetadataModal extends Modal {
  private readonly options: MetadataModalOptions;
  private readonly selected = new Set<string>();
  private readonly promoteMap = new Map<string, boolean>();
  private readonly renameMap = new Map<string, string>();
  private readonly candidateGroup = new Map<string, string>();
  private readonly groupLoreType = new Map<string, LoreType>();
  private tags: Set<string>;
  private tagsInput?: HTMLInputElement;
  private tagButtons: Map<string, HTMLButtonElement> = new Map();
  private readonly groups: Map<string, ScanCandidate[]>;
  private readonly groupRename = new Map<string, string>();
  private readonly groupOrder: string[];

  constructor(app: App, options: MetadataModalOptions) {
    super(app);
    this.options = options;
    this.tags = new Set(options.initialTags ?? []);
    
    // Use new grouping strategy if master store is available
    let groupedCandidates = options.candidates;
    if (options.store) {
      const extended: ExtendedCandidate[] = options.candidates as ExtendedCandidate[];
      const termGroups = groupCandidatesByStrategy(extended, options.store);
      this.groups = termGroupsToModalFormat(termGroups);
      // Flatten groups back to candidates with groupOverride set
      groupedCandidates = Array.from(this.groups.values()).flat();
    } else {
      // Fallback to old grouping logic for backward compatibility
      this.groups = groupCandidates(options.candidates);
      // Update candidates to include groupOverride from old grouping
      groupedCandidates = options.candidates.map(c => ({
        ...c,
        groupOverride: c.groupOverride ?? inferGroupName(c.text)
      }));
    }
    
    // Update options candidates to include grouping information
    this.options.candidates = groupedCandidates;
    
    groupedCandidates.forEach(c => {
      this.selected.add(c.text);
      this.promoteMap.set(c.text, c.promote ?? (c.confidence >= 0.9));
      this.renameMap.set(c.text, c.text);
    });
    
    this.groups.forEach((_c, key) => this.groupRename.set(key, key));
    this.groups.forEach((c, key) => {
      const firstWithType = c.find(x => x.loreType);
      if (firstWithType?.loreType) this.groupLoreType.set(key, firstWithType.loreType);
    });
    this.groupOrder = Array.from(this.groups.keys());
    groupedCandidates.forEach(c => this.candidateGroup.set(c.text, c.groupOverride ?? "Ungrouped"));
  }

  private moveGroup(name: string, delta: number, contentEl: HTMLElement) {
    const idx = this.groupOrder.indexOf(name);
    if (idx === -1) return;
    const next = idx + delta;
    if (next < 0 || next >= this.groupOrder.length) return;
    const tmp = this.groupOrder[next];
    if (tmp === undefined) return;
    this.groupOrder[next] = name;
    this.groupOrder[idx] = tmp;
    const list = contentEl.querySelector<HTMLElement>(".metadata-candidate-list");
    if (list) this.renderGroups(list, contentEl);
  }

  private moveCandidateToGroup(candidate: string, from: string, to: string, list: HTMLElement, contentEl: HTMLElement) {
    if (from === to) return;
    const current = this.groups.get(from) ?? [];
    const nextList = this.groups.get(to) ?? [];
    const idx = current.findIndex(c => c.text === candidate);
    if (idx !== -1) {
      const [item] = current.splice(idx, 1);
      if (!item) return;
      this.groups.set(from, current);
      nextList.push(item);
      this.groups.set(to, nextList);
      this.candidateGroup.set(candidate, to);
      if (!this.groupOrder.includes(to)) {
        this.groupOrder.push(to);
      }
      const listEl = contentEl.querySelector<HTMLElement>(".metadata-candidate-list") ?? list;
      if (listEl) this.renderGroups(listEl, contentEl);
    }
  }

  private parseTags(value: string): string[] {
    return value.split(/[,\n]/).map(t => t.trim()).filter(Boolean);
  }

  onOpen() {
    const {contentEl} = this;
    const mode = this.options.mode ?? "overall";
    contentEl.createEl("h2", {text: mode === "overall" ? "Overall metadata review" : "Sub metadata review"});
    if (this.options.pageLabel) {
      contentEl.createEl("div", {cls: "metadata-page-label", text: this.options.pageLabel});
    }

    const instructions = contentEl.createEl("div", {cls: "metadata-help"});
    if (mode === "overall") {
      instructions.createEl("p", {text: "Parent-level review only. Confirm terms, assign parent groups, and adjust text/type where needed."});
      instructions.createEl("p", {text: "Child regrouping controls are intentionally disabled in this mode."});
    } else {
      instructions.createEl("p", {text: "Child-level refinement mode. Move or split terms to create child group structure before applying."});
      instructions.createEl("p", {text: "Use this mode only for sub review of parent documents."});
    }

    if (this.options.conflicts?.length) {
      const conflictBox = contentEl.createEl("div", {cls: "metadata-conflicts"});
      conflictBox.createEl("h3", {text: "Conflicts"});
      this.options.conflicts.slice(0, 5).forEach(msg => {
        conflictBox.createEl("div", {text: msg});
      });
      if (this.options.conflicts.length > 5) {
        conflictBox.createEl("div", {text: `...and ${this.options.conflicts.length - 5} more`});
      }
    }

    const list = contentEl.createEl("div", {cls: "metadata-candidate-list"});
    this.renderGroups(list, contentEl);

    const tagsSection = contentEl.createEl("div", {cls: "metadata-tags"});
    tagsSection.createEl("label", {text: "Tags (comma-separated)"});
    this.tagsInput = tagsSection.createEl("input", {type: "text"});
    this.tagsInput.value = Array.from(this.tags).join(", ");
    this.tagsInput.addEventListener("input", () => {
      this.tags = new Set(this.parseTags(this.tagsInput?.value ?? ""));
    });

    if (this.options.suggestedTags?.length) {
      const chipRow = tagsSection.createEl("div", {cls: "metadata-tag-suggestions"});
      this.options.suggestedTags.forEach(tag => {
        const btn = chipRow.createEl("button", {text: tag});
        btn.addEventListener("click", () => {
          if (this.tags.has(tag)) {
            this.tags.delete(tag);
            btn.classList.remove("active");
          } else {
            this.tags.add(tag);
            btn.classList.add("active");
          }
          if (this.tagsInput) {
            this.tagsInput.value = Array.from(this.tags).join(", ");
          }
        });
        if (this.tags.has(tag)) {
          btn.classList.add("active");
        }
        this.tagButtons.set(tag, btn);
      });
    }

    const buttons = contentEl.createEl("div", {cls: "metadata-buttons"});
    const applyButton = buttons.createEl("button", {text: "Apply"});
    applyButton.addEventListener("click", async () => {
      if (this.options.conflicts?.length) {
        const proceed = confirm("Conflicts detected. Continue applying anyway?");
        if (!proceed) return;
      }
      if (this.tagsInput) {
        this.tags = new Set(this.parseTags(this.tagsInput.value));
      }
      const accepted = this.options.candidates
        .filter(c => this.selected.has(c.text))
        .map(c => ({
          ...c,
          text: this.renameMap.get(c.text) ?? c.text,
          promote: this.promoteMap.get(c.text) ?? c.promote
        }));
      // Apply group rename to candidates inside that group
      accepted.forEach(c => {
        const originalGroup = this.candidateGroup.get(c.text) ?? inferGroupName(c.text);
        const targetGroup = this.groupRename.get(originalGroup ?? "")?.trim() || originalGroup;
        if (targetGroup && targetGroup.length > 0 && targetGroup !== originalGroup) {
          const parts = c.text.split(/\s+/);
          if (parts.length >= 2) {
            parts[parts.length - 1] = targetGroup;
            c.text = parts.join(" ");
          }
          c.groupOverride = targetGroup;
        }
        const groupType = this.groupLoreType.get(originalGroup ?? "");
        if (groupType) c.loreType = groupType;
      });
      try {
        await this.options.onAccept(accepted, Array.from(this.tags));
      } finally {
        this.close();
      }
    });
    const cancelButton = buttons.createEl("button", {text: "Cancel"});
    cancelButton.addEventListener("click", () => {
      this.options.onCancel?.();
      this.close();
    });
  }

  private renderGroups(list: HTMLElement, contentEl: HTMLElement) {
    list.empty();
    const isSubMode = (this.options.mode ?? "overall") === "sub";
    this.groupOrder.forEach(groupName => {
      const candidates = this.groups.get(groupName) ?? [];
      const header = list.createEl("div", {cls: "metadata-group-header"});
      const titleRow = header.createEl("div", {cls: "metadata-group-title"});
      titleRow.createEl("h3", {text: groupName || "Ungrouped"});
      const renameInput = titleRow.createEl("input", {type: "text", attr: {"placeholder": "Rename group"}});
      renameInput.value = this.groupRename.get(groupName) ?? groupName;
      renameInput.addEventListener("input", () => {
        this.groupRename.set(groupName, renameInput.value.trim());
      });
      const typeSelect = titleRow.createEl("select", {attr: {"aria-label": "Group type"}});
      const defaultOption = typeSelect.createEl("option", {text: "Type (optional)", value: ""});
      defaultOption.selected = !(this.groupLoreType.get(groupName));
      AVAILABLE_LORE_TYPES.forEach(type => {
        const opt = typeSelect.createEl("option", {text: type, value: type});
        if (this.groupLoreType.get(groupName) === type) opt.selected = true;
      });
      typeSelect.addEventListener("change", () => {
        const val = typeSelect.value.trim();
        if (isLoreType(val)) this.groupLoreType.set(groupName, val);
        else this.groupLoreType.delete(groupName);
      });
      const actions = header.createEl("div", {cls: "metadata-group-actions"});
      if (isSubMode) {
        const moveUp = actions.createEl("button", {text: "↑"});
        moveUp.addEventListener("click", () => this.moveGroup(groupName, -1, contentEl));
        const moveDown = actions.createEl("button", {text: "↓"});
        moveDown.addEventListener("click", () => this.moveGroup(groupName, 1, contentEl));
      }
      const selectAll = actions.createEl("button", {text: "Select all"});
      selectAll.addEventListener("click", () => {
        candidates.forEach(c => this.selected.add(c.text));
        list.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][data-group="${groupName}"]`).forEach(cb => cb.checked = true);
      });
      const deselectAll = actions.createEl("button", {text: "Clear"});
      deselectAll.addEventListener("click", () => {
        candidates.forEach(c => this.selected.delete(c.text));
        list.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][data-group="${groupName}"]`).forEach(cb => cb.checked = false);
      });
      if (isSubMode) {
        const promoteAll = actions.createEl("button", {text: "Promote all"});
        promoteAll.addEventListener("click", () => {
          candidates.forEach(c => this.promoteMap.set(c.text, true));
          list.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][data-role="promote"][data-group="${groupName}"]`).forEach(cb => cb.checked = true);
        });
        const clearPromote = actions.createEl("button", {text: "No promote"});
        clearPromote.addEventListener("click", () => {
          candidates.forEach(c => this.promoteMap.set(c.text, false));
          list.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][data-role="promote"][data-group="${groupName}"]`).forEach(cb => cb.checked = false);
        });
      }

      candidates.forEach((c) => {
        const row = list.createEl("div", {cls: "metadata-candidate"});
        const label = row.createEl("label");
        const checkbox = label.createEl("input", {type: "checkbox", attr: {"data-group": groupName}});
        checkbox.checked = this.selected.has(c.text);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            this.selected.add(c.text);
          } else {
            this.selected.delete(c.text);
          }
        });
        label.createSpan({text: `${c.text} (${(c.confidence * 100).toFixed(0)}%)${c.matchReason ? ` · ${c.matchReason}` : ""}`});

        if ((this.options.mode ?? "overall") === "sub") {
          const groupRow = row.createEl("div", {cls: "metadata-group-row"});
          const groupSelect = groupRow.createEl("select", {attr: {"data-role": "group-select"}});
          this.groupOrder.forEach(opt => {
            const option = groupSelect.createEl("option", {text: opt || "Ungrouped", value: opt});
            if (opt === groupName) option.selected = true;
          });
          const newGroupOption = groupSelect.createEl("option", {text: "(new group)", value: "__new__"});
          newGroupOption.selected = false;
          const newGroupInput = groupRow.createEl("input", {type: "text", attr: {"placeholder": "Group name"}});
          const moveButton = groupRow.createEl("button", {text: "Move"});
          moveButton.addEventListener("click", () => {
            let target = groupSelect.value;
            if (target === "__new__") target = newGroupInput.value.trim();
            const toGroup = target.length ? target : "";
            this.moveCandidateToGroup(c.text, groupName, toGroup, list, contentEl);
          });
          const splitButton = groupRow.createEl("button", {text: "Split"});
          splitButton.addEventListener("click", () => {
            const toGroup = c.text;
            this.moveCandidateToGroup(c.text, groupName, toGroup, list, contentEl);
          });
        }

        const renameInput = row.createEl("input", {type: "text", attr: {"data-role": "rename"}});
        renameInput.value = this.renameMap.get(c.text) ?? c.text;
        renameInput.addEventListener("input", () => {
          const next = renameInput.value.trim() || c.text;
          this.renameMap.set(c.text, next);
        });

        if (isSubMode) {
          const promoteLabel = row.createEl("label", {cls: "metadata-promote"});
          promoteLabel.createSpan({text: "Promote"});
          const promoteCheckbox = promoteLabel.createEl("input", {type: "checkbox", attr: {"data-role": "promote", "data-group": groupName}});
          promoteCheckbox.checked = this.promoteMap.get(c.text) ?? false;
          promoteCheckbox.addEventListener("change", () => {
            this.promoteMap.set(c.text, promoteCheckbox.checked);
          });
        }
      });
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

const inferGroupName = (text: string): string => {
  const parts = text.trim().split(/\s+/);
  if (parts.length >= 2) {
    const lastRaw = parts[parts.length - 1];
    if (!lastRaw) return "";
    const last = lastRaw.toLowerCase();
    if (["realm", "world", "city", "fortress", "kingdom", "empire", "hall", "tower", "temple", "gate"].includes(last)) return lastRaw;
    if (["clan", "sect", "guild", "order", "academy", "school", "society"].includes(last)) return lastRaw;
  }
  return "";
};

const groupCandidates = (candidates: ScanCandidate[]): Map<string, ScanCandidate[]> => {
  const groups = new Map<string, ScanCandidate[]>();
  candidates.forEach(c => {
    const key = inferGroupName(c.text);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  });
  return groups;
};

const AVAILABLE_LORE_TYPES: LoreType[] = ["concept", "location", "character", "faction", "event", "item"];

const isLoreType = (value: string): value is LoreType => {
  return AVAILABLE_LORE_TYPES.includes(value as LoreType);
};