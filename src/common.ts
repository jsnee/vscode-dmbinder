import { Uri, window } from 'vscode';
import { Campaign, CampaignConfig } from './Campaign';

export async function promptCreateCampaign(): Promise<Campaign | undefined> {
    const path: Uri[] | undefined = await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Campaign Folder'
    });
    if (path) {
        if (path.length === 1) {
            window.showInformationMessage('Creating new campaign in: ' + path[0].fsPath);
            const result = new Campaign(path[0].fsPath);
            if (await result.exists()) {
                window.showInformationMessage('A DMBinder already exists in the selected folder.');
                return result;
            } else {
                const campaignName = await window.showInputBox({ placeHolder: 'Campaign Name', ignoreFocusOut: true });

                if (campaignName) {
                    let config: CampaignConfig = {
                        campaignName: campaignName
                    };
                    if (await result.init(config)) {
                        window.showInformationMessage('Campaign Created!');
                        return result;
                    }
                } else {
                    window.showErrorMessage('Something happened while trying to setup the campaign...');
                }
            }
            return;
        }
        window.showErrorMessage('Something happened while retrieving your selected folder...');
    }
    return;
}