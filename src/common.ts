import { Uri, window, workspace, ViewColumn, commands } from 'vscode';
import { Campaign } from './models/Campaign';
import { exec } from 'child_process';
import * as path from 'path';
import * as Settings from './Settings';

export async function promptInitCampaign(path: Uri): Promise<Campaign | undefined> {
    if (path) {
        window.showInformationMessage('Creating new campaign in: ' + path.fsPath);
        if (Campaign.hasCampaignConfig(path.fsPath)) {
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

export async function promptBuildComponent(): Promise<void> {
    let templatePath = await window.showInputBox({ placeHolder: 'templatePath', ignoreFocusOut: true });
    if (templatePath) {
        let metadataPath = await window.showInputBox({ placeHolder: 'metadataPath', ignoreFocusOut: true });
        if (metadataPath) {
            const currFolder = workspace.workspaceFolders ? workspace.workspaceFolders[0] : undefined;
            if (currFolder) {
                templatePath = path.join(currFolder.uri.fsPath, templatePath);
                metadataPath = path.join(currFolder.uri.fsPath, metadataPath);
            }
            const result = await buildComponent(templatePath, metadataPath);
            const doc = await workspace.openTextDocument({
                content: result
            });
            await window.showTextDocument(doc, ViewColumn.Active);
        }
    }
}

export async function buildComponent(templatePath: string, metadataPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        exec(`echo '' | pandoc --template=${templatePath} --metadata-file=${metadataPath} --metadata pagetitle=" "`, (error, stdout, stderr) => {
            resolve(stderr || stdout);
        });
    });
}

export async function updateTreeViewStyle(): Promise<void> {
    let viewStyle = {
        composite: false,
        split: false
    };
    switch (Settings.treeViewStyle()) {
        case 'composite':
            viewStyle.composite = true;
            break;
        case 'split':
        default:
            viewStyle.split = true;
            break;
    }
    await commands.executeCommand('setContext', 'treeViewStyle', viewStyle);
}