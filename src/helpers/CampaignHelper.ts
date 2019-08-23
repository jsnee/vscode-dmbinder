
import { campaignExplorerProvider } from '../ui/campaignExplorerProvider';
import { Campaign } from '../Campaign';
import { Uri, window, QuickPickItem, QuickPickOptions, InputBoxOptions } from 'vscode';
import * as fse from 'fs-extra';
import * as path from 'path';
import { CampaignItemType } from '../ui/CampaignItemType';

export namespace CampaignHelper {
    export async function initCampaign(path: Uri): Promise<Campaign | undefined> {
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

    export async function promptCreateFolder(parentDirectory: string): Promise<string | undefined> {
        const inputOptions: InputBoxOptions = {
            prompt: `New Folder In "${path.basename(parentDirectory)}"`,
            placeHolder: parentDirectory
        };
        let folderName = await window.showInputBox(inputOptions);
        if (!folderName) {
            return;
        }
        let folderPath = path.join(parentDirectory, folderName);
        await fse.mkdirp(folderPath);
        campaignExplorerProvider.refresh();
        return folderPath;
    }

    export async function promptCreateFile(parentDirectory: string, allowedExtensions: QuickPickItem[]): Promise<string | undefined> {
        if (allowedExtensions.length === 0) {
            throw Error("Allowed extensions not specified!");
        }
        let fileExtension: QuickPickItem | undefined;
        if (allowedExtensions.length === 1) {
            fileExtension = allowedExtensions[0];
        } else {
            const qpOpts: QuickPickOptions = {
                canPickMany: false,
                placeHolder: `Which File Type Would You Like to Use?`
            };
            fileExtension = await window.showQuickPick(allowedExtensions, qpOpts);
        }
        if (!fileExtension) {
            return;
        }
        const inputOptions: InputBoxOptions = {
            prompt: `New File In "${path.basename(parentDirectory)}"`,
            placeHolder: parentDirectory
        };
        let fileName = await window.showInputBox(inputOptions);
        if (!fileName) {
            return;
        }
        fileName = path.basename(fileName, fileExtension.description) + fileExtension.description;
        let filePath = path.join(parentDirectory, fileName);
        await fse.createFile(filePath);
        campaignExplorerProvider.refresh();
        return filePath;
    }

    export function parseCampaignItemType(value?: string): CampaignItemType | undefined {
        if (value) {
            let key = value as keyof typeof CampaignItemType;
            return CampaignItemType[key];
        }
        return;
    }
}