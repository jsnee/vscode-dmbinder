import * as path from 'path';
import * as fse from 'fs-extra';
import { Uri } from 'vscode';

interface CampaignConfig {
    campaignName: string;
    sourcePaths: string[];
    templatePaths: string[];
    componentPaths: string[];
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

    public static async init(campaignPath: string, campaignName: string): Promise<boolean> {
        if (!await Campaign.hasCampaignConfig(campaignPath)) {
            let opts: fse.WriteOptions = {
                spaces: 4
            };
            let config: CampaignConfig = {
                campaignName: campaignName,
                sourcePaths: ['./sources'],
                templatePaths: ['./templates'],
                componentPaths: ['./components']
            };
            await fse.writeJSON(getConfigPath(campaignPath), config, opts);
            await fse.ensureDir(path.join(campaignPath, 'sources'));
            await fse.ensureDir(path.join(campaignPath, 'templates'));
            await fse.ensureDir(path.join(campaignPath, 'components'));
            return true;
        }
        return false;
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

    public get campaignPath(): string {
        return this._path;
    }

    public get sourcePaths(): string[] {
        return this._config.sourcePaths;
    }

    public get templatePaths(): string[] {
        return this._config.templatePaths;
    }

    public get componentPaths(): string[] {
        return this._config.componentPaths;
    }
}

function getConfigPath(rootPath: string): string {
    return path.resolve(Uri.file(rootPath).fsPath, '.dmbinder', 'campaign.json');
}