import { Campaign } from "../Campaign";
import { ITreeItem } from "./ITreeItem";
import { TreeItem, TreeItemCollapsibleState, Uri, TextDocumentShowOptions } from "vscode";
import * as fse from "fs-extra";
import * as path from "path";
import { CampaignItemType } from "./CampaignItemType";
import { FileUtility } from "../utils/FileUtility";

export class CampaignTreeItem implements ITreeItem {
    private _campaign: Campaign;
    private _campaignItemType?: CampaignItemType;

    constructor(campaign: Campaign, campaignItemType?: CampaignItemType) {
        this._campaign = campaign;
        this._campaignItemType = campaignItemType;
    }

    public get campaignItemType(): CampaignItemType | undefined {
        return this._campaignItemType;
    }

    public getContextValue(): string {
        return "Campaign";
    }

    public getTreeItem(): TreeItem | Thenable<TreeItem> {
        return new TreeItem(this._campaign.campaignName, TreeItemCollapsibleState.Expanded);
    }

    public async getChildren(itemType?: CampaignItemType): Promise<ITreeItem[]> {
        if (!itemType && this._campaignItemType) {
            return this.getChildren(this._campaignItemType);
        }
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
        if (!itemType || itemType === CampaignItemType.Generator) {
            result.push(await this._getGeneratorsChild());
        }
        return result;
    }

    public getCampaignPath(): string {
        return this._campaign.campaignPath;
    }

    private _getEmptyChild(contextValue: string, hasUnrelatedContents: boolean = false): ITreeItem {
        let label = hasUnrelatedContents ? `Contains non-${contextValue.replace("Item", " Item(s)")}` : `${contextValue.replace("Item", " Folder")} (empty)`;
        return {
            isEmpty: !hasUnrelatedContents,
            getContextValue: () => `Empty${contextValue}`,
            getTreeItem: () => new TreeItem(label)
        };
    }

    private async _getSourcesChild(): Promise<ITreeItem> {
        if (this._campaign.sourcePaths && this._campaign.sourcePaths.length > 0) {
            return {
                campaignItemType: CampaignItemType.Source,
                getContextValue: () => "Sources",
                getTreeItem: () => new TreeItem("Sources", TreeItemCollapsibleState.Expanded),
                getChildren: () => Promise.all(this._campaign.sourcePaths.map(async srcPath => this._getChildren(CampaignItemType.Source, srcPath))),
                getCampaignPath: () => this._campaign.campaignPath
            };
        }
        return this._getEmptyChild("Sources");
    }

    private async _getTemplatesChild(): Promise<ITreeItem> {
        if (this._campaign.templatePaths && this._campaign.templatePaths.length > 0) {
            return {
                campaignItemType: CampaignItemType.Template,
                getContextValue: () => "Templates",
                getTreeItem: () => new TreeItem("Templates", TreeItemCollapsibleState.Expanded),
                getChildren: () => Promise.all(this._campaign.templatePaths.map(async templatePath => this._getChildren(CampaignItemType.Template, templatePath))),
                getCampaignPath: () => this._campaign.campaignPath
            };
        }
        return this._getEmptyChild("Templates");
    }

    private async _getComponentsChild(): Promise<ITreeItem> {
        if (this._campaign.componentPaths && this._campaign.componentPaths.length > 0) {
            return {
                campaignItemType: CampaignItemType.Component,
                getContextValue: () => "Components",
                getTreeItem: () => new TreeItem("Components", TreeItemCollapsibleState.Expanded),
                getChildren: () => Promise.all(this._campaign.componentPaths.map(async componentPath => this._getChildren(CampaignItemType.Component, componentPath))),
                getCampaignPath: () => this._campaign.campaignPath
            };
        }
        return this._getEmptyChild("Components");
    }

