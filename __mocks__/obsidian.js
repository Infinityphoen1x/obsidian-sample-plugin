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
	// Mock App class
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
		// Mock constructor
	}

	addButton(callback) {
		const button = new Button(this.containerEl);
		if (callback) {
			callback(button);
		}
		return this;
	}

	addDropdown(callback) {
		return this;
	}

	addText(callback) {
		return this;
	}

	addSearch(callback) {
		return this;
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
	}
}

class Vault {
	// Mock Vault class
}

class Plugin {
	constructor(app, manifest) {
		this.app = app;
		this.manifest = manifest;
	}

	addCommand(command) {
		// Mock addCommand
	}

	registerEvent(event) {
		// Mock registerEvent
	}

	registerDomEvent(el, event, callback) {
		// Mock registerDomEvent
	}

	registerInterval(interval) {
		// Mock registerInterval
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
	// Mock FileSystemAdapter
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
	Plugin,
	Notice,
	PluginSettingTab,
	FileSystemAdapter,
	requestUrl,
};
