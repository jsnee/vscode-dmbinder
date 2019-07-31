import { exec } from "child_process";
import { QuickPickItem, Uri, QuickPickOptions, window } from "vscode";
import * as matter from 'gray-matter';
import * as fse from 'fs-extra';
import { ITreeItem } from "../models/ITreeItem";
import { campaignExplorerProvider } from "../campaignExplorerProvider";

export namespace ComponentHelpers {
    export async function buildComponent(templatePath: string, metadataPath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            exec(`echo '' | pandoc --template="${templatePath}" --metadata-file="${metadataPath}" --metadata pagetitle=" "`, (error, stdout, stderr) => {
                resolve(stderr || stdout);
            });
        });
    }

    export async function promptGenerateComponent(item?: ITreeItem): Promise<string | undefined> {
        let componentUri: Uri | undefined;
        if (!item || !item.getTreeItem) {
            const qpComponentList = await campaignExplorerProvider.getComponentItems();
            if (qpComponentList) {
                const qpComponentOpts: QuickPickOptions = {
                    canPickMany: false,
                    ignoreFocusOut: true,
                    placeHolder: 'Select the component to use'
                };
                let componentItem = await window.showQuickPick(qpComponentList, qpComponentOpts);
                if (componentItem && componentItem.detail) {
                    componentUri = Uri.file(componentItem.detail);
                }
            }
        } else {
            const treeItem = await item.getTreeItem();
            componentUri = treeItem.resourceUri;
        }
        if (componentUri) {
            const qpItemList = await campaignExplorerProvider.getTemplateItems();
            if (qpItemList) {
                let templateItem: QuickPickItem | undefined;
                if (componentUri.fsPath.endsWith(".yaml")) {
                    let metadata = matter.read(componentUri.fsPath, { delimiters: ['---', '...'] });
                    if (metadata && metadata.data && metadata.data.templateItem) {
                        templateItem = qpItemList.find((each) => each.label === `${metadata.data.templateItem}`);
                    }
                } else if (componentUri.fsPath.endsWith(".json")) {
                    let metadata = await fse.readJSON(componentUri.fsPath);
                    if (metadata && metadata.templateItem) {
                        templateItem = qpItemList.find((each) => each.label === `${metadata.templateItem}`);
                    }
                }
                if (!templateItem) {
                    const qpOpts: QuickPickOptions = {
                        canPickMany: false,
                        ignoreFocusOut: true,
                        placeHolder: 'Select the template to use'
                    };
                    templateItem = await window.showQuickPick(qpItemList, qpOpts);
                }
                let templatePath: Uri | undefined;
                if (templateItem && templateItem.detail) {
                    templatePath = Uri.file(templateItem.detail);
                }
                if (templatePath) {
                    let metadataPath = componentUri;
                    if (metadataPath) {
                        return await buildComponent(templatePath.fsPath, metadataPath.fsPath);
                    }
                }
            }
        }
        return;
    }
}