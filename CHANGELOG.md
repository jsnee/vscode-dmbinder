# Change Log
### Planned Changes
- When generating a dungeon map, save settings to a Markdown comment before the map
- Bundle extension package to reduce extension size
- Add unit testing
- Cleanup package.json
  - Sort and remove unused commands
  - Hide commands from command palette (where appropriate)

## 0.4.1
- Bugfixes
  - DMB Autogenerate removes comments

## 0.4.0
- Allow images to be rendered to PDF
- Autogenerate ids for headers (to be used for linking within a document)

## 0.3.6
- Cleanup package.json
  - Revisit extension activations
- Catch Puppeteer errors (incompatible Chrome/Puppeteer versions can cause strange errors) and suggest use of recommended revision of Chromium

## 0.3.5
- Allow content generator configs to specify weighted random list of values (like rolling on a table)
- Allow specification of certain parameters for content generation (like specifying a gender or race when generating an NPC name)
- Allow conditional content generation

## 0.3.4
- Allow adding folders from the DM Binder view
- Allow adding files from the DM Binder view
- Fix missing files listed in campaign config breaking the extension

## 0.3.3
- Make sure the dmbinder.autogenerateOnRender setting actually does something (whoops)

## 0.3.2
- Added a bunch of Homebrewery snippets
- Added autogeneration of components

## 0.3.1
- Added a dungeon generator, based on the one from donjon.bin.sh originally written in Perl

## 0.3.0
- Removed abandoned "conditionalValues" feature from content generator code and dmbgen.json schema definition
- Fixed content generator variable storage and recall to use last set value (variables are set with syntax "{generatorName:variableToSet}") when recalling values (variables are recalled with syntax"{:variableToRecall}")
- Bugfix to add in some DMBinder commands that were missing from the extension activation events listing

## 0.2.9
- Added multi-line generators which use *all* the strings listed in the "values" array, separated by newline characters

## 0.2.8
- Added new generator type ("import") to specify generators to be imported from a separate config file
- Added Command Palette command for generator that prompts the user to optionally override each template token

## 0.2.7
- Fix generator source file issue

## 0.2.6
- Apply filtering to Command Palette for certain commands
- Automatically refresh the campaign when 'campaign.json' is modified
- Handle JSON components specifying templateItem
- Added text generation system

## 0.2.5
- Fix pretty nasty README issue that screwed up most of the documentation

## 0.2.4
- Added usage and other documentation
- Various minor tweaks

## 0.2.3
- Render PDFs using own MarkdownIt instance

## 0.2.2
- Remove included Win64 Chromium executable (to reduce extension size)
- Added recommended Chromium revision (one that renders fonts correctly)

## 0.2.1
- Bugfix for cleaning up temporary files used to generate PDFs

## 0.2.0
- Added the ability for Puppeteer to use a local Chrome executable to render PDFs
- Added a command to download specific revisions of Chromium for use by Puppeteer to render PDFs
- Fixed some README typos

## 0.1.2
- Added file type filtering to 'Split' views
- Fixed the PDF renderer adding an extra blank page
- Bugfixes

## 0.1.1
- Added new feature to render all files in campaign to PDF

## 0.1.0
- Added ability to render sources to PDF

## 0.0.6
- Fix refresh campaign showing up on other extensions

## 0.0.5
- Fix font color issue

## 0.0.4
- Markdown preview bugfix

## 0.0.3
- Cleanup
- Bugfixes

## 0.0.2
- Added extension icon

## 0.0.1
- Initial release