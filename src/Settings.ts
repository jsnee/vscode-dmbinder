import { workspace } from "vscode";

class Settings {
    public get homebreweryEnabled(): boolean | undefined {
        return workspace.getConfiguration('dmbinder').get('homebrewPreviewEnabled');
    }

    public set homebreweryEnabled(val: boolean | undefined) {
        workspace.getConfiguration('dmbinder').update('homebrewPreviewEnabled', val);
    }

    public async updateHomebreweryEnabled(val: boolean | undefined): Promise<void> {
        return await workspace.getConfiguration('dmbinder').update('homebrewPreviewEnabled', val);
    }

    public get treeViewStyle(): string | undefined {
        return workspace.getConfiguration('dmbinder').get('treeViewStyle');
    }

    public set treeViewStyle(val: string | undefined) {
        workspace.getConfiguration('dmbinder').update('treeViewStyle', val);
    }

    public async updateTreeViewStyle(val: string | undefined): Promise<void> {
        return await workspace.getConfiguration('dmbinder').update('treeViewStyle', val);
    }

    public get chromeExecutablePath(): string | undefined {
        return workspace.getConfiguration('dmbinder').get('chromeExecutablePath');
    }

    public set chromeExecutablePath(val: string | undefined) {
        workspace.getConfiguration('dmbinder').update('chromeExecutablePath', val);
    }

    public async updateChromeExecutablePath(val: string | undefined): Promise<void> {
        return await workspace.getConfiguration('dmbinder').update('chromeExecutablePath', val);
    }

    public get generateGettingStartedEnabled(): boolean | undefined {
        return workspace.getConfiguration('dmbinder').get('generateGettingStartedEnabled');
    }

    public async updateGenerateGettingStartedEnabled(val: boolean | undefined): Promise<void> {
        return await workspace.getConfiguration('dmbinder').update('generateGettingStartedEnabled', val);
    }

    public get autogenerateOnRender(): boolean | undefined {
        return workspace.getConfiguration('dmbinder').get('autogenerateOnRender');
    }

    public set autogenerateOnRender(val: boolean | undefined) {
        workspace.getConfiguration('dmbinder').update('autogenerateOnRender', val);
    }

    public async updateAutogenerateOnRender(val: boolean | undefined): Promise<void> {
        return await workspace.getConfiguration('dmbinder').update('autogenerateOnRender', val);
    }
}

export const DMBSettings: Settings = new Settings();