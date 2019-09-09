import { StatusBarItem, window, StatusBarAlignment, workspace } from "vscode";
import { Campaign } from "../Campaign";

class CampaignStatusBarItem {
    private _statusBarItem: StatusBarItem;
    private _statusMessage?: string;

    constructor() {
        this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 100);
    }

    public get statusBarItem(): StatusBarItem {
        return this._statusBarItem;
    }

    public async updateStatusBarMessage(message?: string): Promise<void> {
        this._statusMessage = message;
        await this.updateStatusBar();
    }

    public async updateStatusBar(): Promise<void> {
        let campaigns = await this.getCampaigns();
        if (campaigns.length === 0) {
            this._statusBarItem.hide();
        } else if (campaigns.length === 1) {
            this._statusBarItem.text = this.getStatusText(campaigns[0].campaignName);
            this._statusBarItem.tooltip = campaigns[0].campaignPath;
            this._statusBarItem.command = "dmbinder.campaign.openConfig";
            this._statusBarItem.show();
        }
    }

    private getStatusText(title: string): string {
        if (this._statusMessage) {
            return `${title} | ${this._statusMessage}`;
        }
        return title;
    }

    private async getCampaigns(): Promise<Campaign[]> {
        let results: Campaign[] = [];

        if (workspace.workspaceFolders) {
            for (let each of workspace.workspaceFolders) {
                if (await Campaign.hasCampaignConfig(each.uri.fsPath)) {
                    results.push(new Campaign(each.uri.fsPath));
                }
            }
        }

        return results;
    }
}

export const campaignStatus: CampaignStatusBarItem = new CampaignStatusBarItem();