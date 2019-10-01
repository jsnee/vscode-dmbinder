import { QuickPickItem, Uri, QuickPickOptions, window, TextDocument, ProgressOptions, ProgressLocation, Range } from "vscode";
import { ITreeItem } from "../ui/ITreeItem";
import { campaignExplorerProvider } from "../ui/campaignExplorerProvider";
import * as path from 'path';
import { htmlParse, HTMLElement, TextNode, HtmlParserOptions } from "../homebrewery/HtmlParser";
import { CampaignHelper } from "./CampaignHelper";
import { ITemplateEngine } from "../templating/ITemplateEngine";
import { DMBSettings } from "../Settings";
import { TemplateEngineType } from "../templating/TemplateEngineType";
import { PandocEngine } from "../templating/PandocEngine";
import { MustacheEngine } from "../templating/MustacheEngine";
import { IComponentItem } from "../templating/IComponentItem";
import { JsonComponentItem } from "../templating/JsonComponentItem";
import { YamlComponentItem } from "../templating/YamlComponentItem";
import { BasicTemplateItem } from "../templating/BasicTemplateItem";
import { ITemplateItem } from "../templating/ITemplateItem";
import { HandlebarsEngine } from "../templating/HandlebarsEngine";

const _pandocSyntaxRegEx = /\$(?:if\(|for\()?[\w.]+\)?\$/g;

export namespace ComponentHelper {
    export async function buildComponent(templatePath: string, componentPath: string): Promise<string> {
        let engine: ITemplateEngine;
        let componentItem = getComponentItem(componentPath);
        
        let templateItem = new BasicTemplateItem(templatePath);
        const templateMetadata = await templateItem.getMetadata();
        let engineType = templateMetadata.templateEngine || DMBSettings.defaultTemplatingEngine;

        if (engineType) {
            switch (engineType) {
                case TemplateEngineType.Pandoc:
                    engine = new PandocEngine();
                    break;
                case TemplateEngineType.Mustache:
                    engine = new MustacheEngine();
                    break;
                case TemplateEngineType.Handlebars:
                    engine = new HandlebarsEngine();
                    break;
                default:
                    throw new Error("Unexpected templating engine type!");
            }
            if (engineType !== TemplateEngineType.Pandoc && _pandocSyntaxRegEx.test(await templateItem.getContents())) {
                const alertMessage = "It looks like you may be trying to render a 'Pandoc' template, "
                    + "but DMBinder was using the 'Mustache' rendering engine. "
                    + "You may want to either change the default rendering engine in VSCode's settings or "
                    + "explicitly specify the rendering engine in the template.";
                window.showInformationMessage(alertMessage);
            }
            try {
                return await engine.buildComponent(templateItem, componentItem);
            } catch (err) {
                window.showErrorMessage(`Error encountered while trying to render "${componentItem.componentName}" using "${templateItem.templateName}":\n${err}`);
                throw new Error("Error encountered while trying to build component.");
            }
        }
        throw new Error("Could not determine which templating engine to use.");
    }

    function getComponentItem(componentPath: string): IComponentItem {
        switch (path.extname(componentPath)) {
            case ".json":
                return new JsonComponentItem(componentPath);
            case ".yaml":
                return new YamlComponentItem(componentPath);
            default:
                throw new Error("Unexpected component item file type!");
        }
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
                if (selectedTemplate.inferredFromComponent) {
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
        const parseOpts: HtmlParserOptions = {
            includeComments: true,
            script: true,
            style: true,
            pre: true
        };
        const root = htmlParse(`<dmb-autogenerator-pseudoelement>${doc.getText()}</dmb-autogenerator-pseudoelement>`, parseOpts);
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

    async function _getOrPromptTemplateUri(componentUri: Uri, overrideTemplateName?: string): Promise<ITemplateItem | undefined> {
        const qpItemList = await campaignExplorerProvider.getTemplateItems();
        if (qpItemList) {
            let isImplied = false;
            let templateItem: QuickPickItem | undefined;
            if (overrideTemplateName) {
                templateItem = qpItemList.find((each) => each.label === `${overrideTemplateName}`);
            } else {
                const component = getComponentItem(componentUri.fsPath);
                const componentMetadata = await component.getMetadata();
                if (componentMetadata.templateItem) {
                    templateItem = qpItemList.find((each) => each.label === `${componentMetadata.templateItem}`);
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
                return new BasicTemplateItem(Uri.file(templateItem.detail), templateItem.label, isImplied);
            }
        }
        return;
    }
}