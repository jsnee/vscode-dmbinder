import { Event, EventEmitter, TreeDataProvider, TreeItem, workspace } from 'vscode';
import { ITreeItem } from './models/ITreeItem';
import { CampaignFolder } from './models/CampaignFolder';

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

    public async getChildren(element?: ITreeItem): Promise<ITreeItem[] | null | undefined> {
        if (element === undefined) {
            if (!workspace.workspaceFolders) {
                return undefined;
            }
            if (workspace.workspaceFolders.length === 1) {
                return await new CampaignFolder(workspace.workspaceFolders[0]).getChildren();
            }
            return workspace.workspaceFolders.map(workspaceFolder => new CampaignFolder(workspaceFolder));
        } else {
            return element.getChildren && element.getChildren();
        }
    }

    public refresh(item?: ITreeItem): void {
        return this._onDidChangeTreeData.fire(item);
    }
}

export const campaignExplorerProvider: CampaignExplorerProvider = new CampaignExplorerProvider();