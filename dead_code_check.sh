#!/bin/bash

# Find all TypeScript files and exported functions
echo "=== Checking for unused exported functions ==="

# List of exported functions (from manual inspection)
functions=(
  "countTermOccurrences"
  "countWikilinkedOccurrences"
  "removeWikilinks"
  "replaceWikilinkedTerm"
  "validateEntity"
  "validateSettings"
  "isValidFolderPath"
  "isValidMarkdownFilename"
  "getHashFromId"
  "getSeqFromId"
  "createMarkdownFromDocx"
  "parseCSV"
  "serializeCSV"
  "findEntityByName"
  "getEntitiesByGroup"
  "logHubCoOccurrence"
  "logGlossaryUpdate"
  "logTimelineOperation"
  "buildIndex"
  "getOrCreateEntity"
  "extractWikilinks"
  "isTermWikilinked"
  "getTermFromWikilink"
  "injectWikilinks"
)

for func in "${functions[@]}"; do
  # Count occurrences outside of definition and tests
  count=$(grep -r "$func" src/ --include="*.ts" ! -path "*/__tests__/*" 2>/dev/null | grep -v "^[^:]*:export" | wc -l)
  if [ "$count" -eq 1 ]; then
    # Only 1 match = the export itself, no other calls
    echo "POSSIBLY DEAD: $func (only 1 occurrence - the export)"
  fi
done
