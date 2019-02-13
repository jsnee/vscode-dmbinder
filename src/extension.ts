import { commands, ExtensionContext, window, workspace } from 'vscode';
import { registerHomebrewRenderer, renderHomebrew } from './HomebrewRenderer';
import { promptInitCampaign, promptBuildComponent, editTreeItem, toggleTreeViewStyle, promptInsertComponent, toggleHomebreweryEnabled } from './common';
import { campaignExplorerProvider } from './campaignExplorerProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-dm-binder" is now active!');
    const tv = campaignExplorerProvider;
    window.registerTreeDataProvider('dmbinder', tv);
    window.registerTreeDataProvider('dmbinder.sources', tv.sourcesExplorerProvider);
    window.registerTreeDataProvider('dmbinder.templates', tv.templatesExplorerProvider);
    window.registerTreeDataProvider('dmbinder.components', tv.componentsExplorerProvider);

    let refreshCampaignDisposable = commands.registerCommand('dmbinder.campaign.refresh', tv.refresh, tv);
    context.subscriptions.push(refreshCampaignDisposable);

    let brewTreeItemDisposable = commands.registerCommand('dmbinder.item.brew', renderHomebrew);
    context.subscriptions.push(brewTreeItemDisposable);

    let editTreeItemDisposable = commands.registerCommand('dmbinder.item.edit', editTreeItem);
    context.subscriptions.push(editTreeItemDisposable);

    let initCampaignDisposable = commands.registerCommand('dmbinder.campaign.init', promptInitCampaign);
    context.subscriptions.push(initCampaignDisposable);

    let buildComponentDisposable = commands.registerCommand('dmbinder.component.build', promptBuildComponent);
    context.subscriptions.push(buildComponentDisposable);

    let insertComponentDisposable = commands.registerCommand('dmbinder.component.insert', promptInsertComponent);
    context.subscriptions.push(insertComponentDisposable);

    let toggleViewStyleDisposable = commands.registerCommand('dmbinder.config.toggleViewStyle', toggleTreeViewStyle);
    context.subscriptions.push(toggleViewStyleDisposable);

    let toggleHomebreweryEnabledDisposable = commands.registerCommand('dmbinder.config.toggleHomebreweryEnabled', toggleHomebreweryEnabled);
    context.subscriptions.push(toggleHomebreweryEnabledDisposable);

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
