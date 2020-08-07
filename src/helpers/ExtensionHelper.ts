import { extensions, window } from "vscode";
import * as fse from 'fs-extra';
import * as path from "path";
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

    export async function assertMarkdownPreviewStyles(): Promise<void> {
        if (DMBSettings.homebreweryEnabled) {
            let copyAssets = async function(): Promise<void> {
                await enableStyleAsset('jsnee-homebrew.css');
                await enableStyleAsset('phb-previewSpecific.css');
                await enableStyleAsset('phb.standalone.css');
            }();
            window.setStatusBarMessage("Enabling Homebrewery Styles...", copyAssets);
            await copyAssets;
        } else {
            let copyAssets = async function(): Promise<void> {
                await disableStyleAsset('jsnee-homebrew.css');
                await disableStyleAsset('phb-previewSpecific.css');
                await disableStyleAsset('phb.standalone.css');
            }();
            window.setStatusBarMessage("Disabling Homebrewery Styles...", copyAssets);
            await copyAssets;
        }
    }

    async function enableStyleAsset(filename: string): Promise<void> {
        await fse.copy(path.join(getAssetPath(), filename), path.join(getExtensionPath(), 'assets-enabled', filename));
    }

    async function disableStyleAsset(filename: string): Promise<void> {
        await fse.copy(path.join(getAssetPath(), 'blank.css'), path.join(getExtensionPath(), 'assets-enabled', filename));
    }
}