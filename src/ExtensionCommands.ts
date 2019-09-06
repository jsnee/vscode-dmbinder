import { Uri, window, workspace, ViewColumn, commands, QuickPickOptions, TextDocumentShowOptions, Range } from 'vscode';
import { Campaign } from './Campaign';
import { ITreeItem } from './ui/ITreeItem';
import { campaignExplorerProvider } from './ui/campaignExplorerProvider';
import { DMBSettings } from './Settings';
import { renderCampaign } from './homebrewery/renderer';
import * as matter from 'gray-matter';
import * as fse from 'fs-extra';
import { GeneratorSource } from './generators/content/GeneratorSource';
import { DungeonGeneratorConfig, parseDungeonGeneratorConfig } from './generators/dungeon/DungeonGeneratorConfig';
import { DungeonGenerator } from './generators/dungeon/DungeonGenerator';
import { CampaignHelper } from './helpers/CampaignHelper';
import { ComponentHelper } from './helpers/ComponentHelper';
import { DungeonGeneratorHelper } from './helpers/DungeonGeneratorHelper';
import { GeneratorVars } from './generators/content/BaseContentGenerator';
import { PuppeteerHelper } from './helpers/PuppeteerHelper';

export namespace ExtensionCommands {
    export async function promptChooseChromeExecutable(): Promise<void> {
        const execPath = await window.showOpenDialog({
            openLabel: "Use Selected Chrome",
            canSelectMany: false
        });
        if (execPath && execPath.length === 1 && await fse.pathExists(execPath[0].fsPath)) {
            await DMBSettings.updateChromeExecutablePath(execPath[0].fsPath);
        }
    }

    export async function promptDownloadChromiumRevision(): Promise<void> {
        let suggestedRevision = PuppeteerHelper.recommendedChromiumVersion();
        const chromeRev = await window.showInputBox({
            prompt: `Recommended revision: ${suggestedRevision}`,
            value: suggestedRevision,
            placeHolder: "Chromium Revision Number"
        });
        await PuppeteerHelper.downloadChromiumRevision(chromeRev);
    }

    export async function promptInitCampaign(): Promise<void> {
        const currFolder = workspace.workspaceFolders ? workspace.workspaceFolders[0] : undefined;
        if (currFolder) {
            const qpOpts: QuickPickOptions = {
                canPickMany: false,
                ignoreFocusOut: true,
                placeHolder: 'Create a new DM Binder campaign in the current folder? (' + currFolder.uri.path + ')'
            };
            const confirmInit = await window.showQuickPick(['Yes', 'No'], qpOpts);
            if (confirmInit && confirmInit === 'Yes') {
                // TODO: status bar tricks
                await CampaignHelper.initCampaign(currFolder.uri);
            }
        } else {
            window.showErrorMessage('You need to open up a folder in VS Code before you can initialize a DMBinder campaign.');
            return;
        }
    }

    export async function renderCampaignSources(campaignPath?: string): Promise<void> {
        if (campaignPath && await Campaign.hasCampaignConfig(campaignPath)) {
            await renderCampaign(new Campaign(campaignPath));
        } else {
            let campaign = await CampaignHelper.promptSelectCampaign(undefined, true);
            if (campaign) {
                await renderCampaign(campaign);
            }
        }
        return;
    }

    export async function editTreeItem(item?: ITreeItem): Promise<void> {
        if (item && item.getTreeItem) {
            let treeItem = await item.getTreeItem();
            if (treeItem && treeItem.resourceUri) {
                let opts: TextDocumentShowOptions = {
                    preview: false
                };
                commands.executeCommand('vscode.open', treeItem.resourceUri, opts);
            }
        }
    }

    export async function promptBuildComponent(item?: ITreeItem): Promise<void> {
        let result = await ComponentHelper.promptGenerateComponent(item);
        if (result) {
            const doc = await workspace.openTextDocument({
                content: result
            });
            await window.showTextDocument(doc, ViewColumn.Active);
        }
    }

    export async function promptInsertComponent(item?: ITreeItem): Promise<void> {
        let result = await ComponentHelper.promptGenerateComponent(item, true);
        if (result) {
            let editor = window.activeTextEditor;
            let res = result;
            if (editor) {
                let selection = editor.selection;
                await editor.edit((editBuilder) => {
                    editBuilder.replace(selection, res);
                });
            }
        }
    }

    export function toggleTreeViewStyle() {
        switch (DMBSettings.treeViewStyle) {
            case 'split':
                DMBSettings.treeViewStyle = 'composite';
                break;
            case 'composite':
            default:
                DMBSettings.treeViewStyle = 'split';
                break;
        }
    }

    export function toggleHomebreweryEnabled() {
        DMBSettings.homebreweryEnabled = !DMBSettings.homebreweryEnabled;
    }

