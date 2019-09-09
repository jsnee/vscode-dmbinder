# vscode-dmbinder
Visual Studio Code extension for managing campaign documents.

## Documentation
Documentation of how to use vscode-dmbinder has now moved to our [wiki](https://github.com/jsnee/vscode-dmbinder/wiki)!

## Installation
Requires [Visual Studio Code](https://code.visualstudio.com/download). Once VSCode is installed, search for the extension or install it from [here](https://marketplace.visualstudio.com/items?itemName=jpsnee.vscode-dmbinder).

## Features
- DMBinder view that helps organize campaign documents
- Generation of Hombrewery elements using snippets and templating (Mustache, Handlebars or Pandoc)
- Rendering of markdown files to PDF using Puppeteer
- Randomly generate dungeon maps
- Generation of content (like names, titles, locations, etc.) using randomized lists or Markov chains
- Random generation of basic dungeon maps

## Issues or Feature Requests
Please submit any issues or new feature requests to [GitHub](https://github.com/jsnee/vscode-dmbinder/issues).

## DMBinder Explorer
The extension looks for `.dmbinder/campaign.json` in your workspace folders, and displays all DMBinder campaigns in the sidebar.

<details>
<summary>DMBinder Explorer screenshot</summary>

![DMBinder Explorer Screenshot](img/screenshots/explorer.png)

</details><!--DMBinder Explorer screenshot -->

## Configuration Settings
- `dmbinder.generateGettingStartedEnabled`
- `dmbinder.homebrewPreviewEnabled`
- `dmbinder.autogenerateOnRender`
- `dmbinder.treeViewStyle`
- `dmbinder.chromeExecutablePath`
- `dmbinder.defaultTemplatingEngine` (Default: "handlebars")

## campaign.json
Below is an example Campaign configuration file:
``` json
{
    "campaignName": "My Cool Campaign",
    "sourcePaths": [
        "./source/"
    ],
    "templatePaths": [
        "./templates/"
    ],
    "componentPaths": [
        "./components/"
    ],
    "generatorPaths": [
        "./generator-sources"
    ],
    "outDirectory": "./out/"
}
```

## Planned Changes
- When generating a dungeon map, save settings to a Markdown comment before the map

See [generator-dmbinder](https://github.com/jsnee/generator-dmbinder) for a yeoman generator to help bootstrap a campaign binder.

See [Changelog](CHANGELOG.md) for release notes.

-----------------------------------------------------------------------------------------------------------

## Icon Sources
- [Material Design Icons](https://materialdesignicons.com/)
- Official icons (various icons from Microsoft's vscode repo)
- [GitHub's Octicons](https://github.com/primer/octicons/tree/master/lib/octicons_node) using [Microsoft's vscode icon tool](https://github.com/microsoft/vscode-octicons-font)

## Related Projects
- [Homebrewery](https://github.com/naturalcrit/homebrewery)
- [homebrewery-vscode](https://github.com/OfficerHalf/homebrewery-vscode)