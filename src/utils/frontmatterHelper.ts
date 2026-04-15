import { TFile, Vault } from "obsidian";

export interface FrontmatterData {
	[key: string]: string | number | boolean | string[] | Record<string, unknown>;
}

/**
 * Parse frontmatter from markdown content
 * Returns { frontmatter, content }
 */
export function parseFrontmatter(markdown: string): {
	frontmatter: FrontmatterData;
	content: string;
} {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
	const match = markdown.match(frontmatterRegex);

	if (!match) {
		return { frontmatter: {}, content: markdown };
	}

	const frontmatterStr = match ? match[1] : "";
	const content = match ? markdown.slice(match[0].length) : markdown;
	const frontmatter: FrontmatterData = {};

	if (!frontmatterStr) {
		return { frontmatter: {}, content };
	}
	const lines = frontmatterStr.split("\n");
	for (const line of lines) {
		if (!line.trim()) continue;

		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;

		const key = line.substring(0, colonIndex).trim();
		let value: string | number | boolean | Record<string, unknown> | unknown = line.substring(colonIndex + 1).trim();

		// Parse JSON values
		if (typeof value === 'string' && (value.startsWith("[") || value.startsWith("{"))) {
			try {
				value = JSON.parse(value);
			} catch (e) {
				// Keep as string if not valid JSON
			}
		} else if (value === "true") {
			value = true;
		} else if (value === "false") {
			value = false;
		} else if (typeof value === 'string' && !isNaN(Number(value)) && value !== "") {
			value = Number(value);
		}

		frontmatter[key] = value as (string | number | boolean | string[] | Record<string, unknown>);
	}

	return { frontmatter, content };
}

/**
 * Serialize frontmatter to YAML
 */
export function serializeFrontmatter(data: FrontmatterData): string {
	const lines: string[] = [];

	for (const [key, value] of Object.entries(data)) {
		if (typeof value === "string") {
			lines.push(`${key}: ${value}`);
		} else if (typeof value === "boolean" || typeof value === "number") {
			lines.push(`${key}: ${value}`);
		} else if (Array.isArray(value)) {
			lines.push(`${key}: ${JSON.stringify(value)}`);
		} else if (typeof value === "object") {
			lines.push(`${key}: ${JSON.stringify(value)}`);
		}
	}

	return lines.join("\n");
}

/**
 * Update frontmatter in a markdown file
 * Creates frontmatter if it doesn't exist
 */
export async function updateFrontmatter(
	vault: Vault,
	file: TFile,
	updates: FrontmatterData
): Promise<void> {
	const content = await vault.read(file);
	const { frontmatter, content: bodyContent } = parseFrontmatter(content);

	// Merge updates
	const updated = { ...frontmatter, ...updates };

	// Serialize new frontmatter
	const newFrontmatter = serializeFrontmatter(updated);
	const newContent = `---\n${newFrontmatter}\n---\n${bodyContent}`;

	await vault.modify(file, newContent);
}

/**
 * Add tags to frontmatter if they don't already exist
 */
export async function addTagsToFrontmatter(
	vault: Vault,
	file: TFile,
	newTags: string[]
): Promise<void> {
	const content = await vault.read(file);
	const { frontmatter, content: bodyContent } = parseFrontmatter(content);

	// Get existing tags
	let tags: string[] = [];
	if (Array.isArray(frontmatter.tags)) {
		tags = frontmatter.tags;
	} else if (typeof frontmatter.tags === "string") {
		tags = frontmatter.tags.split(",").map((t) => t.trim());
	}

	// Add new tags (avoid duplicates)
	const tagSet = new Set(tags);
	newTags.forEach((tag) => tagSet.add(tag));
	tags = Array.from(tagSet);

	// Update frontmatter
	frontmatter.tags = tags;

	// Serialize
	const newFrontmatter = serializeFrontmatter(frontmatter);
	const newContent = `---\n${newFrontmatter}\n---\n${bodyContent}`;

	await vault.modify(file, newContent);
}
