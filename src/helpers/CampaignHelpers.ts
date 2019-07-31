
import { campaignExplorerProvider } from '../campaignExplorerProvider';
import { Campaign } from '../models/Campaign';
import { Uri, window, QuickPickItem, QuickPickOptions } from 'vscode';

export namespace CampaignHelpers {
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
}