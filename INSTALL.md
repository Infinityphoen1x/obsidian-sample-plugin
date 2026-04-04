# Installation Guide - Metadata Organizer Plugin

This guide explains how to set up and test the Metadata Organizer plugin locally.

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - for cloning the repository
- **Obsidian** - [Download](https://obsidian.md)

## Quick Start

### 1️⃣ Clone and Install (All Platforms)

```bash
# Clone the repository
git clone https://github.com/obsidianmd/obsidian-sample-plugin.git metadata-organizer
cd metadata-organizer

# Unix/Linux/macOS
bash scripts/install-plugin.sh

# Windows
scripts\install-plugin.bat

# Or manually
npm install
npm run build
npm test
```

### 2️⃣ Manual Installation to Obsidian Vault

After building, copy the generated files to your Obsidian vault:

```
YOUR_VAULT_PATH/.obsidian/plugins/metadata-organizer/
├── main.js
├── manifest.json
└── styles.css
```

**Steps:**

1. Build the plugin:
   ```bash
   npm run build
   ```

2. Create the plugin directory in your vault (if it doesn't exist):
   ```bash
   mkdir -p YOUR_VAULT_PATH/.obsidian/plugins/metadata-organizer
   ```

3. Copy the build artifacts:
   ```bash
   # Unix/Linux/macOS
   cp main.js manifest.json styles.css YOUR_VAULT_PATH/.obsidian/plugins/metadata-organizer/

   # Windows
   copy main.js manifest.json styles.css "YOUR_VAULT_PATH\.obsidian\plugins\metadata-organizer\"
   ```

4. Reload Obsidian:
   - Press `Ctrl+R` (Windows/Linux) or `Cmd+R` (macOS)
   - Or restart the app completely

5. Enable the plugin:
   - Go to **Settings → Community plugins**
   - Look for "Metadata Organizer"
   - Toggle it ON

## Automated Installation to Test Vault

If you have a dedicated test vault, use the `OBSIDIAN_VAULT` environment variable:

### Unix/Linux/macOS
```bash
export OBSIDIAN_VAULT="/path/to/test/vault"
bash scripts/install-plugin.sh
```

### Windows (Command Prompt)
```cmd
set OBSIDIAN_VAULT=C:\path\to\test\vault
scripts\install-plugin.bat
```

### Windows (PowerShell)
```powershell
$env:OBSIDIAN_VAULT = "C:\path\to\test\vault"
bash scripts/install-plugin.sh
```

## Development Workflow

### Standard Tasks

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Watch and rebuild on changes (development)
npm run dev

# Run unit tests
npm test

# Watch and re-run tests on changes
npm test:watch

# Generate test coverage report
npm test:coverage

# Check code style
npm run lint

# Fix linting issues
npm run lint --fix
```

### Project Structure

```
src/
├── main.ts              # Plugin entry point
├── settings.ts          # Settings UI and configuration
├── types.ts             # TypeScript type definitions
├── core/
│   ├── metadata/        # Entity storage and indexing
│   └── scanner/         # Document scanning and analysis
├── protocol/            # Protocol folder management
├── ui/                  # User interface components
├── utils/               # Utility functions
└── migrations/          # Version migrations
```

## Testing the Plugin

### Manual Testing in Obsidian

1. **Verify Installation:**
   - Check Settings → Community plugins
   - Plugin name: "Metadata Organizer"
   - Should have plugin controls (Enable/Disable)

2. **Test Scan Document Command:**
   - Open a markdown file
   - Run command: "Metadata Organizer: Scan document for metadata"
   - Or press the command palette shortcut

3. **Check Protocol Folder:**
   - Look for `.metadata/` folder in vault root
   - Should contain scan logs and entity data

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tokenizer.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode (re-run on changes)
npm test:watch
```

### Building Verification

After `npm run build`, verify:

- ✅ `main.js` generated (14KB+)
- ✅ `manifest.json` present
- ✅ No TypeScript errors

```bash
# Check build artifacts
ls -lh main.js manifest.json
npm run lint
```

## Troubleshooting

### Plugin doesn't appear in Obsidian

- **Cause:** Files not copied correctly
- **Solution:** 
  1. Verify files are in `.obsidian/plugins/metadata-organizer/`
  2. Check file names (case-sensitive)
  3. Reload Obsidian (Ctrl+R)

### "Cannot find module" errors

- **Cause:** Dependencies not installed
- **Solution:** 
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

### Tests fail with import errors

- **Cause:** ESM module resolution issues
- **Solution:**
  ```bash
  npm run build   # This runs TypeScript check
  npm test        # Jest handles test imports
  ```

### Plugin not executing commands

- **Cause:** Plugin not enabled
- **Solution:**
  1. Go to Settings → Community plugins
  2. Find "Metadata Organizer"
  3. Toggle enable
  4. Try command again

## Environment Variables

### OBSIDIAN_VAULT
Specifies the vault path for automated installation.

```bash
export OBSIDIAN_VAULT="/Users/user/Documents/MyVault"
bash scripts/install-plugin.sh
```

## Advanced Development

### Debugging

Enable debug logs by setting plugin settings:

```
Settings → Metadata Organizer
→ Log Level: "debug"
```

Check browser console for errors:
- Windows/Linux: `Ctrl+Shift+I`
- macOS: `Cmd+Option+I`

### Hot Reload (Development Only)

For development with hot reload (requires Obsidian Developer Mode):

1. Enable Settings → About → Toggle on "Developer mode"
2. Run: `npm run dev`
3. Changes will auto-rebuild
4. Reload plugin with Ctrl+R

### Making Changes

1. Edit source files in `src/`
2. Run tests: `npm test`
3. Build: `npm run build`
4. Reload in Obsidian: `Ctrl+R`

## Next Steps

- Read the [ARCHITECTURE.md](../ARCHITECTURE.md) for design details
- Check [CHECKLIST.md](../CHECKLIST.md) for implementation phases
- See [README.md](../README.md) for feature overview

## Support

For issues or questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review build errors: `npm run build 2>&1 | tail -20`
3. Check test output: `npm test -- --verbose`
4. Verify file structure exists

## VSCode Integration (Optional)

Install recommended extensions in VSCode:

- **ESLint** - Code quality
- **TypeScript Vue Plugin** - Type checking
- **Jest** - Test runner

These provide:
- Real-time error checking
- Test result display
- Code formatting on save (if configured)
