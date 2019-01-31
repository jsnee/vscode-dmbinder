import { workspace } from "vscode";

class Settings {
    public get homebreweryEnabled(): boolean | undefined {
        return workspace.getConfiguration('dmbinder').get('homebrewPreviewEnabled');
    }

    public get treeViewStyle(): string | undefined {
        return workspace.getConfiguration('dmbinder').get('treeViewStyle');
    }

    public set treeViewStyle(val: string | undefined) {
        workspace.getConfiguration('dmbinder').update('treeViewStyle', val);
    }
}

export const DMBSettings: Settings = new Settings();