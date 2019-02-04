import { Event, EventEmitter, TreeDataProvider, TreeItem, workspace, WorkspaceFolder, QuickPickItem } from "vscode";
import { Campaign } from "./models/Campaign";
import { ITreeItem } from "./models/ITreeItem";
import { CampaignTreeItem, CampaignItemType } from "./models/CampaignTreeItem";
import * as fse from 'fs-extra';
import * as path from 'path';

class CampaignExplorerProvider implements TreeDataProvider<ITreeItem> {
    public readonly onDidChangeTreeData: Event<ITreeItem>;

    private _onDidChangeTreeData: EventEmitter<ITreeItem>;

    constructor() {
        this._onDidChangeTreeData = new EventEmitter<ITreeItem>();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.refresh();
    }
    
    public getTreeItem(element: ITreeItem): TreeItem | Thenable<TreeItem> {
        return Promise.resolve(element.getTreeItem()).then(item => {
            item.contextValue = element.getContextValue();
            return item;
        });
    }

    public async getChildren(element?: ITreeItem, itemType?: CampaignItemType): Promise<ITreeItem[] | null | undefined> {
        if (element === undefined) {
            if (!workspace.workspaceFolders) {
                return undefined;
            }
            if (workspace.workspaceFolders.length === 1) {
                if (await Campaign.hasCampaignConfig(workspace.workspaceFolders[0].uri.path)) {
                    return new CampaignTreeItem(new Campaign(workspace.workspaceFolders[0].uri.path)).getChildren(itemType);
                }
            }
            return await mapCampaignTreeItems(workspace.workspaceFolders);
        } else {
            return element.getChildren && element.getChildren();
        }
    }

    public async getTemplateItems(): Promise<QuickPickItem[] | undefined> {
        if (!workspace.workspaceFolders) {
            return;
        }
        let templates: string[] = [];
        for (let folder of workspace.workspaceFolders) {
            if (await Campaign.hasCampaignConfig(folder.uri.fsPath)) {
                let campaign = new Campaign(folder.uri.fsPath);
                for (let eachItem of campaign.templatePaths) {
                    let absPath = path.join(folder.uri.fsPath, eachItem);
                    let children = await expandDirectoryContents(absPath);
                    if (children) {
                        templates.push(...children);
                    }
                }
            }
        }
        return templates.map(item => {
            let result: QuickPickItem = {
                label: path.basename(item, '.md'),
                detail: item
            };
            return result;
        });
    }

    public async getComponentItems(): Promise<QuickPickItem[] | undefined> {
        if (!workspace.workspaceFolders) {
            return;
        }
        let components: string[] = [];
        for (let folder of workspace.workspaceFolders) {
            if (await Campaign.hasCampaignConfig(folder.uri.fsPath)) {
                let campaign = new Campaign(folder.uri.fsPath);
                for (let eachItem of campaign.componentPaths) {
                    let absPath = path.join(folder.uri.fsPath, eachItem);
                    let children = await expandDirectoryContents(absPath);
                    if (children) {
                        components.push(...children);
                    }
                }
            }
        }
        return components.map(item => {
            let result: QuickPickItem = {
                label: path.basename(path.basename(item, '.json'), '.yaml'),
                detail: item
            };
            return result;
        });
    }

    public refresh(item?: ITreeItem): void {
        this._onDidChangeTreeData.fire(item);
    }

    public get sourcesExplorerProvider(): TreeDataProvider<ITreeItem> {
        return {
            onDidChangeTreeData: this._onDidChangeTreeData.event,
            getTreeItem: (element: ITreeItem) => this.getTreeItem(element),
            getChildren: async (element?: ITreeItem) => {
                let children = await this.getChildren(element, CampaignItemType.Source);
                if (!element && children && children.length === 1 && children[0].getChildren) {
                    return children[0].getChildren();
                }
                return children;
            }
        };
    }

    public get templatesExplorerProvider(): TreeDataProvider<ITreeItem> {
        return {
            onDidChangeTreeData: this._onDidChangeTreeData.event,
            getTreeItem: (element: ITreeItem) => this.getTreeItem(element),
            getChildren: async (element?: ITreeItem) => {
                let children = await this.getChildren(element, CampaignItemType.Template);
                if (!element && children && children.length === 1 && children[0].getChildren) {
                    return children[0].getChildren();
                }
                return children;
            }
        };
    }

    public get componentsExplorerProvider(): TreeDataProvider<ITreeItem> {
        return {
            onDidChangeTreeData: this._onDidChangeTreeData.event,
            getTreeItem: (element: ITreeItem) => this.getTreeItem(element),
            getChildren: async (element?: ITreeItem) => {
                let children = await this.getChildren(element, CampaignItemType.Component);
                if (!element && children && children.length === 1 && children[0].getChildren) {
                    return children[0].getChildren();
                }
                return children;
            }
        };
    }
}

async function expandDirectoryContents(itemPath: string): Promise<string[] | undefined> {
    let stat = await fse.stat(itemPath);
    if (stat.isDirectory()) {
        let result: string[] = [];
        let children = await fse.readdir(itemPath);
        for (let child of children) {
            let childContents = await expandDirectoryContents(path.join(itemPath, child));
            if (childContents) {
                result.push(...childContents);
            }
        }
        return result;
    }
    if (stat.isFile()) {
        return [itemPath];
    }
    return undefined;
}

async function mapCampaignTreeItems(workspaceFolders: WorkspaceFolder[]): Promise<CampaignTreeItem[]> {
    let result: CampaignTreeItem[] = [];
    for (let workspaceFolder of workspaceFolders) {
        if (await Campaign.hasCampaignConfig(workspaceFolder.uri.fsPath)) {
            result.push(new CampaignTreeItem(new Campaign(workspaceFolder.uri.fsPath)));
        }
    }
    return result;
}

export const campaignExplorerProvider: CampaignExplorerProvider = new CampaignExplorerProvider();