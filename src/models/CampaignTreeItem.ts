import { Campaign } from "./Campaign";
import { ITreeItem } from "./ITreeItem";
import { TreeItem, TreeItemCollapsibleState, Uri } from "vscode";
import * as fse from "fs-extra";

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
        return result;
    }

    private async _getSourcesChild(): Promise<ITreeItem> {
        return {
            getContextValue: () => "Sources",
            getTreeItem: () => new TreeItem("Sources"),
            getChildren: async () => await Promise.all(this._campaign.sourcePaths.map(async srcPath => {
                let stats = await fse.stat(srcPath);
                if (stats.isDirectory()) {
                    return {
                        getContextValue: () => "SourceItem",
                        getTreeItem: () => new TreeItem(Uri.file(srcPath))
                    };
                }
                return {
                    getContextValue: () => "SourceItem",
                    getTreeItem: () => new TreeItem(Uri.file(srcPath))
                };
            }))
        };
    }
}