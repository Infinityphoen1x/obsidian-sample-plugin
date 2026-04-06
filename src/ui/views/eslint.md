eslint output:


/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/core/scanner/temporalTagger.ts
  34:15  warning  'category' is assigned a value but never used  @typescript-eslint/no-unused-vars
  57:15  warning  'category' is assigned a value but never used  @typescript-eslint/no-unused-vars

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/initialization/initializeManagers.ts
  41:3  error  Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console
  56:3  error  Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console
  68:3  error  Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console
  81:3  error  Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console
  94:3  error  Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/initialization/initializeViews.ts
  41:2   error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator  @typescript-eslint/no-floating-promises
  42:13  error  Use sentence case for UI text                                                                                                                                       obsidianmd/ui/sentence-case
  66:2   error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator  @typescript-eslint/no-floating-promises
  67:13  error  Use sentence case for UI text                                                                                                                                       obsidianmd/ui/sentence-case

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/main.ts
  26:3  error  Unexpected console statement. Only these console methods are allowed: warn, error, debug                                                                            no-console
  55:4  error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator  @typescript-eslint/no-floating-promises
  58:3  error  Unexpected console statement. Only these console methods are allowed: warn, error, debug                                                                            no-console
  62:3  error  Unexpected console statement. Only these console methods are allowed: warn, error, debug                                                                            no-console

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/protocol/__tests__/stateManager.test.ts
  0:0  error  Parsing error: /Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/protocol/__tests__/stateManager.test.ts was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/protocol/logManager.ts
   34:24  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  117:26  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/protocol/protocolManager.ts
   8:17  warning  'TFolder' is defined but never used                                                       @typescript-eslint/no-unused-vars
  27:20  error    Unexpected any. Specify a different type                                                  @typescript-eslint/no-explicit-any
  29:10  error    Unsafe call of a(n) `any` typed value                                                     @typescript-eslint/no-unsafe-call
  29:17  error    Unsafe member access .message on an `any` value                                           @typescript-eslint/no-unsafe-member-access
  42:20  error    Unexpected any. Specify a different type                                                  @typescript-eslint/no-explicit-any
  43:10  error    Unsafe call of a(n) `any` typed value                                                     @typescript-eslint/no-unsafe-call
  43:17  error    Unsafe member access .message on an `any` value                                           @typescript-eslint/no-unsafe-member-access
  67:21  error    Unexpected any. Specify a different type                                                  @typescript-eslint/no-explicit-any
  69:11  error    Unsafe call of a(n) `any` typed value                                                     @typescript-eslint/no-unsafe-call
  69:18  error    Unsafe member access .message on an `any` value                                           @typescript-eslint/no-unsafe-member-access
  76:3   error    Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/protocol/stateManager.ts
   11:28  error    Unexpected any. Specify a different type                                                                  @typescript-eslint/no-explicit-any
  127:4   error    Unexpected console statement. Only these console methods are allowed: warn, error, debug                  no-console
  156:24  warning  Use 'FileManager.trashFile()' instead of 'Vault.delete()' to respect the user's file deletion preference  obsidianmd/prefer-file-manager-trash-file
  218:5   error    Unexpected console statement. Only these console methods are allowed: warn, error, debug                  no-console
  239:4   error    Unexpected console statement. Only these console methods are allowed: warn, error, debug                  no-console

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/settings.ts
   23:3   error  For a consistent UI use `new Setting(containerEl).setName(...).setHeading()` instead of creating HTML heading elements directly  obsidianmd/settings-tab/no-manual-html-headings
   23:38  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
   26:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
   39:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
   52:3   error  For a consistent UI use `new Setting(containerEl).setName(...).setHeading()` instead of creating HTML heading elements directly  obsidianmd/settings-tab/no-manual-html-headings
   55:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
   67:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
   79:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
   91:3   error  For a consistent UI use `new Setting(containerEl).setName(...).setHeading()` instead of creating HTML heading elements directly  obsidianmd/settings-tab/no-manual-html-headings
   91:38  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
   94:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
   98:26  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
   99:25  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
  100:25  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
  109:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
  121:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
  134:3   error  For a consistent UI use `new Setting(containerEl).setName(...).setHeading()` instead of creating HTML heading elements directly  obsidianmd/settings-tab/no-manual-html-headings
  137:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
  149:13  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
  153:32  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
  154:27  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case
  168:21  error  Use sentence case for UI text                                                                                                    obsidianmd/ui/sentence-case

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/commands/commands.ts
  13:3  error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins  obsidianmd/commands/no-plugin-id-in-command-id
  22:3  error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins  obsidianmd/commands/no-plugin-id-in-command-id
  31:3  error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins  obsidianmd/commands/no-plugin-id-in-command-id
  40:3  error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins  obsidianmd/commands/no-plugin-id-in-command-id

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/commands/mainCommands.ts
  10:3  error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins  obsidianmd/commands/no-plugin-id-in-command-id
  19:3  error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins  obsidianmd/commands/no-plugin-id-in-command-id

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/commands/metadataCommands.ts
   26:3   error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins                                             obsidianmd/commands/no-plugin-id-in-command-id
   31:16  error  Use sentence case for UI text                                                                                                                                       obsidianmd/ui/sentence-case
   48:3   error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins                                             obsidianmd/commands/no-plugin-id-in-command-id
   52:16  error  Use sentence case for UI text                                                                                                                                       obsidianmd/ui/sentence-case
   58:16  error  Use sentence case for UI text                                                                                                                                       obsidianmd/ui/sentence-case
   74:3   error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins                                             obsidianmd/commands/no-plugin-id-in-command-id
   80:6   error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator  @typescript-eslint/no-floating-promises
   90:3   error  The command ID should not include the plugin ID. Obsidian will make sure that there are no conflicts with other plugins                                             obsidianmd/commands/no-plugin-id-in-command-id
   96:6   error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator  @typescript-eslint/no-floating-promises
  113:14  error  Use sentence case for UI text                                                                                                                                       obsidianmd/ui/sentence-case
  134:14  error  Use sentence case for UI text                                                                                                                                       obsidianmd/ui/sentence-case
  140:14  error  Use sentence case for UI text                                                                                                                                       obsidianmd/ui/sentence-case

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/components/colorPicker.ts
   46:3  error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
   47:3  error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   48:3  error  Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties    obsidianmd/no-static-styles-assignment
   51:3  error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
   52:3  error  Avoid setting styles directly via `element.style.gap`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
   53:3  error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   54:3  error  Avoid setting styles directly via `element.style.flexWrap`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties      obsidianmd/no-static-styles-assignment
   59:4  error  Avoid setting styles directly via `element.style.width`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
   60:4  error  Avoid setting styles directly via `element.style.height`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
   61:4  error  Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   64:4  error  Avoid setting styles directly via `element.style.cursor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
   74:3  error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
   75:3  error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   76:3  error  Avoid setting styles directly via `element.style.marginTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
   77:3  error  Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties    obsidianmd/no-static-styles-assignment
   80:3  error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
   81:3  error  Avoid setting styles directly via `element.style.gap`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
   82:3  error  Avoid setting styles directly via `element.style.alignItems`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties    obsidianmd/no-static-styles-assignment
   89:3  error  Avoid setting styles directly via `element.style.flexGrow`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties      obsidianmd/no-static-styles-assignment
   90:3  error  Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
   91:3  error  Avoid setting styles directly via `element.style.border`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
   92:3  error  Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   93:3  error  Avoid setting styles directly via `element.style.fontFamily`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties    obsidianmd/no-static-styles-assignment
   97:3  error  Avoid setting styles directly via `element.style.width`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
   98:3  error  Avoid setting styles directly via `element.style.height`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
   99:3  error  Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  101:3  error  Avoid setting styles directly via `element.style.border`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/components/folderCombobox.ts
   92:3   error  Avoid setting styles directly via `element.style.cssText`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   96:3   error  Avoid setting styles directly via `element.style.cssText`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  138:65  error  Avoid casting to 'TFolder'. Use an 'instanceof TFolder' check to safely narrow the type                                                                                             obsidianmd/no-tfile-tfolder-cast
  206:4   error  Avoid setting styles directly via `element.style.cssText`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  210:5   error  Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  211:5   error  Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  238:4   error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  248:4   error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/components/timelineRenderer.ts
   51:3   error    Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   62:3   error    Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
   63:3   error    Avoid setting styles directly via `element.style.paddingLeft`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties      obsidianmd/no-static-styles-assignment
   67:3   error    Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
   68:3   error    Avoid setting styles directly via `element.style.left`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties             obsidianmd/no-static-styles-assignment
   69:3   error    Avoid setting styles directly via `element.style.top`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties              obsidianmd/no-static-styles-assignment
   70:3   error    Avoid setting styles directly via `element.style.bottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
   71:3   error    Avoid setting styles directly via `element.style.width`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
   72:3   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   82:3   error    Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
   83:3   error    Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
   87:3   error    Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
   88:3   error    Avoid setting styles directly via `element.style.left`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties             obsidianmd/no-static-styles-assignment
   89:3   error    Avoid setting styles directly via `element.style.top`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties              obsidianmd/no-static-styles-assignment
   90:3   error    Avoid setting styles directly via `element.style.width`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
   91:3   error    Avoid setting styles directly via `element.style.height`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
   92:3   error    Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
   94:3   error    Avoid setting styles directly via `element.style.border`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
   95:3   error    Avoid setting styles directly via `element.style.boxShadow`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
   96:3   error    Avoid setting styles directly via `element.style.cursor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  100:3   error    Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  101:3   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  102:3   error    Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  107:3   error    Avoid setting styles directly via `element.style.margin`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  108:3   error    Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  109:3   error    Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  114:4   error    Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  115:4   error    Avoid setting styles directly via `element.style.gap`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties              obsidianmd/no-static-styles-assignment
  116:4   error    Avoid setting styles directly via `element.style.flexWrap`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  117:4   error    Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  121:5   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  122:5   error    Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  123:5   error    Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  124:5   error    Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  125:5   error    Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  126:5   error    Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  133:4   error    Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  134:4   error    Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  135:4   error    Avoid setting styles directly via `element.style.marginTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  136:4   error    Avoid setting styles directly via `element.style.borderTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  137:4   error    Avoid setting styles directly via `element.style.paddingTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  139:10  warning  'doc' is assigned a value but never used                                                                                                                                            @typescript-eslint/no-unused-vars
  147:3   error    Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  148:3   error    Avoid setting styles directly via `element.style.left`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties             obsidianmd/no-static-styles-assignment
  149:3   error    Avoid setting styles directly via `element.style.top`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties              obsidianmd/no-static-styles-assignment
  150:3   error    Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  151:3   error    Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  152:3   error    Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  153:3   error    Avoid setting styles directly via `element.style.width`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  154:3   error    Avoid setting styles directly via `element.style.textAlign`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  160:3   error    Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  161:3   error    Avoid setting styles directly via `element.style.overflowX`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  162:3   error    Avoid setting styles directly via `element.style.paddingBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties    obsidianmd/no-static-styles-assignment
  163:3   error    Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  167:3   error    Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  168:3   error    Avoid setting styles directly via `element.style.top`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties              obsidianmd/no-static-styles-assignment
  169:3   error    Avoid setting styles directly via `element.style.left`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties             obsidianmd/no-static-styles-assignment
  170:3   error    Avoid setting styles directly via `element.style.right`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  171:3   error    Avoid setting styles directly via `element.style.height`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  172:3   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  173:3   error    Avoid setting styles directly via `element.style.zIndex`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  183:3   error    Avoid setting styles directly via `element.style.minWidth`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  184:3   error    Avoid setting styles directly via `element.style.marginRight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties      obsidianmd/no-static-styles-assignment
  185:3   error    Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  186:21  error    Unexpected any. Specify a different type                                                                                                                                            @typescript-eslint/no-explicit-any
  186:26  error    Unsafe member access .flexShrink on an `any` value                                                                                                                                  @typescript-eslint/no-unsafe-member-access
  190:3   error    Avoid setting styles directly via `element.style.position`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  191:3   error    Avoid setting styles directly via `element.style.top`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties              obsidianmd/no-static-styles-assignment
  192:3   error    Avoid setting styles directly via `element.style.left`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties             obsidianmd/no-static-styles-assignment
  193:3   error    Avoid setting styles directly via `element.style.transform`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  194:3   error    Avoid setting styles directly via `element.style.width`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  195:3   error    Avoid setting styles directly via `element.style.height`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  196:3   error    Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  198:3   error    Avoid setting styles directly via `element.style.border`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  199:3   error    Avoid setting styles directly via `element.style.boxShadow`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  200:3   error    Avoid setting styles directly via `element.style.cursor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  201:3   error    Avoid setting styles directly via `element.style.zIndex`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  205:3   error    Avoid setting styles directly via `element.style.marginTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  206:3   error    Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  207:3   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  208:3   error    Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  213:3   error    Avoid setting styles directly via `element.style.margin`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  214:3   error    Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  215:3   error    Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  216:3   error    Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  220:3   error    Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  221:3   error    Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  241:5   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  244:5   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  256:4   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/contextMenu/descriptionContextMenu.ts
  34:16  error  Use sentence case for UI text  obsidianmd/ui/sentence-case
  38:19  error  Use sentence case for UI text  obsidianmd/ui/sentence-case

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/handlers/modalHandlers.ts
   10:31  warning  'EntityGroup' is defined but never used                                                   @typescript-eslint/no-unused-vars
   11:28  warning  'ChildNoteConfig' is defined but never used                                               @typescript-eslint/no-unused-vars
   44:10  error    Expected an assignment or function call and instead saw an expression                     @typescript-eslint/no-unused-expressions
   44:10  error    Unexpected `await` of a non-Promise (non-"Thenable") value                                @typescript-eslint/await-thenable
   46:18  warning  'e' is defined but never used                                                             @typescript-eslint/no-unused-vars
   54:30  error    Unexpected `await` of a non-Promise (non-"Thenable") value                                @typescript-eslint/await-thenable
  113:11  error    Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console
  126:73  error    Invalid type "unknown" of template literal expression                                     @typescript-eslint/restrict-template-expressions
  145:46  error    Invalid type "unknown" of template literal expression                                     @typescript-eslint/restrict-template-expressions
  188:29  error    Unexpected `await` of a non-Promise (non-"Thenable") value                                @typescript-eslint/await-thenable
  238:51  error    Invalid type "unknown" of template literal expression                                     @typescript-eslint/restrict-template-expressions
  282:8   error    Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console
  301:48  error    Invalid type "unknown" of template literal expression                                     @typescript-eslint/restrict-template-expressions
  351:42  error    Unsafe argument of type `any` assigned to a parameter of type `TFile`                     @typescript-eslint/no-unsafe-argument
  351:59  error    Unexpected any. Specify a different type                                                  @typescript-eslint/no-explicit-any
  363:29  error    Unsafe argument of type `any` assigned to a parameter of type `TFile`                     @typescript-eslint/no-unsafe-argument
  363:46  error    Unexpected any. Specify a different type                                                  @typescript-eslint/no-explicit-any
  385:51  error    Invalid type "unknown" of template literal expression                                     @typescript-eslint/restrict-template-expressions

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/__tests__/keyTermModal.test.ts
  0:0  error  Parsing error: /Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/__tests__/keyTermModal.test.ts was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/descriptionModal.ts
   54:10  error    Use sentence case for UI text                                                                                                                                                       obsidianmd/ui/sentence-case
   62:3   error    Avoid setting styles directly via `element.style.cssText`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   69:7   warning  'searchInput' is assigned a value but never used                                                                                                                                    @typescript-eslint/no-unused-vars
   83:3   error    Avoid setting styles directly via `element.style.cssText`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  105:5   error    Avoid setting styles directly via `element.style.cssText`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  118:19  error    Use sentence case for UI text                                                                                                                                                       obsidianmd/ui/sentence-case
  123:18  error    This assertion is unnecessary since it does not change the type of the expression                                                                                                   @typescript-eslint/no-unnecessary-type-assertion
  124:20  error    This assertion is unnecessary since it does not change the type of the expression                                                                                                   @typescript-eslint/no-unnecessary-type-assertion
  170:4   error    Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  180:4   error    Avoid setting styles directly via `element.style.cssText`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  184:5   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  185:5   error    Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  195:5   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  200:6   error    Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/keyTermModal.ts
  185:33  error    Use sentence case for UI text               obsidianmd/ui/sentence-case
  196:10  error    Use sentence case for UI text               obsidianmd/ui/sentence-case
  219:21  error    Use sentence case for UI text               obsidianmd/ui/sentence-case
  227:21  error    Use sentence case for UI text               obsidianmd/ui/sentence-case
  235:21  error    Use sentence case for UI text               obsidianmd/ui/sentence-case
  268:10  warning  'label' is assigned a value but never used  @typescript-eslint/no-unused-vars
  291:21  error    Use sentence case for UI text               obsidianmd/ui/sentence-case

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/metadataReviewModal.test.ts
    1:31  warning  'EntityGroup' is defined but never used  @typescript-eslint/no-unused-vars
    8:13  error    'jest' is not defined                    no-undef
    9:18  error    'jest' is not defined                    no-undef
   10:20  error    'jest' is not defined                    no-undef
   14:1   error    'describe' is not defined                no-undef
   24:2   error    'beforeEach' is not defined              no-undef
   25:3   error    'jest' is not defined                    no-undef
   26:30  error    'jest' is not defined                    no-undef
   27:37  error    'jest' is not defined                    no-undef
   31:2   error    'describe' is not defined                no-undef
   32:3   error    'test' is not defined                    no-undef
   33:4   error    'expect' is not defined                  no-undef
   36:3   error    'test' is not defined                    no-undef
   38:4   error    'expect' is not defined                  no-undef
   39:4   error    'expect' is not defined                  no-undef
   40:4   error    'expect' is not defined                  no-undef
   43:3   error    'test' is not defined                    no-undef
   47:4   error    'expect' is not defined                  no-undef
   50:3   error    'test' is not defined                    no-undef
   53:4   error    'expect' is not defined                  no-undef
   56:3   error    'test' is not defined                    no-undef
   59:4   error    'expect' is not defined                  no-undef
   62:3   error    'test' is not defined                    no-undef
   64:4   error    'expect' is not defined                  no-undef
   66:4   error    'expect' is not defined                  no-undef
   70:2   error    'describe' is not defined                no-undef
   71:3   error    'test' is not defined                    no-undef
   75:4   error    'expect' is not defined                  no-undef
   76:4   error    'expect' is not defined                  no-undef
   79:3   error    'test' is not defined                    no-undef
   84:4   error    'expect' is not defined                  no-undef
   87:3   error    'test' is not defined                    no-undef
   92:4   error    'expect' is not defined                  no-undef
   95:3   error    'test' is not defined                    no-undef
  100:4   error    'expect' is not defined                  no-undef
  103:3   error    'test' is not defined                    no-undef
  109:4   error    'expect' is not defined                  no-undef
  113:4   error    'expect' is not defined                  no-undef
  114:4   error    'expect' is not defined                  no-undef
  118:2   error    'describe' is not defined                no-undef
  119:3   error    'test' is not defined                    no-undef
  122:4   error    'expect' is not defined                  no-undef
  125:3   error    'test' is not defined                    no-undef
  130:4   error    'expect' is not defined                  no-undef
  133:3   error    'test' is not defined                    no-undef
  137:4   error    'expect' is not defined                  no-undef
  140:3   error    'test' is not defined                    no-undef
  144:4   error    'expect' is not defined                  no-undef
  148:2   error    'describe' is not defined                no-undef
  149:3   error    'beforeEach' is not defined              no-undef
  157:3   error    'test' is not defined                    no-undef
  160:4   error    'expect' is not defined                  no-undef
  163:3   error    'test' is not defined                    no-undef
  166:4   error    'expect' is not defined                  no-undef
  169:3   error    'test' is not defined                    no-undef
  172:4   error    'expect' is not defined                  no-undef
  175:3   error    'test' is not defined                    no-undef
  178:4   error    'expect' is not defined                  no-undef
  181:3   error    'test' is not defined                    no-undef
  184:4   error    'expect' is not defined                  no-undef
  188:2   error    'describe' is not defined                no-undef
  189:3   error    'test' is not defined                    no-undef
  196:4   error    'expect' is not defined                  no-undef
  197:4   error    'expect' is not defined                  no-undef
  198:4   error    'expect' is not defined                  no-undef
  201:3   error    'test' is not defined                    no-undef
  206:4   error    'expect' is not defined                  no-undef
  210:2   error    'describe' is not defined                no-undef
  211:3   error    'test' is not defined                    no-undef
  213:4   error    'expect' is not defined                  no-undef
  216:3   error    'test' is not defined                    no-undef
  221:4   error    'expect' is not defined                  no-undef
  224:3   error    'test' is not defined                    no-undef
  229:4   error    'expect' is not defined                  no-undef
  233:2   error    'describe' is not defined                no-undef
  234:3   error    'test' is not defined                    no-undef
  252:4   error    'expect' is not defined                  no-undef
  253:4   error    'expect' is not defined                  no-undef
  254:4   error    'expect' is not defined                  no-undef
  257:3   error    'test' is not defined                    no-undef
  270:4   error    'expect' is not defined                  no-undef
  272:5   error    'expect' is not defined                  no-undef

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/metadataReviewModal.ts
   52:9   warning  'traverse' is assigned a value but never used  @typescript-eslint/no-unused-vars
  201:36  error    Use sentence case for UI text                  obsidianmd/ui/sentence-case
  217:22  error    Use sentence case for UI text                  obsidianmd/ui/sentence-case
  218:23  error    Unexpected prompt                              no-alert

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/subMetadataModal.test.ts
    1:28  warning  'ChildNoteConfig' is defined but never used  @typescript-eslint/no-unused-vars
    7:13  error    'jest' is not defined                        no-undef
    8:18  error    'jest' is not defined                        no-undef
    9:20  error    'jest' is not defined                        no-undef
   13:1   error    'describe' is not defined                    no-undef
   23:2   error    'beforeEach' is not defined                  no-undef
   24:3   error    'jest' is not defined                        no-undef
   25:30  error    'jest' is not defined                        no-undef
   26:37  error    'jest' is not defined                        no-undef
   35:2   error    'describe' is not defined                    no-undef
   36:3   error    'test' is not defined                        no-undef
   37:4   error    'expect' is not defined                      no-undef
   40:3   error    'test' is not defined                        no-undef
   42:4   error    'expect' is not defined                      no-undef
   45:3   error    'test' is not defined                        no-undef
   48:4   error    'expect' is not defined                      no-undef
   51:3   error    'test' is not defined                        no-undef
   55:4   error    'expect' is not defined                      no-undef
   58:3   error    'test' is not defined                        no-undef
   61:4   error    'expect' is not defined                      no-undef
   64:3   error    'test' is not defined                        no-undef
   66:4   error    'expect' is not defined                      no-undef
   67:4   error    'expect' is not defined                      no-undef
   71:2   error    'describe' is not defined                    no-undef
   72:3   error    'test' is not defined                        no-undef
   74:4   error    'expect' is not defined                      no-undef
   77:3   error    'test' is not defined                        no-undef
   80:4   error    'expect' is not defined                      no-undef
   83:3   error    'test' is not defined                        no-undef
   86:4   error    'expect' is not defined                      no-undef
   89:3   error    'test' is not defined                        no-undef
   93:4   error    'expect' is not defined                      no-undef
   98:3   error    'test' is not defined                        no-undef
  101:4   error    'expect' is not defined                      no-undef
  105:4   error    'expect' is not defined                      no-undef
  109:2   error    'describe' is not defined                    no-undef
  110:3   error    'beforeEach' is not defined                  no-undef
  114:3   error    'test' is not defined                        no-undef
  116:4   error    'expect' is not defined                      no-undef
  117:4   error    'expect' is not defined                      no-undef
  120:3   error    'test' is not defined                        no-undef
  123:4   error    'expect' is not defined                      no-undef
  124:4   error    'expect' is not defined                      no-undef
  127:3   error    'test' is not defined                        no-undef
  130:4   error    'expect' is not defined                      no-undef
  133:3   error    'test' is not defined                        no-undef
  136:4   error    'expect' is not defined                      no-undef
  139:3   error    'test' is not defined                        no-undef
  142:4   error    'expect' is not defined                      no-undef
  145:3   error    'test' is not defined                        no-undef
  147:4   error    'expect' is not defined                      no-undef
  150:3   error    'test' is not defined                        no-undef
  151:4   error    'expect' is not defined                      no-undef
  154:3   error    'test' is not defined                        no-undef
  162:4   error    'expect' is not defined                      no-undef
  165:3   error    'test' is not defined                        no-undef
  172:4   error    'expect' is not defined                      no-undef
  173:4   error    'expect' is not defined                      no-undef
  177:2   error    'describe' is not defined                    no-undef
  178:3   error    'test' is not defined                        no-undef
  182:4   error    'expect' is not defined                      no-undef
  183:4   error    'expect' is not defined                      no-undef
  184:4   error    'expect' is not defined                      no-undef
  185:4   error    'expect' is not defined                      no-undef
  188:3   error    'test' is not defined                        no-undef
  194:4   error    'expect' is not defined                      no-undef
  195:4   error    'expect' is not defined                      no-undef
  202:3   error    'test' is not defined                        no-undef
  206:4   error    'expect' is not defined                      no-undef
  207:4   error    'expect' is not defined                      no-undef
  210:3   error    'test' is not defined                        no-undef
  230:4   error    'expect' is not defined                      no-undef
  231:4   error    'expect' is not defined                      no-undef
  234:3   error    'test' is not defined                        no-undef
  251:4   error    'expect' is not defined                      no-undef
  259:2   error    'describe' is not defined                    no-undef
  260:3   error    'test' is not defined                        no-undef
  262:4   error    'expect' is not defined                      no-undef
  263:4   error    'expect' is not defined                      no-undef
  266:3   error    'test' is not defined                        no-undef
  271:4   error    'expect' is not defined                      no-undef
  272:4   error    'expect' is not defined                      no-undef
  275:3   error    'test' is not defined                        no-undef
  280:4   error    'expect' is not defined                      no-undef
  283:3   error    'test' is not defined                        no-undef
  287:4   error    'expect' is not defined                      no-undef
  290:4   error    'expect' is not defined                      no-undef
  296:2   error    'describe' is not defined                    no-undef
  297:3   error    'test' is not defined                        no-undef
  298:4   error    'expect' is not defined                      no-undef
  301:3   error    'test' is not defined                        no-undef
  302:4   error    'expect' is not defined                      no-undef
  305:3   error    'test' is not defined                        no-undef
  306:4   error    'expect' is not defined                      no-undef
  309:3   error    'test' is not defined                        no-undef
  310:4   error    'expect' is not defined                      no-undef
  313:3   error    'test' is not defined                        no-undef
  314:4   error    'expect' is not defined                      no-undef
  315:4   error    'expect' is not defined                      no-undef
  319:2   error    'describe' is not defined                    no-undef
  320:3   error    'test' is not defined                        no-undef
  327:4   error    'expect' is not defined                      no-undef
  328:4   error    'expect' is not defined                      no-undef
  331:3   error    'test' is not defined                        no-undef
  342:4   error    'expect' is not defined                      no-undef
  344:4   error    'expect' is not defined                      no-undef
  347:3   error    'test' is not defined                        no-undef
  360:4   error    'expect' is not defined                      no-undef
  363:3   error    'test' is not defined                        no-undef
  371:4   error    'expect' is not defined                      no-undef
  376:3   error    'test' is not defined                        no-undef
  393:4   error    'expect' is not defined                      no-undef
  396:3   error    'test' is not defined                        no-undef
  413:4   error    'expect' is not defined                      no-undef
  417:2   error    'describe' is not defined                    no-undef
  418:3   error    'test' is not defined                        no-undef
  422:4   error    'expect' is not defined                      no-undef
  426:4   error    'expect' is not defined                      no-undef
  430:4   error    'expect' is not defined                      no-undef
  434:4   error    'expect' is not defined                      no-undef
  436:5   error    'expect' is not defined                      no-undef
  437:5   error    'expect' is not defined                      no-undef
  441:3   error    'test' is not defined                        no-undef
  451:4   error    'expect' is not defined                      no-undef
  454:4   error    'expect' is not defined                      no-undef
  460:3   error    'test' is not defined                        no-undef
  462:4   error    'expect' is not defined                      no-undef
  466:4   error    'expect' is not defined                      no-undef
  471:4   error    'expect' is not defined                      no-undef
  472:5   error    'expect' is not defined                      no-undef
  478:3   error    'test' is not defined                        no-undef
  490:4   error    'expect' is not defined                      no-undef
  491:4   error    'expect' is not defined                      no-undef

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/subMetadataModal.ts
  213:36  error  Use sentence case for UI text  obsidianmd/ui/sentence-case
  274:23  error  Use sentence case for UI text  obsidianmd/ui/sentence-case
  279:23  error  Use sentence case for UI text  obsidianmd/ui/sentence-case
  284:23  error  Use sentence case for UI text  obsidianmd/ui/sentence-case
  289:23  error  Use sentence case for UI text  obsidianmd/ui/sentence-case
  298:23  error  Use sentence case for UI text  obsidianmd/ui/sentence-case
  313:21  error  Use sentence case for UI text  obsidianmd/ui/sentence-case
  317:8   error  Unexpected alert               no-alert

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/timelineModal.test.ts
    2:25  warning  'SnapshotTimeline' is defined but never used  @typescript-eslint/no-unused-vars
    7:11  error    'jest' is not defined                         no-undef
    8:16  error    'jest' is not defined                         no-undef
    9:18  error    'jest' is not defined                         no-undef
   13:1   error    'describe' is not defined                     no-undef
   48:1   error    'beforeEach' is not defined                   no-undef
   49:1   error    'jest' is not defined                         no-undef
   53:1   error    'describe' is not defined                     no-undef
   54:1   error    'test' is not defined                         no-undef
   55:1   error    'expect' is not defined                       no-undef
   58:1   error    'test' is not defined                         no-undef
   60:1   error    'expect' is not defined                       no-undef
   61:1   error    'expect' is not defined                       no-undef
   62:1   error    'expect' is not defined                       no-undef
   65:1   error    'test' is not defined                         no-undef
   67:1   error    'expect' is not defined                       no-undef
   68:1   error    'expect' is not defined                       no-undef
   72:1   error    'describe' is not defined                     no-undef
   73:1   error    'test' is not defined                         no-undef
   75:1   error    'expect' is not defined                       no-undef
   78:1   error    'test' is not defined                         no-undef
   80:1   error    'expect' is not defined                       no-undef
   84:1   error    'describe' is not defined                     no-undef
   85:1   error    'test' is not defined                         no-undef
   87:1   error    'expect' is not defined                       no-undef
   91:1   error    'describe' is not defined                     no-undef
   92:1   error    'test' is not defined                         no-undef
   94:1   error    'expect' is not defined                       no-undef
   97:1   error    'test' is not defined                         no-undef
   99:1   error    'expect' is not defined                       no-undef
  103:1   error    'describe' is not defined                     no-undef
  104:1   error    'test' is not defined                         no-undef
  108:1   error    'expect' is not defined                       no-undef
  109:1   error    'expect' is not defined                       no-undef
  110:1   error    'expect' is not defined                       no-undef
  111:1   error    'expect' is not defined                       no-undef
  112:1   error    'expect' is not defined                       no-undef
  115:1   error    'test' is not defined                         no-undef
  117:1   error    'expect' is not defined                       no-undef
  121:1   error    'describe' is not defined                     no-undef
  122:1   error    'test' is not defined                         no-undef
  126:1   error    'expect' is not defined                       no-undef
  127:1   error    'expect' is not defined                       no-undef
  128:1   error    'expect' is not defined                       no-undef
  131:1   error    'test' is not defined                         no-undef
  135:1   error    'expect' is not defined                       no-undef
  136:1   error    'expect' is not defined                       no-undef
  140:1   error    'describe' is not defined                     no-undef
  141:1   error    'test' is not defined                         no-undef
  157:1   error    'expect' is not defined                       no-undef
  161:1   error    'describe' is not defined                     no-undef
  162:1   error    'test' is not defined                         no-undef
  168:1   error    'expect' is not defined                       no-undef
  171:1   error    'expect' is not defined                       no-undef
  172:1   error    'expect' is not defined                       no-undef

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/timelineModal.ts
  189:11  warning  'groupHeader' is assigned a value but never used                        @typescript-eslint/no-unused-vars
  385:36  error    Use sentence case for UI text                                           obsidianmd/ui/sentence-case
  397:13  error    Use sentence case for UI text                                           obsidianmd/ui/sentence-case
  407:37  error    Use sentence case for UI text                                           obsidianmd/ui/sentence-case
  417:35  error    Use sentence case for UI text                                           obsidianmd/ui/sentence-case
  422:18  error    Unexpected any. Specify a different type                                @typescript-eslint/no-explicit-any
  422:23  error    Unsafe member access ._eventText on an `any` value                      @typescript-eslint/no-unsafe-member-access
  427:22  error    Use sentence case for UI text                                           obsidianmd/ui/sentence-case
  428:11  error    Unsafe assignment of an `any` value                                     @typescript-eslint/no-unsafe-assignment
  428:31  error    Unexpected any. Specify a different type                                @typescript-eslint/no-explicit-any
  428:36  error    Unsafe member access ._eventText on an `any` value                      @typescript-eslint/no-unsafe-member-access
  429:9   error    Unsafe call of a(n) `any` typed value                                   @typescript-eslint/no-unsafe-call
  429:14  error    Unsafe member access .trim on an `any` value                            @typescript-eslint/no-unsafe-member-access
  430:26  error    Unsafe argument of type `any` assigned to a parameter of type `string`  @typescript-eslint/no-unsafe-argument
  431:19  error    Unexpected any. Specify a different type                                @typescript-eslint/no-explicit-any
  431:24  error    Unsafe member access ._eventText on an `any` value                      @typescript-eslint/no-unsafe-member-access
  444:21  error    Use sentence case for UI text                                           obsidianmd/ui/sentence-case
  448:8   error    Unexpected alert                                                        no-alert

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/modals/timelineSnapshotModal.ts
   43:36  error    Use sentence case for UI text                 obsidianmd/ui/sentence-case
   51:22  error    Use sentence case for UI text                 obsidianmd/ui/sentence-case
  102:9   warning  'indexEl' is assigned a value but never used  @typescript-eslint/no-unused-vars
  163:16  error    Use sentence case for UI text                 obsidianmd/ui/sentence-case

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/views/mainPanelView.ts
   24:10  error  Use sentence case for UI text                                                                                                                                                       obsidianmd/ui/sentence-case
   37:3   error  Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   40:49  error  Use sentence case for UI text                                                                                                                                                       obsidianmd/ui/sentence-case
   41:3   error  Avoid setting styles directly via `element.style.marginTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
   42:3   error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
   43:3   error  Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
   47:3   error  Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
   48:3   error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
   82:3   error  Avoid setting styles directly via `element.style.marginTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
   83:3   error  Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   84:3   error  Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   85:3   error  Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
   86:3   error  Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
   87:3   error  Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
   88:3   error  Do not write to DOM directly using innerHTML/outerHTML property                                                                                                                     @microsoft/sdl/no-inner-html
  105:3   error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  108:3   error  Avoid setting styles directly via `element.style.margin`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  109:3   error  Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  110:3   error  Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  111:3   error  Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  112:3   error  Avoid setting styles directly via `element.style.textTransform`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties    obsidianmd/no-static-styles-assignment
  113:3   error  Avoid setting styles directly via `element.style.letterSpacing`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties    obsidianmd/no-static-styles-assignment
  127:3   error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  130:3   error  Avoid setting styles directly via `element.style.width`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  131:3   error  Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  132:3   error  Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  133:3   error  Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  134:3   error  Avoid setting styles directly via `element.style.border`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  135:3   error  Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  136:3   error  Avoid setting styles directly via `element.style.cursor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  137:3   error  Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  138:3   error  Avoid setting styles directly via `element.style.textAlign`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  139:3   error  Avoid setting styles directly via `element.style.transition`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  142:4   error  Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  146:4   error  Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
  149:33  error  Promise returned in function argument where a void return was expected                                                                                                              @typescript-eslint/no-misused-promises
  152:11  error  Unsafe call of a(n) `any` typed value                                                                                                                                               @typescript-eslint/no-unsafe-call
  152:24  error  Unexpected any. Specify a different type                                                                                                                                            @typescript-eslint/no-explicit-any
  152:29  error  Unsafe member access .commands on an `any` value                                                                                                                                    @typescript-eslint/no-unsafe-member-access
  161:4   error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  162:4   error  Avoid setting styles directly via `element.style.marginTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  163:4   error  Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  164:4   error  Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/ui/views/timelineView.ts
   52:3   error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   53:3   error  Avoid setting styles directly via `element.style.flexDirection`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties    obsidianmd/no-static-styles-assignment
   54:3   error  Avoid setting styles directly via `element.style.height`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
   58:3   error  Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   59:3   error  Avoid setting styles directly via `element.style.borderBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
   60:3   error  Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   62:51  error  Use sentence case for UI text                                                                                                                                                       obsidianmd/ui/sentence-case
   63:3   error  Avoid setting styles directly via `element.style.margin`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
   67:3   error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   68:3   error  Avoid setting styles directly via `element.style.gap`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties              obsidianmd/no-static-styles-assignment
   69:3   error  Avoid setting styles directly via `element.style.flexWrap`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
   72:56  error  Use sentence case for UI text                                                                                                                                                       obsidianmd/ui/sentence-case
   73:3   error  Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   74:3   error  Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   75:3   error  Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
   76:3   error  Avoid setting styles directly via `element.style.border`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
   77:3   error  Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
   78:3   error  Avoid setting styles directly via `element.style.cursor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
   80:15  error  Use sentence case for UI text                                                                                                                                                       obsidianmd/ui/sentence-case
   85:3   error  Avoid setting styles directly via `element.style.display`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
   86:3   error  Avoid setting styles directly via `element.style.flex`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties             obsidianmd/no-static-styles-assignment
   87:3   error  Avoid setting styles directly via `element.style.overflowY`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
   91:3   error  Avoid setting styles directly via `element.style.width`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
   92:3   error  Avoid setting styles directly via `element.style.borderRight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties      obsidianmd/no-static-styles-assignment
   93:3   error  Avoid setting styles directly via `element.style.backgroundColor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties  obsidianmd/no-static-styles-assignment
   94:3   error  Avoid setting styles directly via `element.style.overflowY`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
   95:3   error  Avoid setting styles directly via `element.style.paddingTop`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  101:3   error  Avoid setting styles directly via `element.style.flex`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties             obsidianmd/no-static-styles-assignment
  102:3   error  Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  103:3   error  Avoid setting styles directly via `element.style.overflowY`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties        obsidianmd/no-static-styles-assignment
  108:11  error  Use sentence case for UI text                                                                                                                                                       obsidianmd/ui/sentence-case
  126:4   error  Avoid setting styles directly via `element.style.padding`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties          obsidianmd/no-static-styles-assignment
  127:4   error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  130:4   error  Avoid setting styles directly via `element.style.cursor`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  131:4   error  Avoid setting styles directly via `element.style.borderRadius`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  134:4   error  Avoid setting styles directly via `element.style.fontWeight`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties       obsidianmd/no-static-styles-assignment
  135:4   error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  138:4   error  Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  139:4   error  Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  144:5   error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator                  @typescript-eslint/no-floating-promises
  173:3   error  Avoid setting styles directly via `element.style.marginBottom`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties     obsidianmd/no-static-styles-assignment
  176:3   error  Avoid setting styles directly via `element.style.margin`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties           obsidianmd/no-static-styles-assignment
  179:3   error  Avoid setting styles directly via `element.style.fontSize`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties         obsidianmd/no-static-styles-assignment
  180:3   error  Avoid setting styles directly via `element.style.color`. Use CSS classes for better theming and maintainability. Use the `setCssProps` function to change CSS properties            obsidianmd/no-static-styles-assignment
  199:3   error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator                  @typescript-eslint/no-floating-promises
  216:5   error  Promises must be awaited, end with a call to .catch, end with a call to .then with a rejection handler or be explicitly marked as ignored with the `void` operator                  @typescript-eslint/no-floating-promises

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/__tests__/csvParser.test.ts
  0:0  error  Parsing error: /Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/__tests__/csvParser.test.ts was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/__tests__/idGenerator.test.ts
  0:0  error  Parsing error: /Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/__tests__/idGenerator.test.ts was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/__tests__/performanceLogger.test.ts
  0:0  error  Parsing error: /Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/__tests__/performanceLogger.test.ts was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/__tests__/wikilinker.test.ts
  0:0  error  Parsing error: /Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/__tests__/wikilinker.test.ts was not found by the project service. Consider either including it in the tsconfig.json or including it in allowDefaultProject

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/csvParser.ts
  26:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/errorHandler.ts
  10:27  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  75:8   error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/frontmatterHelper.ts
   4:71  error    Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  42:5   error    Unsafe assignment of an `any` value                                                @typescript-eslint/no-unsafe-assignment
  42:13  error    This assertion is unnecessary since it does not change the type of the expression  @typescript-eslint/no-unnecessary-type-assertion
  42:34  error    Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  43:13  warning  'e' is defined but never used                                                      @typescript-eslint/no-unused-vars
  47:4   error    Unsafe assignment of an `any` value                                                @typescript-eslint/no-unsafe-assignment
  47:20  error    Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  49:4   error    Unsafe assignment of an `any` value                                                @typescript-eslint/no-unsafe-assignment
  49:21  error    Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any
  51:4   error    Unsafe assignment of an `any` value                                                @typescript-eslint/no-unsafe-assignment
  51:29  error    Unexpected any. Specify a different type                                           @typescript-eslint/no-explicit-any

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/helpers.ts
  33:2  error  Unsafe return of a value of type `any`  @typescript-eslint/no-unsafe-return

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/performanceLogger.ts
   10:28  error  Unexpected any. Specify a different type                                                  @typescript-eslint/no-explicit-any
   62:29  error  Unexpected any. Specify a different type                                                  @typescript-eslint/no-explicit-any
  252:29  error  Unsafe argument of type `any` assigned to a parameter of type `TFile`                     @typescript-eslint/no-unsafe-argument
  252:45  error  Unexpected any. Specify a different type                                                  @typescript-eslint/no-explicit-any
  257:4   error  Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console
  270:4   error  Unexpected console statement. Only these console methods are allowed: warn, error, debug  no-console

/Users/cassiataylor/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/metadata-organizer/src/utils/wikilinker.ts
   44:32  error  Unnecessary escape character: \[                no-useless-escape
  111:24  error  Unnecessary escape character: \[                no-useless-escape
  169:30  error  Unnecessary escape character: \[                no-useless-escape
  170:9   error  Unsafe assignment of an `any` value             @typescript-eslint/no-unsafe-assignment
  170:17  error  Unsafe call of a(n) `any` typed value           @typescript-eslint/no-unsafe-call
  170:25  error  Unsafe member access .split on an `any` value   @typescript-eslint/no-unsafe-member-access
  171:3   error  Unsafe return of a value of type `any`          @typescript-eslint/no-unsafe-return
  171:16  error  Unsafe member access .length on an `any` value  @typescript-eslint/no-unsafe-member-access
  171:35  error  Unsafe member access [1] on an `any` value      @typescript-eslint/no-unsafe-member-access
  171:47  error  Unsafe member access [0] on an `any` value      @typescript-eslint/no-unsafe-member-access

✖ 776 problems (751 errors, 25 warnings)
  42 errors and 1 warning potentially fixable with the `--fix` option.

cassiataylor@Cassias-Command-Centre metadata-organizer % 