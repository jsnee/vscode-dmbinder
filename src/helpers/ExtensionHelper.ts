import { extensions, workspace, window } from "vscode";
import * as path from "path";
import * as fse from 'fs-extra';
import { DMBSettings } from "../Settings";

export namespace ExtensionHelper {
    export function getExtensionPath(): string {
        let result = extensions.getExtension('jpsnee.vscode-dmbinder');
        if (!result) {
            return '';
        }
        return result.extensionPath;
    }

    export function getExtensionVersion(): string {
        let result = extensions.getExtension('jpsnee.vscode-dmbinder');
        if (!result) {
            return '';
        }
        return result.packageJSON.version;
    }

    export function getAssetPath(): string {
        return path.join(ExtensionHelper.getExtensionPath(), 'assets');
    }

    export async function toggleHomebreweryStyles(enable: boolean) {
        const currentStyles: string[] | undefined = workspace.getConfiguration('markdown').get('styles');
        let newStyles: string[] = [];
        const dmbStyles = [
            '.vscode/dmbinder-styles/jsnee-homebrew.css',
            '.vscode/dmbinder-styles/phb-previewSpecific.css',
            '.vscode/dmbinder-styles/phb.standalone.css'
        ];
        if (enable) {
            const styleDir = getMarkdownStyleDirPath();
            if (styleDir === undefined) {
                window.showErrorMessage("Cannot enable Homebrewery markdown preview globally! You must be inside of a workspace or folder!");
                throw Error("Cannot enable Homebrewery markdown preview globally! You must be inside of a workspace or folder!");
            }
            await fse.ensureDir(styleDir);
            await fse.copy(ExtensionHelper.getAssetPath(), styleDir, { recursive: true });
            
            newStyles = currentStyles || [];
            dmbStyles.forEach(style => {
                if (!newStyles.includes(style)) {
                    newStyles.push(style);
                }
            });
        } else {
            if (currentStyles === undefined || !currentStyles.some(style => dmbStyles.includes(style))) {
                return;
            }
            newStyles = currentStyles?.filter(style => !dmbStyles.includes(style));
        }
        return await workspace.getConfiguration('markdown').update('styles', newStyles);
    }

    export async function assertMarkdownStyleDirExists(): Promise<void> {
        if (DMBSettings.homebreweryEnabled) {
            const styleDir = getMarkdownStyleDirPath();
            if (styleDir !== undefined) {
                if (!await fse.pathExists(styleDir)) {
                    await ExtensionHelper.toggleHomebreweryStyles(DMBSettings.homebreweryEnabled || false);
                }
            }
        }
    }

    function getMarkdownStyleDirPath(): string | undefined {
        if (workspace.workspaceFolders !== undefined && workspace.workspaceFolders.length > 0) {
            return path.join(workspace.workspaceFolders[0].uri.fsPath, '.vscode', 'dmbinder-styles');
        }
        return;
    }
}