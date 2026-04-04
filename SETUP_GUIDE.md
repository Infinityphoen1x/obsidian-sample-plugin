# Setup Guide - Metadata Organizer Plugin

Complete step-by-step setup instructions for each platform.

## Table of Contents

- [macOS Setup](#macos-setup)
- [Linux Setup](#linux-setup)
- [Windows Setup](#windows-setup)
- [Testing the Plugin](#testing-the-plugin)
- [Setting Up Your Development Environment](#setting-up-your-development-environment)

---

## macOS Setup

### Prerequisites

1. **Install Node.js** (if not already installed)
   ```bash
   # Using Homebrew (recommended)
   brew install node@18
   
   # Or download from: https://nodejs.org/
   ```

2. **Verify installation**
   ```bash
   node --version  # Should be v18 or higher
   npm --version   # Should be 9 or higher
   ```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/obsidianmd/obsidian-sample-plugin.git
   cd obsidian-sample-plugin
   ```

2. **Run the setup script**
   ```bash
   bash setup.sh
   ```

3. **Or install to a specific vault**
   ```bash
   bash setup.sh ~/Documents/MyOldsisVault
   ```

### Manual Steps (if not using setup script)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the plugin**
   ```bash
   npm run build
   ```

3. **Copy to Obsidian**
   ```bash
   # Replace VAULT_PATH with your actual vault path
   VAULT_PATH="$HOME/Documents/MyVault"
   mkdir -p "$VAULT_PATH/.obsidian/plugins/metadata-organizer"
   cp main.js manifest.json styles.css "$VAULT_PATH/.obsidian/plugins/metadata-organizer/"
   ```

4. **Reload Obsidian**
   - Press `Cmd+R` to reload
   - Go to Settings → Community plugins
   - Enable "Metadata Organizer"

---

## Linux Setup

### Prerequisites

1. **Install Node.js** (if not already installed)
   
   **Ubuntu/Debian:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
   
   **Fedora/CentOS:**
   ```bash
   sudo dnf module enable nodejs:18
   sudo dnf install nodejs
   ```
   
   **Arch Linux:**
   ```bash
   sudo pacman -S nodejs npm
   ```

2. **Verify installation**
   ```bash
   node --version
   npm --version
   ```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/obsidianmd/obsidian-sample-plugin.git
   cd obsidian-sample-plugin
   ```

2. **Run the setup script**
   ```bash
   bash setup.sh
   ```

3. **Or with a custom vault path**
   ```bash
   bash setup.sh ~/.local/share/obsidian/vault
   ```

### Manual Steps

Same as macOS section above, just adjust paths for Linux (e.g., `~/.local/share/obsidian/`).

---

## Windows Setup

### Prerequisites

1. **Install Node.js**
   - Download from: https://nodejs.org/ (LTS version, 18+)
   - Run the installer
   - Use default installation settings
   - Restart your computer after installation

2. **Verify installation**
   ```cmd
   node --version
   npm --version
   ```

3. **Install Git** (if not already installed)
   - Download from: https://git-scm.com/

### Installation

#### Option 1: Using Command Prompt (Recommended)

1. **Clone the repository**
   ```cmd
   git clone https://github.com/obsidianmd/obsidian-sample-plugin.git
   cd obsidian-sample-plugin
   ```

2. **Run the setup script**
   ```cmd
   setup.bat
   ```

3. **Or with a custom vault path**
   ```cmd
   set OBSIDIAN_VAULT=C:\Users\YOUR_USERNAME\AppData\Local\Obsidian\vault
   setup.bat
   ```

#### Option 2: Using PowerShell

1. **Clone the repository**
   ```powershell
   git clone https://github.com/obsidianmd/obsidian-sample-plugin.git
   cd obsidian-sample-plugin
   ```

2. **Run the setup script**
   ```powershell
   bash setup.sh
   ```

### Manual Steps

1. **Install dependencies**
   ```cmd
   npm install
   ```

2. **Build the plugin**
   ```cmd
   npm run build
   ```

3. **Copy to Obsidian**
   ```cmd
   REM Replace VAULT_PATH with your actual vault path
   set VAULT_PATH=C:\Users\YOUR_USERNAME\Documents\MyVault
   mkdir "%VAULT_PATH%\.obsidian\plugins\metadata-organizer"
   copy main.js "%VAULT_PATH%\.obsidian\plugins\metadata-organizer\"
   copy manifest.json "%VAULT_PATH%\.obsidian\plugins\metadata-organizer\"
   copy styles.css "%VAULT_PATH%\.obsidian\plugins\metadata-organizer\"
   ```

4. **Reload Obsidian**
   - Press `Ctrl+R` to reload
   - Go to Settings → Community plugins
   - Enable "Metadata Organizer"

---

## Testing the Plugin

### Verify Installation

1. **Check that plugin appears in settings:**
   - Open Obsidian
   - Go to Settings → Community plugins
   - Look for "Metadata Organizer"

2. **Verify the plugin enables:**
   - Click "Enable" next to the plugin
   - You should see a new command in the command palette

3. **Test the Scan Document command:**
   - Open a markdown file in your vault
   - Press `Ctrl+P` (Cmd+P on Mac) to open command palette
   - Search for "Scan document" 
   - Select "Metadata Organizer: Scan document for metadata"
   - The plugin should process the file

4. **Check for protocol folder:**
   - Look at your vault root directory
   - You should see a `.metadata/` folder created
   - This folder contains entity data and scan logs

### Run Unit Tests

```bash
npm test
```

Expected output:
```
Test Suites: 5 passed, 5 total
Tests:       146 passed, 146 total
```

---

## Setting Up Your Development Environment

### Recommended IDE/Editor

#### Option 1: Visual Studio Code (Recommended)

1. **Install VSCode:** https://code.visualstudio.com/
2. **Install extensions:**
   - TypeScript Vue Plugin
   - ESLint
   - Jest

3. **Open the project folder**

4. **Configure workspace settings** (optional):
   - Create `.vscode/settings.json`:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "[typescript]": {
       "editor.defaultFormatter": "esbenp.prettier-vscode"
     },
     "typescript.tsdk": "node_modules/typescript/lib",
     "jest.showCoverageOnLoad": false
   }
   ```

#### Option 2: WebStorm/IntelliJ IDEA

1. Open the project folder
2. Configure Node.js: Settings → Languages & Frameworks → Node.js
3. Enable TypeScript: Settings → Languages & Frameworks → TypeScript

### Development Commands

```bash
# Install dependencies
npm install

# Build once
npm run build

# Build and watch for changes
npm run dev

# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Check code style
npm run lint

# Run tests with coverage
npm test -- --coverage
```

### Workflow

1. **Make changes** to files in `src/`
2. **Run tests** to ensure nothing breaks:
   ```bash
   npm test
   ```
3. **Build the plugin**:
   ```bash
   npm run build
   ```
4. **Update in Obsidian**:
   - Reload (`Ctrl+R` or `Cmd+R`)
   - Or restart Obsidian
5. **Test in Obsidian** to verify changes work

### Useful Development Tips

- **Enable Obsidian Developer Mode:**
  - Settings → About → Toggle "Developer mode"
  - This allows you to inspect plugin issues
  
- **Check the console for errors:**
  - Windows/Linux: `Ctrl+Shift+I`
  - macOS: `Cmd+Option+I`
  - Look for any errors or warnings related to your plugin

- **Use live reload:**
  - Run `npm run dev` while developing
  - This automatically rebuilds when you save files

---

## Troubleshooting

### "npm: command not found"
- Node.js is not installed or not on PATH
- Reinstall Node.js and restart your terminal/IDE

### "Cannot find module" errors
- Dependencies not installed
- Run: `npm install`

### Plugin doesn't appear in Obsidian
- Files not copied correctly
- Verify: `YOUR_VAULT/.obsidian/plugins/metadata-organizer/main.js` exists
- Check file names (case-sensitive)
- Reload Obsidian (Ctrl+R or Cmd+R)

### Tests fail with import errors
- Run: `npm run build` first (checks TypeScript)
- Then: `npm test` (Jest handles tests)

### Build fails
- Clear node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`
- Build again: `npm run build`

---

## Getting Help

- Check [INSTALL.md](INSTALL.md) for more detailed information
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for design details
- See [CHECKLIST.md](CHECKLIST.md) for implementation phases
- File an issue on GitHub if you encounter problems

---

✨ **Happy developing!**
