import { extensions, Uri } from "vscode";
import * as fse from "fs-extra";

export namespace FileUtility {
    export function getExtensionPath(): string {
        let result = extensions.getExtension('jpsnee.vscode-dmbinder');
        if (!result) {
            return '';
        }
        return result.extensionPath;
    }

    export async function fileExists(path: Uri): Promise<boolean> {
        let response = new Promise<boolean>((resolve, reject) => {
            fse.exists(path.fsPath, resolve);
        });
        return response;
    }

    export async function readFileAsync(path: Uri): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fse.readFile(path.fsPath, (err: NodeJS.ErrnoException, data: Buffer) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.toString());
                }
            });
        });
    }
}