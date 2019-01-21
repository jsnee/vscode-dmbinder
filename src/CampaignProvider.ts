import * as path from 'path';
import * as fse from 'fs-extra';
import { Uri } from 'vscode';

export class CampaignProvider {
    path: string;

    constructor(campaignPath: string) {
        this.path = campaignPath;
    }

    private getConfigPath(): string {
        return path.resolve(this.path, '.dmbinder', 'campaign.json');
    }

    getConfigUri(): Uri {
        return Uri.file(this.getConfigPath());
    }

    async init(config: any): Promise<boolean> {
        if (await this.exists()) {
            return false;
        }
        await fse.ensureFile(this.getConfigPath());
        if (await this.exists()) {
            let opts: fse.WriteOptions = {
                spaces: 4
            };
            await fse.writeJSON(this.getConfigPath(), config, opts);
            return true;
        }
        return false;
    }

    async exists(): Promise<boolean> {
        return await fse.pathExists(this.getConfigPath());
    }
}