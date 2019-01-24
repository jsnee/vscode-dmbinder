import { workspace } from "vscode";

export function homebreweryEnabled(): boolean | undefined {
    return workspace.getConfiguration('dmbinder').get('homebrewPreviewEnabled');
}

export function treeViewStyle(): string | undefined {
    return workspace.getConfiguration('dmbinder').get('treeViewStyle');
}