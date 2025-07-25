# Change Log

## 0.5.14
### Fixed
- Fixed body margin that appeared when rendering to PDF

## 0.5.13
### Fixed
- Added `printBackground` Puppeteer PDF option to properly render background images

## 0.5.12
### Fixed
- Homebrewery preview styles are only applied if `dmbinder.homebrewPreviewEnabled` setting is enabled
  - Removing the previous solution to this problem
  - Now the preview should work for unsaved markdown files, too

## 0.5.11
### Fixed
- Homebrewery preview styles are only applied if `dmbinder.homebrewPreviewEnabled` setting is enabled
  - This time the styles are put in the `.vscode` directory since markdown styles need to be relative to the workspace

## 0.5.10
### Fixed
- Homebrewery preview styles are only applied if `dmbinder.homebrewPreviewEnabled` setting is enabled

## 0.5.9
### Added
- Ability to set document orientation
  - Landscape or Portrait (Defaults to Portrait)

### Fixed
- Fixed HTML rendering to PDF before page has finished loading

## 0.5.8
### Fixed
- Fixed HTML page ids being in reverse

## 0.5.7
### Added
- Ability to render a specific page layout (paper size)
  - Supported sizes include: "Letter", "Legal", "Tabloid", "Ledger", "A0", "A1", "A2", "A3", "A4", "A5", and "A6"

### Fixed
- Fixed various node dependency vulnerabilities

## 0.5.6 - 2019-10-15
### Added
- New DMBinder terminal
  - `autogen` command autogenerates all "autogen" components in current document.
  - `component` command builds a component
  - `list` command lists components/templates/generators
  - `generate` command generates content based on a given configuration
  - `roll` command generates a randomly rolled outcome
  - `help` command displays usage information (in general or for a specified command)
  - `exit` command closes the terminal

## 0.5.5
- Fix some more component autogeneration issues

## 0.5.4
- Fix some component autogeneration issues

## 0.5.3
- Removed some view options accidentally showing up on other extension views
- Removed logging to debug console on startup

## 0.5.2
- Added repeat generator syntax in generator expression

## 0.5.1
- Added some unit tests
- Added Python's format specification to dice roll generator expressions

## 0.5.0
- Added dice rolling to generator expression syntax

## 0.4.9
- Clicking on the campaign name in the status bar opens the campaign's config file
- Added a button to toggle the campaign explorer layout to the campaign explorer
- Migrated documentation to the GitHub wiki

## 0.4.8
- Added a RollTable content generator, replacing the basic generator method (was not very efficient)
- Fixed some broken error handling (trying to print Error object to error message)

## 0.4.7
- Fixed templates/components not working when not stored on the C: drive in Windows
- Also added some error messages when building a component fails

## 0.4.6
- Added templating with [Handlebars](https://handlebarsjs.com/) (really, just a beefed up version of Mustache)
  - *NOTE:* Mustache is still supported and is treated as a separate rendering engine
- Set the default rendering engine to Handlebars
- Cleaned up the README a bit (still have a lot more to do)

## 0.4.5
- Added Templating with [Mustache](https://mustache.github.io)

## 0.4.4
- Webpack for real this time
- Automatically determine which version of Chromium the installed version of puppeteer-core prefers
- Add snippet for autogenerated component
- Inserting a component now includes the autogeneration tags ("Build component" still omits autogeneration tags)

## 0.4.3
- Webpack broke extension, rolling back to fix

## 0.4.2
- Bundle extension package to reduce extension size and load time

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