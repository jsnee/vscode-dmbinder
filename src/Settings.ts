import { workspace } from "vscode";

class Settings {
    public get homebreweryEnabled(): boolean | undefined {
        return workspace.getConfiguration('dmbinder').get('homebrewPreviewEnabled');
    }

    public set homebreweryEnabled(val: boolean | undefined) {
        workspace.getConfiguration('dmbinder').update('homebrewPreviewEnabled', val);
    }

    public get treeViewStyle(): string | undefined {
        return workspace.getConfiguration('dmbinder').get('treeViewStyle');
    }

    public set treeViewStyle(val: string | undefined) {
        workspace.getConfiguration('dmbinder').update('treeViewStyle', val);
    }

    public get generateGettingStartedEnabled(): boolean | undefined {
        return workspace.getConfiguration('dmbinder').get('generateGettingStartedEnabled');
    }
}

export const DMBSettings: Settings = new Settings();