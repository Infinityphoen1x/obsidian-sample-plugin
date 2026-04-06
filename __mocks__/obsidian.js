/**
 * Manual mock for obsidian module
 * Used for testing without requiring actual Obsidian environment
 */

// Extend HTMLElement with Obsidian methods
HTMLElement.prototype.empty = function () {
	while (this.firstChild) {
		this.removeChild(this.firstChild);
	}
	return this;
};

HTMLElement.prototype.createDiv = function (className) {
	const div = document.createElement("div");
	if (className) {
		div.className = className;
	}
	this.appendChild(div);
	return div;
};

HTMLElement.prototype.createEl = function (tag, options = {}) {
	const el = document.createElement(tag);
	if (options.cls) {
		el.className = options.cls;
	}
	if (options.text) {
		el.textContent = options.text;
	}
	if (options.type) {
		el.type = options.type;
	}
	if (options.attr) {
		Object.entries(options.attr).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				el.setAttribute(key, value);
			}
		});
	}
	this.appendChild(el);
	return el;
};

HTMLElement.prototype.addClass = function (className) {
	this.classList.add(className);
	return this;
};

HTMLElement.prototype.removeClass = function (className) {
	this.classList.remove(className);
	return this;
};

class App {
	constructor() {
		this.vault = new Vault();
		this.workspace = new Workspace();
	}
}

class Modal {
	constructor(app) {
		this.app = app;
		this.contentEl = document.createElement("div");
	}

	onOpen() {
		// Override in subclass
	}

	onClose() {
		// Override in subclass
	}

	close() {
		this.onClose();
	}
}

class Setting {
	constructor(containerEl) {
		this.containerEl = containerEl;
		this.descEl = null;
		this.nameEl = null;
		// Mock constructor
	}

	setName(name) {
		this.nameEl = document.createElement("label");
		this.nameEl.textContent = name;
		this.containerEl.appendChild(this.nameEl);
		return this;
	}

	setDesc(desc) {
		this.descEl = document.createElement("p");
		this.descEl.textContent = typeof desc === "string" ? desc : "";
		this.containerEl.appendChild(this.descEl);
		return this;
	}

	addToggle(callback) {
		const input = document.createElement("input");
		input.type = "checkbox";
		this.containerEl.appendChild(input);
		if (callback) {
			callback({ setValue: () => this, getValue: () => input.checked });
		}
		return this;
	}

	addTextArea(callback) {
		const textarea = document.createElement("textarea");
		this.containerEl.appendChild(textarea);
		if (callback) {
			callback({ setValue: () => this, getValue: () => textarea.value });
		}
		return this;
	}

	addText(callback) {
		const input = document.createElement("input");
		input.type = "text";
		this.containerEl.appendChild(input);
		if (callback) {
			callback({ setValue: () => this, getValue: () => input.value });
		}
		return this;
	}

	addButton(callback) {
		const button = new Button(this.containerEl);
		if (callback) {
			callback(button);
		}
		return this;
	}

	addDropdown(callback) {
		const select = document.createElement("select");
		this.containerEl.appendChild(select);
		if (callback) {
			callback({ 
				addOption: () => select,
				setValue: () => this, 
				getValue: () => select.value 
			});
		}
		return this;
	}

	addSearch(callback) {
		return this;
	}

	addExtraButton() {
		return new Button(this.containerEl);
	}
}

class Button {
	constructor(containerEl) {
		this.containerEl = containerEl;
		this.el = document.createElement("button");
		this.containerEl.appendChild(this.el);
	}

	setButtonText(text) {
		this.el.textContent = text;
		return this;
	}

	setCta() {
		this.el.classList.add("is-cta");
		return this;
	}

	setDisabled(disabled) {
		this.el.disabled = disabled;
		return this;
	}

	onClick(callback) {
		this.el.addEventListener("click", callback);
		return this;
	}
}

class TFile {
	constructor() {
		this.name = "";
		this.path = "";
		this.stat = { size: 0, ctime: 0, mtime: 0 };
	}
}

class Leaf {
	constructor() {
		this.view = null;
		this.containerEl = document.createElement("div");
	}

	async setViewState(state) {
		return Promise.resolve();
	}

	setEphemeralState(state) {
		return this;
	}

