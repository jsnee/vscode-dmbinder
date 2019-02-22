import { Uri, window, workspace, ViewColumn, commands, QuickPickOptions, TextDocumentShowOptions, QuickPickItem, extensions, ProgressLocation, ProgressOptions } from 'vscode';
import { Campaign } from './models/Campaign';
import { exec } from 'child_process';
import { ITreeItem } from './models/ITreeItem';
import { campaignExplorerProvider } from './campaignExplorerProvider';
import { DMBSettings } from './Settings';
import { renderCampaign } from './renderer';
import * as matter from 'gray-matter';
import * as fse from 'fs-extra';
import { BrowserFetcher } from './BrowserFetcher';

export async function promptChooseChromeExecutable(): Promise<void> {
    const execPath = await window.showOpenDialog({
        openLabel: "Use Selected Chrome",
        canSelectMany: false
    });
    if (!execPath && DMBSettings.chromeExecutablePath) {
        // let items: QuickPickItem[] = [
        //     {
        //         label: "Keep Existing",
        //         description: DMBSettings.chromeExecutablePath
        //     },
        //     {
        //         label: "Clear Existing",
        //         description: "Use Default Instead"
        //     }
        // ];
        // const keepExistingChoice = await window.showQuickPick(items, { })
    }
    if (execPath && execPath.length === 1 && await fse.pathExists(execPath[0].fsPath)) {
        DMBSettings.chromeExecutablePath = execPath[0].fsPath;
    }
}

export async function promptDownloadChromiumRevision(): Promise<void> {
    const chromeRev = await window.showInputBox({
        placeHolder: "Chromium Revision Number"
    });
    if (chromeRev) {
        let fetcher = new BrowserFetcher();
        if (await fetcher.canDownload(chromeRev)) {
            let progOpts: ProgressOptions = {
                location: ProgressLocation.Notification,
                title: `Downloading Chromium Revision`
            };
            window.withProgress(progOpts, async (progress, token) => {
                progress.report({
                    message: chromeRev
                });
                let revInfo = await fetcher.download(chromeRev);
                if (revInfo) {
                    DMBSettings.chromeExecutablePath = revInfo.executablePath;
                } else {
                    window.showErrorMessage(`Failed to download Chromium revision ${chromeRev}`);
                }
            });
        } else {
            window.showErrorMessage(`"${chromeRev}" is not a valid Chromium revision number for the given platform (${await fetcher.platform()})`);
        }
    }
}

async function initCampaign(path: Uri): Promise<Campaign | undefined> {
    if (path) {
        window.showInformationMessage('Creating new campaign in: ' + path.fsPath);
        if (await Campaign.hasCampaignConfig(path.fsPath)) {
            window.showInformationMessage('A DMBinder already exists in the selected folder.');
            return new Campaign(path.fsPath);
        } else {
            const campaignName = await window.showInputBox({ placeHolder: 'Campaign Name', ignoreFocusOut: true });

            if (campaignName) {
                if (await Campaign.init(path.fsPath, campaignName)) {
                    window.showInformationMessage('Campaign Created!');
                    return new Campaign(path.fsPath);
                }
            } else {
                window.showErrorMessage('Something happened while trying to setup the campaign...');
            }
        }
    }
    return;
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
            await initCampaign(currFolder.uri);
        }
    } else {
        window.showErrorMessage('You need to open up a folder in VS Code before you can initialize a DMBinder campaign.');
        return;
    }
}

export async function promptSelectCampaign(promptText: string = "Select a campaign", noPromptIfOne: boolean = false): Promise<Campaign | undefined> {
    const campaignPaths = await campaignExplorerProvider.listCampaignPaths();
    if (campaignPaths) {
        if (campaignPaths.length === 1 && noPromptIfOne) {
            return new Campaign(campaignPaths[0]);
        }
        const qpCampaigns: QuickPickItem[] = [];
        for (let campaignPath of campaignPaths) {
            let campaign = new Campaign(campaignPath);
            qpCampaigns.push({
                label: campaign.campaignName,
                detail: campaign.campaignPath
            });
        }
        const qpOpts: QuickPickOptions = {
            canPickMany: false,
            ignoreFocusOut: true,
            placeHolder: promptText
        };
        let campaignItem = await window.showQuickPick(qpCampaigns, qpOpts);
        if (campaignItem && campaignItem.detail) {
            return new Campaign(campaignItem.detail);
        }
    }
    return;
}

export async function renderCampaignSources(campaignPath?: string): Promise<void> {
    if (campaignPath && await Campaign.hasCampaignConfig(campaignPath)) {
        await renderCampaign(new Campaign(campaignPath));
    } else {
        let campaign = await promptSelectCampaign(undefined, true);
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

export async function promptGenerateComponent(item?: ITreeItem): Promise<string | undefined> {
    let componentUri: Uri | undefined;
    if (!item || !item.getTreeItem) {
        const qpComponentList = await campaignExplorerProvider.getComponentItems();
        if (qpComponentList) {
            const qpComponentOpts: QuickPickOptions = {
                canPickMany: false,
                ignoreFocusOut: true,
                placeHolder: 'Select the component to use'
            };
            let componentItem = await window.showQuickPick(qpComponentList, qpComponentOpts);
            if (componentItem && componentItem.detail) {
                componentUri = Uri.file(componentItem.detail);
            }
        }
    } else {
        const treeItem = await item.getTreeItem();
        componentUri = treeItem.resourceUri;
    }
    if (componentUri) {
        const qpItemList = await campaignExplorerProvider.getTemplateItems();
        if (qpItemList) {
            let metadata = matter.read(componentUri.fsPath, { delimiters: ['---', '...'] });
            let templateItem: QuickPickItem | undefined;
            if (metadata && metadata.data && metadata.data.templateItem) {
                templateItem = qpItemList.find((each) => each.label === `${metadata.data.templateItem}`);
            }
            if (!templateItem) {
                const qpOpts: QuickPickOptions = {
                    canPickMany: false,
                    ignoreFocusOut: true,
                    placeHolder: 'Select the template to use'
                };
                templateItem = await window.showQuickPick(qpItemList, qpOpts);
            }
            let templatePath: Uri | undefined;
            if (templateItem && templateItem.detail) {
                templatePath = Uri.file(templateItem.detail);
            }
            if (templatePath) {
                let metadataPath = componentUri;
                if (metadataPath) {
                    return await buildComponent(templatePath.fsPath, metadataPath.fsPath);
                }
            }
        }
    }
    return;
}

export async function promptBuildComponent(item?: ITreeItem): Promise<void> {
    let result = await promptGenerateComponent(item);
    if (result) {
        const doc = await workspace.openTextDocument({
            content: result
        });
        await window.showTextDocument(doc, ViewColumn.Active);
    }
}

export async function promptInsertComponent(item?: ITreeItem): Promise<void> {
    let result = await promptGenerateComponent(item);
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

export function getExtensionPath(): string {
    let result = extensions.getExtension('jpsnee.vscode-dmbinder');
    if (!result) {
        return '';
    }
    return result.extensionPath;
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

export async function buildComponent(templatePath: string, metadataPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        exec(`echo '' | pandoc --template="${templatePath}" --metadata-file="${metadataPath}" --metadata pagetitle=" "`, (error, stdout, stderr) => {
            resolve(stderr || stdout);
        });
    });
}