import * as path from 'path';
import * as fse from 'fs-extra';
import { Uri } from 'vscode';

interface CampaignConfig {
    campaignName: string;
    sourcePaths: string[];
}

export class Campaign {
    private _path: string;
    private _config: CampaignConfig;
    private _isConfigMutated: boolean;

    constructor(campaignPath: string) {
        this._path = campaignPath;
        this._config = fse.readJsonSync(this._configPath);
        this._isConfigMutated = false;
    }

    public static async hasCampaignConfig(campaignPath: string): Promise<boolean> {
        return await fse.pathExists(getConfigPath(campaignPath));
    }

    private get _configPath(): string {
        return getConfigPath(this._path);
    }

    public async reloadConfig(ignoreMutated: boolean = true): Promise<void> {
        if (!ignoreMutated && this._isConfigMutated) {
            await this.saveConfig();
        }
        this._config = await fse.readJSON(this._configPath);
        this._isConfigMutated = false;
    }

    public async saveConfig(): Promise<void> {
        if (await Campaign.hasCampaignConfig(this._path)) {
            let opts: fse.WriteOptions = {
                spaces: 4
            };
            await fse.writeJSON(this._configPath, this._config, opts);
            this._isConfigMutated = false;
        }
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

function getConfigPath(rootPath: string): string {
    return path.resolve(Uri.file(rootPath).fsPath, '.dmbinder', 'campaign.json');
}