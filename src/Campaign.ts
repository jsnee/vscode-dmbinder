import * as path from 'path';
import * as fse from 'fs-extra';
import { Uri, workspace } from 'vscode';

export class Campaign {
    path: string;

    constructor(campaignPath: string) {
        this.path = campaignPath;
    }

    private getConfigPath(): string {
        return path.resolve(this.path, '.vscode', 'campaign.json');
        //return path.resolve(this.path, '.vscode', 'settings.json');
    }

    getConfigUri(): Uri {
        return Uri.file(this.getConfigPath());
    }

    async init(config: CampaignConfig): Promise<boolean> {
        if (await this.exists()) {
            return false;
        }
        await fse.ensureFile(this.getConfigPath());
        if (await this.exists()) {
            await fse.writeJSON(this.getConfigPath(), config);
            console.log(workspace.getConfiguration('campaign', this.getConfigUri()).get('campaignName'));
            return true;
        }
        return false;
    }

    async exists(): Promise<boolean> {
        return await fse.pathExists(this.getConfigPath());
    }
}

export interface CampaignConfig {
    campaignName: string;
}