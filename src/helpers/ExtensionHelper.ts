import { extensions } from "vscode";
import * as path from "path";

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
}