	async openFile(file) {
		return Promise.resolve();
	}
}

class Workspace {
	constructor() {
		this.leaves = [];
		this.activeLeaf = null;
		this.layoutReady = false;
	}

	onLayoutReady(callback) {
		if (this.layoutReady) {
			callback();
		} else {
			setTimeout(() => {
				this.layoutReady = true;
				callback();
			}, 0);
		}
		return () => {}; // Return unsubscribe function
	}

	getLeaf(focus = true) {
		if (!this.activeLeaf) {
			this.activeLeaf = new Leaf();
			this.leaves.push(this.activeLeaf);
		}
		return this.activeLeaf;
	}

	getRightLeaf(focus = true) {
		const leaf = new Leaf();
		this.leaves.push(leaf);
		return leaf;
	}

	getLeftLeaf(focus = true) {
		const leaf = new Leaf();
		this.leaves.unshift(leaf);
		return leaf;
	}

	getActiveFile() {
		return null;
	}

	getActiveFileView() {
		return null;
	}

	on(event, callback) {
		return () => {}; // Return unsubscribe function
	}
}

class Vault {
	constructor() {
		this.adapter = new FileSystemAdapter();
		this._files = {};
	}

	async read(file) {
		const path = typeof file === "string" ? file : file.path;
		return this._files[path] || "";
	}

	async readBinary(file) {
		const path = typeof file === "string" ? file : file.path;
		return this._files[path] || new ArrayBuffer(0);
	}

	async modify(file, content) {
		const path = typeof file === "string" ? file : file.path;
		this._files[path] = content;
		if (typeof file === "object") {
			file.stat = { size: content.length, ctime: Date.now(), mtime: Date.now() };
		}
		return Promise.resolve();
	}

	async create(path, content = "") {
		const file = new TFile();
		file.path = path;
		file.name = path.split("/").pop();
		file.stat = { size: content.length, ctime: Date.now(), mtime: Date.now() };
		this._files[path] = content;
		return Promise.resolve(file);
	}

	getFileByPath(path) {
		if (this._files[path] !== undefined) {
			const file = new TFile();
			file.path = path;
			file.name = path.split("/").pop();
			return file;
		}
		return null;
	}

	getAbstractFileByPath(path) {
		return this.getFileByPath(path);
	}
}

class Plugin {
	constructor(app, manifest) {
		this.app = app;
		this.manifest = manifest;
	}

	addCommand(command) {
		// Mock addCommand
		return this;
	}

	addSettingTab(tab) {
		// Mock addSettingTab
		return this;
	}

	registerView(type, factory) {
		// Mock registerView
		return this;
	}

	registerEvent(event) {
		// Mock registerEvent
		return this;
	}

	registerDomEvent(el, event, callback) {
		// Mock registerDomEvent
		return this;
	}

	registerInterval(interval) {
		// Mock registerInterval
		return this;
	}

	loadData() {
		return Promise.resolve({});
	}

	saveData(data) {
		return Promise.resolve();
	}
}

class Notice {
	constructor(message, timeout) {
		// Mock Notice
	}
}

class PluginSettingTab {
	constructor(app, plugin) {
		// Mock PluginSettingTab
	}

	display() {
		// Mock display
	}
}

class FileSystemAdapter {
	constructor() {
		this._files = {};
	}

	async write(path, content) {
		this._files[path] = content;
		return Promise.resolve();
	}

	async read(path) {
		return this._files[path] || "";
	}

	async exists(path) {
		return Promise.resolve(this._files[path] !== undefined);
	}

	async mkdir(path) {
		return Promise.resolve();
	}

	async remove(path) {
		delete this._files[path];
		return Promise.resolve();
	}

	async rename(oldPath, newPath) {
		this._files[newPath] = this._files[oldPath];
		delete this._files[oldPath];
		return Promise.resolve();
	}
}

const requestUrl = async (url) => {
	// Mock requestUrl
	return { status: 200, text: "", json: {} };
};

module.exports = {
	App,
	Modal,
	Setting,
	Button,
	TFile,
	Vault,
	Leaf,
	Workspace,
	Plugin,
	Notice,
	PluginSettingTab,
	FileSystemAdapter,
	requestUrl,
};
