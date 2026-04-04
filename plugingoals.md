What I want for this plugin:

A visual-based APP that allows quick reorganisation and instant linking of terms to locate sources and descriptions with ease. 
Command-line elements are only for manual application. A visual Obsidian app (Pane) should have buttons that do this. 

The basics of the program should use chunking to help memory load. Chunking should be internal memory only, not something available to the user, and cleared upon metadata review end/ switching active document.

This plugin does not need to expose .docx type files in the obsidian viewer, as another plugin by the name Docxer does this.

Document Scanning:
- This has the following functions: uses mammoth to convert docx to html then to markdown.
- This markdown becomes the 'source' document for this session instead of the .docx file. If document scanned is a markdown, then use the original markdown, not a duplication.
- Creates a dynamic array of all the unique words/meaningful tokens / phrases in the 1st scanned document. If this is not the first scanned document, the existing array is given new terms from the new scanned document, and word occurences are updated to include additions from this scanned document as well. Example: 50 occurrences in docA.docx and 20 occurences in docB.docx = 70 occurences in array. 
- Check if the scanned document is a 'Chapter' or not. Key identifiers of a chapter: file name contains 'CH', 'Chapter', part 1, low confidence words make a significant majority, very few unique characters (square brackets, brackets, backslash), mostly prose. 
- scan for temporal terms (then, before, once, past, present, etc.) and make them wikilinks ( square brackets). Adds temporal tags for each temporal term to frontmatter.
- Creates frontmatter for document markdown. Frontmatter contains all basic important groups and tags like characters, locations, temporal tags, etc. Whether the document is a chapter, general, glossary, index, other... 
- prioritise existing formatting as a hint to what are keywords/ important phrases (headings), and also frequency/occurence of words outside of basic grammar (aka unique terms)
- prompts user with a 'key term' selection modal. In this modal the user either selects or deselects suggested terms. At the bottom of modal is apply and cancel. Cancel closes the modal, making no changes, while apply should classify every one of the key terms as keyterms AND wikilink every instance of them in the text. This means making them [[inside double square brackets]]. Eg. Void becomes a key term, so everytime void appears again in the text, it must be wikilinked. 
- Modal has all keyterms from the entire document, but loads according to chunks so the memory load isn't too bad. Modal adds suggested keyterms to the list as the chunks are scanned, so modal must be 'scrollable'. Apply promotes all selected keyterms to keyterms, cancel closes modal without changes. This list of keyterms can be arranged in alphabetical order in a 'master metadata' JSON file, so that if a document is scanned again, duplicate keyterms aren't written into the list.


 MetaData Review:
