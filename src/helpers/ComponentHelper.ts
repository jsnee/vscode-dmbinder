import { exec } from "child_process";
import { QuickPickItem, Uri, QuickPickOptions, window, TextDocument, ProgressOptions, ProgressLocation, Range } from "vscode";
import * as matter from 'gray-matter';
import * as fse from 'fs-extra';
import { ITreeItem } from "../ui/ITreeItem";
import { campaignExplorerProvider } from "../ui/campaignExplorerProvider";
import * as path from 'path';
import { htmlParse, HTMLElement, TextNode } from "../homebrewery/HtmlParser";
import { CampaignHelper } from "./CampaignHelper";

interface SelectedTemplateItem {
    templateUri: Uri;
    templateName: string;
    isImplied: boolean;
}

export namespace ComponentHelper {
    export async function buildComponent(templatePath: string, metadataPath: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            exec(`echo '' | pandoc --template="${templatePath}" --metadata-file="${metadataPath}" --metadata pagetitle=" "`, (error, stdout, stderr) => {
                resolve(stderr || stdout);
            });
        });
    }

    export async function promptGenerateComponent(item?: ITreeItem, includeAutogen: boolean = false): Promise<string | undefined> {
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
            let selectedTemplate = await _getOrPromptTemplateUri(componentUri);
            if (selectedTemplate) {
                let body = await buildComponent(selectedTemplate.templateUri.fsPath, componentUri.fsPath);
                if (!includeAutogen) {
                    return body;
                }
                let componentName = CampaignHelper.getComponentIdentifier(componentUri);
                if (selectedTemplate.isImplied) {
                    return `<dmb-autogen data-dmb-component="${componentName}">\n\n${body}\n</dmb-autogen>`;
                }
                return `<dmb-autogen data-dmb-component="${componentName}" data-dmb-template="${selectedTemplate.templateName}">\n\n${body}\n</dmb-autogen>`;
            }
        }
        return;
    }

    export async function autogenerateFileComponents(data: string, fileName: string): Promise<string> {
        const root = htmlParse(`<dmb-autogenerator-pseudoelement>${data}</dmb-autogenerator-pseudoelement>`, { includeComments: true });
        if (root instanceof HTMLElement) {
            const targets = root.querySelectorAll("dmb-autogen");
            if (targets.length < 1) {
                return data;
            }

            const componentList = await campaignExplorerProvider.getComponentItems();
            if (!componentList) {
                window.showWarningMessage("Failed to find any components in the current campaign.");
                return data;
            }

            for (let ndx = 0; ndx < targets.length; ndx++) {
                let node = targets[ndx] as HTMLElement;
                let componentName = node.attributes["data-dmb-component"];
                let templateName: string | undefined = node.attributes["data-dmb-template"];
                const matchedComponent = componentList.find(each => each.label === componentName);
                if (!matchedComponent || !matchedComponent.detail) {
                    window.showWarningMessage(`Failed to find a component named "${componentName}".`);
                    continue;
                }
                const componentUri = Uri.file(matchedComponent.detail);
                const selectedTemplate = await _getOrPromptTemplateUri(componentUri, templateName);
                if (!selectedTemplate) {
                    window.showWarningMessage(`Failed to find a template for component "${componentName}".`);
                    continue;
                }
                const buildResult = await buildComponent(selectedTemplate.templateUri.fsPath, componentUri.fsPath);
                const child = new TextNode("\n\n" + buildResult);
                node.childNodes = [child];
            }
            let rootNode = root.firstChild as HTMLElement;
            return rootNode.innerHTML;
            
        } else {
            window.showWarningMessage("Failed to parse current document for component autogeneration elements.");
        }
        return data;
    }

    export async function autogenerateDocumentComponents(doc: TextDocument): Promise<void> {
        const root = htmlParse(`<dmb-autogenerator-pseudoelement>${doc.getText()}</dmb-autogenerator-pseudoelement>`, { includeComments: true });
        if (root instanceof HTMLElement) {
            const targets = root.querySelectorAll("dmb-autogen");
            if (targets.length < 1) {
                return;
            }
            const fileName = path.basename(doc.fileName, '.md');
            const progOpts: ProgressOptions = {
                location: ProgressLocation.Notification,
                cancellable: true,
                title: `Autogenerating Component`
            };

            window.withProgress(progOpts, async (progress, token) => {
                let isCancelled = false;
                token.onCancellationRequested(async () => {
                    window.showWarningMessage(`Cancelled rendering files from "${fileName}".`);
                    window.setStatusBarMessage("Cancelling...", 1000);
                });
                progress.report({
                    message: "Initializing..."
                });

                const componentList = await campaignExplorerProvider.getComponentItems();
                if (!componentList) {
                    window.showWarningMessage("Failed to find any components in the current campaign.");
                    return;
                }

                for (let ndx = 0; ndx < targets.length; ndx++) {
                    if (isCancelled) {
                        console.log("Cancelled!");
                        break;
                    }
                    let node = targets[ndx] as HTMLElement;
                    let componentName = node.attributes["data-dmb-component"];
                    let templateName: string | undefined = node.attributes["data-dmb-template"];
                    progress.report({
                        message: componentName,
                        increment: 100 / targets.length
                    });
                    const matchedComponent = componentList.find(each => each.label === componentName);
                    if (!matchedComponent || !matchedComponent.detail) {
                        window.showWarningMessage(`Failed to find a component named "${componentName}".`);
                        continue;
                    }
                    const componentUri = Uri.file(matchedComponent.detail);
                    const selectedTemplate = await _getOrPromptTemplateUri(componentUri, templateName);
                    if (!selectedTemplate) {
                        window.showWarningMessage(`Failed to find a template for component "${componentName}".`);
                        continue;
                    }
                    const buildResult = await buildComponent(selectedTemplate.templateUri.fsPath, componentUri.fsPath);
                    const child = new TextNode("\n\n" + buildResult);
                    node.childNodes = [child];
                }

                progress.report({
                    message: `Updating "${fileName}" Contents...`
                });
                const editor = await window.showTextDocument(doc);
                let range = new Range(0, 0, doc.lineCount, 0);
                range = doc.validateRange(range);
                let rootNode = root.firstChild as HTMLElement;
                await editor.edit((editBuilder) => {
                    editBuilder.replace(range, rootNode.innerHTML);
                });
            });
            
        } else {
            window.showWarningMessage("Failed to parse current document for component autogeneration elements.");
        }
    }

    async function _getOrPromptTemplateUri(componentUri: Uri, overrideTemplateName?: string): Promise<SelectedTemplateItem | undefined> {
        const qpItemList = await campaignExplorerProvider.getTemplateItems();
        if (qpItemList) {
            let isImplied = false;
            let templateItem: QuickPickItem | undefined;
            if (overrideTemplateName) {
                templateItem = qpItemList.find((each) => each.label === `${overrideTemplateName}`);
            } else if (componentUri.fsPath.endsWith(".yaml")) {
                let metadata = matter.read(componentUri.fsPath, { delimiters: ['---', '...'] });
                if (metadata && metadata.data && metadata.data.templateItem) {
                    templateItem = qpItemList.find((each) => each.label === `${metadata.data.templateItem}`);
                    isImplied = templateItem !== undefined;
                }
            } else if (componentUri.fsPath.endsWith(".json")) {
                let metadata = await fse.readJSON(componentUri.fsPath);
                if (metadata && metadata.templateItem) {
                    templateItem = qpItemList.find((each) => each.label === `${metadata.templateItem}`);
                    isImplied = templateItem !== undefined;
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
            if (templateItem && templateItem.detail) {
                return {
                    templateUri: Uri.file(templateItem.detail),
                    templateName: templateItem.label,
                    isImplied: isImplied
                };
            }
        }
        return;
    }
}