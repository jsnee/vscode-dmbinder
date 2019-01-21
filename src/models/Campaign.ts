import * as path from 'path';
import * as fse from 'fs-extra';

export class Campaign {
    private _path: string;
    private _config: CampaignConfig;
    private _isConfigMutated: boolean;

    constructor(campaignPath: string) {
        this._path = campaignPath;
        this._config = fse.readJsonSync(this.getConfigPath());
        this._isConfigMutated = false;
    }

    public async reloadConfig(ignoreMutated: boolean = true): Promise<void> {
        if (!ignoreMutated && this._isConfigMutated) {
            await this.saveConfig();
        }
        this._config = await fse.readJSON(this.getConfigPath());
        this._isConfigMutated = false;
    }

    private getConfigPath(): string {
        return path.resolve(this._path, '.dmbinder', 'campaign.json');
    }

    public async saveConfig(): Promise<void> {
        if (await this.exists()) {
            let opts: fse.WriteOptions = {
                spaces: 4
            };
            await fse.writeJSON(this.getConfigPath(), this._config, opts);
            this._isConfigMutated = false;
        }
    }

    async exists(): Promise<boolean> {
        return await fse.pathExists(this.getConfigPath());
    }

    public set campaignName(name: string) {
        this._config.campaignName = name;
        this._isConfigMutated = true;
    }

    public get campaignName(): string {
        return this._config.campaignName;
    }

    public get sourcePaths(): string[] {
        return this._config.sourcePaths;
    }
}

interface CampaignConfig {
    campaignName: string;
    sourcePaths: string[];
}