import { Event, EventEmitter, TreeDataProvider, TreeItem, workspace, WorkspaceFolder } from "vscode";
import { Campaign } from "./models/Campaign";
import { ITreeItem } from "./models/ITreeItem";
import { CampaignTreeItem } from "./models/CampaignTreeItem";

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
            // TODO: What if workspace folder has no Campa
            return Promise.resolve(mapCampaigns(workspace.workspaceFolders));
        } else {
            return element.getChildren && element.getChildren();
        }
    }

    public refresh(item?: ITreeItem): void {
        return this._onDidChangeTreeData.fire(item);
    }
}

function mapCampaigns(workspaceFolders: WorkspaceFolder[]): CampaignTreeItem[] {
    let result: CampaignTreeItem[] = [];
    workspaceFolders.forEach(workspaceFolder => {
        if (Campaign.hasCampaignConfig(workspaceFolder.uri.path)) {
            result.push(new CampaignTreeItem(new Campaign(workspaceFolder.uri.path)));
        }
    });
    return result;
}

export const campaignExplorerProvider: CampaignExplorerProvider = new CampaignExplorerProvider();