- opens new modal with all confirmed keywords. 
- Top of modal: there is a m/n counter, with n being the number of chunks, or 'modal pages' remaining, and m being the page the user is currently vewing. This requires all chunks to be counted before proposing terms to the user. 
- Next section: Groups
- A list of proposed key terms appear. User can click 'add group' to add a group section, then select terms. Clicking 'add selected' for a specific group adds all the selected terms into the group. Other options include 'remove all', 'remove selected', 'deselect all', 'select all'. 
- Above each and every group section the user makes, there's a drop down menu and a text box. Inputting something into the text box 'names' the group. using the drop down menu selects a folder. All folders, even nested ones, should be available for selection with this option. Should show the filepath eg. documents/lore. User should hit 'confirm' to save the name of the group for that modal page. To edit it, click the edit button that appears after entering clicking 'confirm', then the text becomes editable again. 
- At the bottom: tags. These should be clicked to delete, so that incorrect tags are removed if user wants it to be. There should also be a text box that enables the user to add more tags, with 'confirm' adding the tag to the list. 
- FInal section: forwards and backwards buttons. Forwards takes you to another modal page, while backwards takes you to the prior modal page. Only named groups (ones that have had 'confirmed' clicked) should have their states saved. otherwise, user sorting doesn't need to remain saved when switching pages. 
- On the final page is 'apply', or 'cancel'. Apply prompts the user with a final message (do you want to apply these changes? yes/no). yes proceeds to do below, no returns them back to the modal. At no point in time should the modal close until after 'yes' is clicked. If cancel is clicked, the prompt (do you want to cancel these changes? progress won't be saved. yes/no) appears for the user to select from. Yes closes the modal. No does the same thing as the apply confirmation prompt.
- Apply, once selected, does the following: 
- Creates a folder for each group name, named after the group name.
- Creates one 'parent' markdown inside each folder. The markdown carries the same name as the group and its respective folder. Aka. 'Lucy' folder has 'Lucy' markdown, but 'Icecream' folder has 'Icecream' markdown. 
- Parent markdown contains: every keyterm that user put into the group, all wiklinked (so in [[brackets]]), in table format, with links to their source document in one column.
- creates a tag with format foldername/filename for each keyterm and adds it to the source document frontmatter. Formatted so tags are sorted by folder. 
- updates master metadata so each keyterm section also has its official tag documented.


Parent Markdown
- The parent markdown contains all the initial group keyterms. It's a document for quick access to the specific notes, the 'index' of the group. It has its own frontmatter with all its contained keyterms, empty Description section (user added), and the table of wikilinked keywords. Has explicitly 'parent' as one of its frontmatter tags.

Sub Metadata Review:
- very similar to metadata review, but is only available on an active document that's a parent markdown. Brings up a modal with all the group's keywords. User can then select which tags to create notes for (usually it happens when user clicks on an unlinked wikilink. I want to automate this)
- Creates 'child' notes for each keyterm selected. file names of child notes are name of the keyterm. Child notes have child note frontmatter, tags, wikilink to parent markdown, table of all sources of this word (format document, line), and empty description. 




Timeline Visualiser:
- the visual element of this obsidian 'app'/plugin. A timeline that shows concurrent events
- User must use 'generate timeline' command/button in app panel to create it. It will refer to array from document scanning to find occurrences of temporal terms and their order or arrangement in the document. Then it will bring up a timeline modal. User can click and drag generated 'events' ( only full sentences, wikilinked to source document) along 'snapshot' timeline to reorder them. Can delete events by clicking the cross icon like tags. Apply adds 'snapshot timeline' to the master timeline as a selectable section to move to where user wants. 

- Master timeline is located in the app panel. User can reorder just like snapshot timeline modal, can also colourcode (hex or sample colours?), can drag under events to show concurrent events (mermaid), can delete, add markers with labels (clicking on empty space in timeline and filling in text box), create custom event - click button then select spot on timeline, then add text. Can modify event fields with edit icon, can add wikilinks. 


Timeline file:
- JSON file for master timeline. Can be inside protocol folder. contains 'event IDs'. use similar id generation as entities. event ids are wikilinked and connect to timeline modal. If clicked anywhere in document, should select event on the timeline app/pane, or bring up snapshot modal for quick editing. 

Hub file: 
- Compendium/table of cross-referenced concepts. When more than one different key term appears in the same sentence. 'Void' and 'Lucy', for example. Filled out whenever document scanning is completed.
- Per row is: a column containing term matches ( void + lucy, or void + vincent + magic), all wikilinked, a column for how many times this occurs in text (frequency/occurrence), and a column for the source documents. 

Glossary: 
- list format that shows parent-child folder tree. Has all descriptions. 

Master Metadata:
- protocol file. JSON of all groups, timeline info(?), any other important metadata stuff. 

Temporal tags:
- temporal tags have no innate relationship to keywords unless manually added to parent or child markdown. The tags themselves are only used for timeline creation and quickly finding sentences that are possible events.
- however, they should still have their sources and occurrences documented
- they can be generated with overall metadata review and sub metadata review, but they aren't folder dependent. 

Protocol folder:
- created upon first document scan. has all the JSON files and metadata stuff that isn't important for the user to see directly. 
- contains a 'log' folder that contains subfolders for: document scanning, metadata review, submetadata review, description creation. All user actions are logged in the markdowns created here whenever a user activates and completes an option. This includes listing all the keyterms selected, error handling, logging changes to master metadata, scanning of new document, etc.

Other:

- keep open the possibility of nested folders, child folders of child folders, etc. 
- When a docx file type is scanned, a markdown of the docx is created. This markdown is NOT split.
- EVERY key term should be wikilinked if they're selected when 'apply' is clicked. This means it's in square brackets, links directly to its note, and the word is replaced in the markdown for every occurence. If I click 'Lucy' from any document, I should be brought to the Lucy note. If I hover over 'Lucy', I should see a preview of the description and/or other details (this is automatic in Obsidian when a note exists for that word)
- modals are NOT the same as the panel/app/viewbox that the master timeline and general option buttons are. These are individual boxes that appear. 

'Create Description':

User highlights text and right clicks. Right clicking should bring up this as an option. When it's clicked, a new modal appears with the highlighted text inside a text box. Here, the user can modify it. Above this text box is another text box for the user to search for the file they wish to add a description for. A 'combobox'. When apply is selected, it adds this piece of higlighted/text box text to the markdown they searched for. Aka a sentence is higlighted, user searches for and selects 'magic', then clicks apply. If user locates the magic note, the description is no longer empty, but contains this piece of added text. cancel closes the modal with no changes. 



Inside this plugin directory is a useful script written in python which requires:
Python 3 + pip
PyYAML pip install pyyaml

Name: batchlinkr.py


VERY IMPORTANT:

This plugin is designed with the intention of being an expanding, inter-linked database. Scanning a new document should not: 
- replace existing terms altogether
- overwrite data
- change anything prior.
Scanning in a new document should:
- increment word frequency data in array
- add new keyterms to master metadata
- compare found keyterms against master metadata to locate duplication and remove those from the modal suggestions
- update document sources to account new document(s) as well. 


Options in the future:
- find keyterms missing notes
- find conflicts in master metadata vs hubs, glossary, etc. 

