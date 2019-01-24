import { Campaign } from "./Campaign";
import { ITreeItem } from "./ITreeItem";
import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import * as fse from "fs-extra";
import * as path from "path";

export class CampaignTreeItem implements ITreeItem {
    private _campaign: Campaign;

    constructor(campaign: Campaign) {
        this._campaign = campaign;
    }

    public getContextValue(): string {
        return "Campaign";
    }

    public getTreeItem(): TreeItem | Thenable<TreeItem> {
        return new TreeItem(this._campaign.campaignName, TreeItemCollapsibleState.Expanded);
    }

    public async getChildren(): Promise<ITreeItem[]> {
        let result: ITreeItem[] = [];
        if (this._campaign.sourcePaths && this._campaign.sourcePaths.length > 0) {
            result.push(await this._getSourcesChild());
        }
        if (this._campaign.templatePaths && this._campaign.templatePaths.length > 0) {
            result.push(await this._getTemplatesChild());
        }
        if (this._campaign.componentPaths && this._campaign.componentPaths.length > 0) {
            result.push(await this._getComponentsChild());
        }
        return result;
    }

    private async _getSourcesChild(): Promise<ITreeItem> {
        return {
            getContextValue: () => "Sources",
            getTreeItem: () => new TreeItem("Sources", TreeItemCollapsibleState.Expanded),
            getChildren: () => Promise.all(this._campaign.sourcePaths.map(async srcPath => this._getChildren("SourceItem", srcPath)))
        };
    }

    private async _getTemplatesChild(): Promise<ITreeItem> {
        return {
            getContextValue: () => "Templates",
            getTreeItem: () => new TreeItem("Templates", TreeItemCollapsibleState.Collapsed),
            getChildren: () => Promise.all(this._campaign.templatePaths.map(async templatePath => this._getChildren("TemplateItem", templatePath)))
        };
    }

    private async _getComponentsChild(): Promise<ITreeItem> {
        return {
            getContextValue: () => "Components",
            getTreeItem: () => new TreeItem("Components", TreeItemCollapsibleState.Collapsed),
            getChildren: () => Promise.all(this._campaign.componentPaths.map(async componentPath => this._getChildren("ComponentItem", componentPath)))
        };
    }

    private async _getChildren(contextValue: string, itemPath: string): Promise<ITreeItem> {
        let uri = Uri.file(itemPath.startsWith("./") ? path.join(this._campaign.campaignPath, itemPath) : itemPath);
        let stats = await fse.stat(uri.fsPath);
        if (stats.isDirectory()) {
            return {
                getContextValue: () => contextValue + "Dir",
                getTreeItem: () => new TreeItem(uri, TreeItemCollapsibleState.Collapsed),
                getChildren: async () => Promise.all((await fse.readdir(uri.fsPath)).map(async childPath => this._getChildren(contextValue, path.join(uri.fsPath, childPath))))
            };
        }
        return {
            getContextValue: () => contextValue,
            getTreeItem: () => new TreeItem(uri)
        };
    }
}