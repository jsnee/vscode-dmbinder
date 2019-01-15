import * as path from 'path';
import * as fse from 'fs-extra';
import { Uri } from 'vscode';

export class Campaign {
    path: string;

    constructor(campaignPath: string) {
        this.path = campaignPath;
    }

    private getConfigPath(): string {
        return path.resolve(this.path, 'campaign.json');
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
            return true;
        }
        return false;
    }

    async exists(): Promise<boolean> {
        return await fse.pathExists(this.getConfigPath());
    }
}

export interface CampaignConfig {
    name: string;
}