    private async _getGeneratorsChild(): Promise<ITreeItem> {
        if (this._campaign.generatorPaths && this._campaign.generatorPaths.length > 0) {
            return {
                campaignItemType: CampaignItemType.Generator,
                getContextValue: () => "Generators",
                getTreeItem: () => new TreeItem("Generators", TreeItemCollapsibleState.Expanded),
                getChildren: () => Promise.all(this._campaign.generatorPaths.map(async generatorPath => this._getChildren(CampaignItemType.Generator, generatorPath))),
                getCampaignPath: () => this._campaign.campaignPath
            };
        }
        return this._getEmptyChild("Generators");
    }

    private async _getChildren(contextValue: CampaignItemType, itemPath: string, contextPath?: string): Promise<ITreeItem> {
        let uri = Uri.file(itemPath.startsWith("./") ? path.join(this._campaign.campaignPath, itemPath) : itemPath);
        if (!(await FileUtility.fileExists(uri))) {
            return {
                campaignItemType: contextValue,
                getContextValue: () => `Missing${contextValue}`,
                getTreeItem: () => new TreeItem(`${path.basename(uri.fsPath)} (Missing)`)
            };
        }
        let stats = await fse.stat(uri.fsPath);
        let getContextPath = undefined;
        if (contextPath) {
            getContextPath = () => contextPath;
        }
        if (stats.isDirectory()) {
            let ctxPath = path.basename(itemPath);
            if (contextPath) {
                ctxPath = path.join(contextPath, ctxPath);
            }
            return {
                campaignItemType: contextValue,
                getContextValue: () => contextValue + "Folder",
                getTreeItem: () => getChildTreeItem(uri, contextValue + "Folder"),
                getChildren: async () => await this._listFilteredNodeChildren(contextValue, uri, ctxPath),
                getCampaignPath: () => this._campaign.campaignPath,
                getContextPath: getContextPath
            };
        }
        return {
            campaignItemType: contextValue,
            getContextValue: () => contextValue,
            getTreeItem: () => getChildTreeItem(uri, contextValue),
            getCampaignPath: () => this._campaign.campaignPath,
            getContextPath: getContextPath
        };
    }

    private async _listFilteredNodeChildren(contextValue: CampaignItemType, parentUri: Uri, contextPath: string): Promise<ITreeItem[]> {
        let children = await fse.readdir(parentUri.fsPath);
        let result: ITreeItem[] = [];
        for (let childFragment of children) {
            let childPath = path.join(parentUri.fsPath, childFragment);
            let child = await this._getChildren(contextValue, childPath, contextPath);
            if (!child.getChildren) {
                switch (contextValue) {
                    case CampaignItemType.Source:
                        if (childPath.endsWith(".md")) {
                            result.push(child);
                        }
                        continue;
                    case CampaignItemType.Template:
                        if (childPath.endsWith(".md")) {
                            result.push(child);
                        }
                        continue;
                    case CampaignItemType.Component:
                        if (childPath.endsWith(".yaml") || childPath.endsWith(".json")) {
                            result.push(child);
                        }
                        continue;
                    case CampaignItemType.Generator:
                        if (childPath.endsWith(".dmbgen.json")) {
                            result.push(child);
                        }
                        continue;
                    default:
                        continue;
                }
            }
            result.push(child);
        }
        if (result.length === 0) {
            result.push(this._getEmptyChild(contextValue, children.length !== 0));
        }
        return result;
    }
}

function getChildTreeItem(uri: Uri, contextValue: string): TreeItem {
    let result = new TreeItem(uri);
    switch (contextValue) {
        case "SourceItemFolder":
        case "TemplateItemFolder":
        case "ComponentItemFolder":
        case "GeneratorItemFolder":
            result.collapsibleState = TreeItemCollapsibleState.Expanded;
            break;
        case CampaignItemType.Source:
        case CampaignItemType.Template:
        case CampaignItemType.Component:
        case CampaignItemType.Generator:
            let opts: TextDocumentShowOptions = {
                preview: true,
                preserveFocus: true
            };
            result.command = {
                command: "vscode.open",
                title: "",
                arguments: [uri, opts]
            };
        default:
            break;
    }
    return result;
}