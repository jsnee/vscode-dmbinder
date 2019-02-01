import { Campaign } from "./Campaign";
import { ITreeItem } from "./ITreeItem";
import { TreeItem, TreeItemCollapsibleState, Uri, TextDocumentShowOptions } from "vscode";
import * as fse from "fs-extra";
import * as path from "path";

export enum CampaignItemType {
    Source = "SourceItem",
    Template = "TemplateItem",
    Component = "ComponentItem"
}

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

    public async getChildren(itemType?: CampaignItemType): Promise<ITreeItem[]> {
        let result: ITreeItem[] = [];
        if (!itemType || itemType === CampaignItemType.Source) {
            result.push(await this._getSourcesChild());
        }
        if (!itemType || itemType === CampaignItemType.Template) {
            result.push(await this._getTemplatesChild());
        }
        if (!itemType || itemType === CampaignItemType.Component) {
            result.push(await this._getComponentsChild());
        }
        return result;
    }

    private _getEmptyChild(contextValue: string): ITreeItem {
        return {
            getContextValue: () => contextValue,
            getTreeItem: () => new TreeItem(contextValue + " (empty)")
        };
    }

    private async _getSourcesChild(): Promise<ITreeItem> {
        if (this._campaign.sourcePaths && this._campaign.sourcePaths.length > 0) {
            return {
                getContextValue: () => "Sources",
                getTreeItem: () => new TreeItem("Sources", TreeItemCollapsibleState.Expanded),
                getChildren: () => Promise.all(this._campaign.sourcePaths.map(async srcPath => this._getChildren("SourceItem", srcPath)))
            };
        }
        return this._getEmptyChild("Sources");
    }

    private async _getTemplatesChild(): Promise<ITreeItem> {
        if (this._campaign.templatePaths && this._campaign.templatePaths.length > 0) {
            return {
                getContextValue: () => "Templates",
                getTreeItem: () => new TreeItem("Templates", TreeItemCollapsibleState.Expanded),
                getChildren: () => Promise.all(this._campaign.templatePaths.map(async templatePath => this._getChildren("TemplateItem", templatePath)))
            };
        }
        return this._getEmptyChild("Templates");
    }

    private async _getComponentsChild(): Promise<ITreeItem> {
        if (this._campaign.componentPaths && this._campaign.componentPaths.length > 0) {
            return {
                getContextValue: () => "Components",
                getTreeItem: () => new TreeItem("Components", TreeItemCollapsibleState.Expanded),
                getChildren: () => Promise.all(this._campaign.componentPaths.map(async componentPath => this._getChildren("ComponentItem", componentPath)))
            };
        }
        return this._getEmptyChild("Components");
    }

    private async _getChildren(contextValue: string, itemPath: string): Promise<ITreeItem> {
        let uri = Uri.file(itemPath.startsWith("./") ? path.join(this._campaign.campaignPath, itemPath) : itemPath);
        let stats = await fse.stat(uri.fsPath);
        if (stats.isDirectory()) {
            return {
                getContextValue: () => contextValue + "Folder",
                getTreeItem: () => getChildTreeItem(uri, contextValue + "Folder"),
                getChildren: async () => Promise.all((await fse.readdir(uri.fsPath)).map(async childPath => this._getChildren(contextValue, path.join(uri.fsPath, childPath))))
            };
        }
        return {
            getContextValue: () => contextValue,
            getTreeItem: () => getChildTreeItem(uri, contextValue)
        };
    }
}

function getChildTreeItem(uri: Uri, contextValue: string): TreeItem {
    let result = new TreeItem(uri);
    switch (contextValue) {
        case "SourceItemFolder":
        case "TemplateItemFolder":
        case "ComponentItemFolder":
            result.collapsibleState = TreeItemCollapsibleState.Expanded;
            break;
        case "SourceItem":
            let opts: TextDocumentShowOptions = {
                preview: true,
                preserveFocus: true
            };
            result.command = {
                command: "vscode.open",
                title: "",
                arguments: [uri, opts]
            };
        case "TemplateItem":
        case "ComponentItem":
        default:
            break;
    }
    return result;
}