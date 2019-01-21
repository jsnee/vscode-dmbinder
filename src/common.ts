import { Uri, window } from 'vscode';
import { CampaignProvider } from './CampaignProvider';

export async function promptCreateCampaign(): Promise<CampaignProvider | undefined> {
    const path: Uri[] | undefined = await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Campaign Folder'
    });
    if (path) {
        if (path.length === 1) {
            return await promptInitCampaign(path[0]);
        }
        window.showErrorMessage('Something happened while retrieving your selected folder...');
    }
    return;
}

export async function promptInitCampaign(path: Uri): Promise<CampaignProvider | undefined> {
    if (path) {
        window.showInformationMessage('Creating new campaign in: ' + path.fsPath);
        const result = new CampaignProvider(path.fsPath);
        if (await result.exists()) {
            window.showInformationMessage('A DMBinder already exists in the selected folder.');
            return result;
        } else {
            const campaignName = await window.showInputBox({ placeHolder: 'Campaign Name', ignoreFocusOut: true });

            if (campaignName) {
                let config = {
                    campaignName: campaignName,
                    sourcePaths: getDefaultCampaignSourcePaths()
                };
                if (await result.init(config)) {
                    window.showInformationMessage('Campaign Created!');
                    return result;
                }
            } else {
                window.showErrorMessage('Something happened while trying to setup the campaign...');
            }
        }
    }
    return;
}

function getDefaultCampaignSourcePaths(): string[] {
    return ['./source'];
}