    export async function generateElementFromConfig(item?: ITreeItem): Promise<void> {
        let activeTextEditor = window.activeTextEditor;
        let context: GeneratorVars = {};
        if (activeTextEditor && activeTextEditor.selection && !activeTextEditor.selection.isEmpty) {
            let selection = activeTextEditor.selection;
            // Try to grab config from selection
            let selectedText = activeTextEditor.document.getText(new Range(selection.start, selection.end));
            if (matter.test(selectedText, { delimiters: ['---', '---'] })) {
                try {
                    context = matter(selectedText, { delimiters: ['---', '---'] }).data as GeneratorVars;
                } catch (ex) {
                    throw Error("Failed to parse selected content as generator context!");
                }
            }
        }
        let generatorUri: Uri | undefined;
        if (!item || !item.getTreeItem) {
            const qpItemList = await campaignExplorerProvider.getGeneratorItems();
            if (qpItemList && qpItemList.length) {
                const qpOpts: QuickPickOptions = {
                    canPickMany: false,
                    placeHolder: 'Select the generator to use'
                };
                const generatorItem = await window.showQuickPick(qpItemList, qpOpts);
                if (generatorItem && generatorItem.detail) {
                    generatorUri = Uri.file(generatorItem.detail);
                }
            } else {
                window.showWarningMessage("No valid generator configs found.");
            }
        } else {
            const treeItem = await item.getTreeItem();
            generatorUri = treeItem.resourceUri;
        }
        if (generatorUri) {
            let generator = await GeneratorSource.loadGeneratorSource(generatorUri.fsPath);
            let editor = window.activeTextEditor;
            let res = await generator.generateContent(context);
            if (editor) {
                let selection = editor.selection;
                await editor.edit((editBuilder) => {
                    editBuilder.replace(selection, res);
                });
            }
        }
    }

    export async function generateElementFromConfigPromptArgs(item?: ITreeItem): Promise<void> {
        let generatorUri: Uri | undefined;
        if (!item || !item.getTreeItem) {
            const qpItemList = await campaignExplorerProvider.getGeneratorItems();
            if (qpItemList && qpItemList.length) {
                const qpOpts: QuickPickOptions = {
                    canPickMany: false,
                    placeHolder: 'Select the generator to use'
                };
                const generatorItem = await window.showQuickPick(qpItemList, qpOpts);
                if (generatorItem && generatorItem.detail) {
                    generatorUri = Uri.file(generatorItem.detail);
                }
            } else {
                window.showWarningMessage("No valid generator configs found.");
            }
        } else {
            const treeItem = await item.getTreeItem();
            generatorUri = treeItem.resourceUri;
        }
        if (generatorUri) {
            let generator = await GeneratorSource.loadGeneratorSource(generatorUri.fsPath);
            let editor = window.activeTextEditor;
            let res = await generator.generateContent({}, DungeonGeneratorHelper.promptGeneratorInput);
            if (editor) {
                let selection = editor.selection;
                await editor.edit((editBuilder) => {
                    editBuilder.replace(selection, res);
                });
            }
        }
    }

    export async function generateDungeonMap(): Promise<void> {
        let activeTextEditor = window.activeTextEditor;
        let config: DungeonGeneratorConfig | undefined;
        if (activeTextEditor && activeTextEditor.selection && !activeTextEditor.selection.isEmpty) {
            let selection = activeTextEditor.selection;
            // Try to grab config from selection
            let selectedText = activeTextEditor.document.getText(new Range(selection.start, selection.end));
            if (matter.test(selectedText, { delimiters: ["---", "---"] })) {
                let data = matter(selectedText, { delimiters: ["---", "---"] }).data;
                
                if (data.seed !== undefined ||
                    data.rowCount !== undefined ||
                    data.columnCount !== undefined ||
                    data.dungeonLayout !== undefined ||
                    data.minimumRoomSize !== undefined ||
                    data.maximumRoomSize !== undefined ||
                    data.roomLayout !== undefined ||
                    data.corridorLayout !== undefined ||
                    data.removeDeadendsRatio !== undefined ||
                    data.addStairCount !== undefined ||
                    data.mapStyle !== undefined ||
                    data.cellSize !== undefined ||
                    data.mapPadding !== undefined) {
                    config = parseDungeonGeneratorConfig(
                        data.seed,
                        data.rowCount,
                        data.columnCount,
                        data.dungeonLayout,
                        data.minimumRoomSize,
                        data.maximumRoomSize,
                        data.roomLayout,
                        data.corridorLayout,
                        data.removeDeadendsRatio,
                        data.addStairCount,
                        data.mapStyle,
                        data.cellSize,
                        data.mapPadding);
                    }
            }
        }
        if (!config) {
            // Prompt for the config
            config = await DungeonGeneratorHelper.promptGenerateDungeonMapSettings();
        }
        if (config) {
            try {
                let generator = new DungeonGenerator(config);
                let result = generator.generate();
                const doc = await workspace.openTextDocument({
                    content: result,
                    language: "markdown"
                });
                await window.showTextDocument(doc, ViewColumn.Active);
            } catch (ex) {
                console.log(ex);
            }
        }
    }

    export async function autogenerateComponents(): Promise<void> {
        let editor = window.activeTextEditor;
        if (editor) {
            await ComponentHelper.autogenerateDocumentComponents(editor.document);
        } else {
            window.showWarningMessage("No opened document found.");
        }
    }
}