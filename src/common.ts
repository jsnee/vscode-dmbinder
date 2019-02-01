import { Uri, window, workspace, ViewColumn, commands, QuickPickOptions, TextDocumentShowOptions } from 'vscode';
import { Campaign } from './models/Campaign';
import { exec } from 'child_process';
import { ITreeItem } from './models/ITreeItem';
import { campaignExplorerProvider } from './campaignExplorerProvider';
import { DMBSettings } from './Settings';

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

export async function editTreeItem(item?: ITreeItem): Promise<void> {
    if (item) {
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
    let componentUri: Uri | undefined;
    if (!item) {
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
            const qpOpts: QuickPickOptions = {
                canPickMany: false,
                ignoreFocusOut: true,
                placeHolder: 'Select the template to use'
            };
            let templateItem = await window.showQuickPick(qpItemList, qpOpts);
            let templatePath: string | undefined;
            if (templateItem) {
                templatePath = templateItem.detail;
            }
            if (templatePath) {
                let metadataPath = componentUri;
                if (metadataPath) {
                    const result = await buildComponent(templatePath, metadataPath.fsPath);
                    const doc = await workspace.openTextDocument({
                        content: result
                    });
                    await window.showTextDocument(doc, ViewColumn.Active);
                }
            }
        }
    }
}

export async function promptInsertComponent(item?: ITreeItem): Promise<void> {
    let componentUri: Uri | undefined;
    if (!item) {
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
            const qpOpts: QuickPickOptions = {
                canPickMany: false,
                ignoreFocusOut: true,
                placeHolder: 'Select the template to use'
            };
            let templateItem = await window.showQuickPick(qpItemList, qpOpts);
            let templatePath: string | undefined;
            if (templateItem) {
                templatePath = templateItem.detail;
            }
            if (templatePath) {
                let metadataPath = componentUri;
                if (metadataPath) {
                    const result = await buildComponent(templatePath, metadataPath.fsPath);
                    let editor = window.activeTextEditor;
                    if (editor) {
                        let selection = editor.selection;
                        await editor.edit((editBuilder) => {
                            editBuilder.replace(selection, result);
                        });
                    }
                }
            }
        }
    }
}

export async function sayHello(): Promise<void> {
    await window.showInformationMessage("Hello World!");
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

export async function buildComponent(templatePath: string, metadataPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        exec(`echo '' | pandoc --template='${templatePath}' --metadata-file='${metadataPath}' --metadata pagetitle=" "`, (error, stdout, stderr) => {
            resolve(stderr || stdout);
        });
    });
}