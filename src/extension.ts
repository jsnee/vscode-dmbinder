// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, QuickPickOptions, window, workspace, ViewColumn, Uri } from 'vscode';
import { registerHomebrewRenderer } from './HomebrewRenderer';
import { buildComponent, promptInitCampaign, updateTreeViewStyle } from './common';
import { campaignExplorerProvider } from './campaignExplorerProvider';
import { ITreeItem } from './models/ITreeItem';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-dm-binder" is now active!');
    await updateTreeViewStyle();
    const tv = campaignExplorerProvider;
    //window.registerTreeDataProvider('dmbinder', tv);
    window.registerTreeDataProvider('dmbinder.sources', tv.sourcesExplorerProvider);
    window.registerTreeDataProvider('dmbinder.templates', tv.templatesExplorerProvider);
    window.registerTreeDataProvider('dmbinder.components', tv.componentsExplorerProvider);

    let initCampaignDisposable = commands.registerCommand('dmbinder.campaign.init', async () => {
        const currFolder = workspace.workspaceFolders ? workspace.workspaceFolders[0] : undefined;
        if (currFolder) {
            const qpOpts: QuickPickOptions = {
                canPickMany: false,
                ignoreFocusOut: true,
                placeHolder: 'Create a new DM Binder campaign in the current folder? (' + currFolder.uri.path + ')'
            };
            const confirmInit = await window.showQuickPick(['Yes', 'No'], qpOpts);
            if (confirmInit && confirmInit === 'Yes') {
                // TODO: status bar tricks
                await promptInitCampaign(currFolder.uri);
            }
        } else {
            window.showErrorMessage('You need to open up a folder in VS Code before you can initialize a DMBinder campaign.');
            return;
        }
    });
    context.subscriptions.push(initCampaignDisposable);

    let buildComponentDisposable = commands.registerCommand('dmbinder.component.build', async (item?: ITreeItem) =>
    {
        let componentUri: Uri | undefined;
        if (!item) {
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
                const qpOpts: QuickPickOptions = {
                    canPickMany: false,
                    ignoreFocusOut: true,
                    placeHolder: 'Select the template to use'
                };
                let templateItem = await window.showQuickPick(qpItemList, qpOpts);
                let templatePath: string | undefined;
                if (templateItem) {
                    templatePath = templateItem.detail;
                }
                if (templatePath) {
                    let metadataPath = componentUri;
                    if (metadataPath) {
                        const result = await buildComponent(templatePath, metadataPath.fsPath);
                        const doc = await workspace.openTextDocument({
                            content: result
                        });
                        await window.showTextDocument(doc, ViewColumn.Active);
                    }
                }
            }
        }
    });
    context.subscriptions.push(buildComponentDisposable);

    let onEnabledChangeListener = workspace.onDidChangeConfiguration(cfg => {
        if (cfg.affectsConfiguration('dmbinder.homebrewPreviewEnabled')) {
            commands.executeCommand('markdown.preview.refresh', undefined);
        }
    });
    context.subscriptions.push(onEnabledChangeListener);

    return {
        extendMarkdownIt(md: markdownit) {
            return registerHomebrewRenderer(md);
        }
    };
}

// this method is called when your extension is deactivated
export function deactivate() {}
