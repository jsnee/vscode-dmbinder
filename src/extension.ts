import { commands, ExtensionContext, window, workspace, TreeView } from 'vscode';
import { renderHomebrew } from './homebrewery/renderer';
import { campaignExplorerProvider } from './ui/campaignExplorerProvider';
import { registerHomebrewRenderer } from './homebrewery/markdownHomebrewery';
import { ExtensionCommands } from './ExtensionCommands';
import { campaignStatus } from './ui/CampaignStatus';
import { ITreeItem } from './ui/ITreeItem';
import { CampaignItemType } from './ui/CampaignItemType';
import { MarkdownIt } from 'markdown-it';
import { PuppeteerHelper } from './helpers/PuppeteerHelper';
import { ExplorerHelper } from './helpers/ExplorerHelper';
import { ComponentContentProvider } from './ui/ComponentContentProvider';

interface ContextProperties {
    localStoragePath: string;
    compositeTreeView?: TreeView<ITreeItem>;
    sourcesTreeView?: TreeView<ITreeItem>;
    templatesTreeView?: TreeView<ITreeItem>;
    componentsTreeView?: TreeView<ITreeItem>;
    generatorsTreeView?: TreeView<ITreeItem>;
}

export const contextProps: ContextProperties = {
    localStoragePath: '',
    compositeTreeView: undefined,
    sourcesTreeView: undefined,
    templatesTreeView: undefined,
    componentsTreeView: undefined,
    generatorsTreeView: undefined
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    if (!(await PuppeteerHelper.puppeteerHasBrowserInstance())) {
        PuppeteerHelper.alertNoPuppeteerBrowser();
    }

    if (context.storagePath) {
        contextProps.localStoragePath = context.storagePath;
    }

    context.subscriptions.push(workspace.registerTextDocumentContentProvider("dmbcomponent", new ComponentContentProvider()));

    const tv = campaignExplorerProvider;
    contextProps.compositeTreeView = window.createTreeView('dmbinder', { treeDataProvider: tv });
    contextProps.sourcesTreeView = window.createTreeView('dmbinder.sources', { treeDataProvider: tv.sourcesExplorerProvider });
    contextProps.templatesTreeView = window.createTreeView('dmbinder.templates', { treeDataProvider: tv.templatesExplorerProvider });
    contextProps.componentsTreeView = window.createTreeView('dmbinder.components', { treeDataProvider: tv.componentsExplorerProvider });
    contextProps.generatorsTreeView = window.createTreeView('dmbinder.generators', { treeDataProvider: tv.generatorsExplorerProvider });

    context.subscriptions.push(campaignStatus.statusBarItem);

    let configWatcherDisposable = workspace.createFileSystemWatcher("**/.dmbinder/*.json", true, false, true);
    let onConfigChangeDisposable = configWatcherDisposable.onDidChange(async () => {
        tv.refresh();
        await campaignStatus.updateStatusBar();
    });
    context.subscriptions.push(onConfigChangeDisposable);
    context.subscriptions.push(configWatcherDisposable);

    context.subscriptions.push(commands.registerCommand('dmbinder.campaign.refresh', tv.refresh, tv));

    context.subscriptions.push(commands.registerCommand('dmbinder.item.brew', renderHomebrew));

    context.subscriptions.push(commands.registerCommand('dmbinder.campaign.brew', ExtensionCommands.renderCampaignSources));

    context.subscriptions.push(commands.registerCommand('dmbinder.campaign.openConfig', ExtensionCommands.openCampaignConfig));

    context.subscriptions.push(commands.registerCommand('dmbinder.item.edit', ExtensionCommands.editTreeItem));

    context.subscriptions.push(commands.registerCommand('dmbinder.campaign.init', ExtensionCommands.promptInitCampaign));

    context.subscriptions.push(commands.registerCommand('dmbinder.component.autogenerate', ExtensionCommands.autogenerateComponents));

    context.subscriptions.push(commands.registerCommand('dmbinder.component.build', ExtensionCommands.promptBuildComponent));

    context.subscriptions.push(commands.registerCommand('dmbinder.component.insert', ExtensionCommands.promptInsertComponent));

    context.subscriptions.push(commands.registerCommand('dmbinder.dungeon.generate', ExtensionCommands.generateDungeonMap));

    context.subscriptions.push(commands.registerCommand('dmbinder.generator.generateElement', ExtensionCommands.generateElementFromConfig));

    context.subscriptions.push(commands.registerCommand('dmbinder.generator.generateElementWithPrompt', ExtensionCommands.generateElementFromConfigPromptArgs));

    context.subscriptions.push(commands.registerCommand('dmbinder.config.chooseChromePath', ExtensionCommands.promptChooseChromeExecutable));

    context.subscriptions.push(commands.registerCommand('dmbinder.config.downloadChromiumRevision', ExtensionCommands.promptDownloadChromiumRevision));

    context.subscriptions.push(commands.registerCommand('dmbinder.config.toggleViewStyle', ExtensionCommands.toggleTreeViewStyle));

    context.subscriptions.push(commands.registerCommand('dmbinder.config.toggleHomebreweryEnabled', ExtensionCommands.toggleHomebreweryEnabled));

    context.subscriptions.push(commands.registerCommand('dmbinder.terminal.open', ExtensionCommands.createTerminal));

    let onEnabledChangeListener = workspace.onDidChangeConfiguration(cfg => {
        if (cfg.affectsConfiguration('dmbinder.homebrewPreviewEnabled')) {
            commands.executeCommand('markdown.preview.refresh', undefined);
        }
    });
    context.subscriptions.push(onEnabledChangeListener);

    await campaignStatus.updateStatusBar();

    // AddFolder commands
    context.subscriptions.push(commands.registerCommand('dmbinder.addFolder', ExplorerHelper.addNewTreeItem(contextProps.compositeTreeView, undefined, true)));
    context.subscriptions.push(commands.registerCommand('dmbinder.source.addFolder', ExplorerHelper.addNewTreeItem(contextProps.sourcesTreeView, CampaignItemType.Source, true)));
    context.subscriptions.push(commands.registerCommand('dmbinder.template.addFolder', ExplorerHelper.addNewTreeItem(contextProps.templatesTreeView, CampaignItemType.Template, true)));
    context.subscriptions.push(commands.registerCommand('dmbinder.component.addFolder', ExplorerHelper.addNewTreeItem(contextProps.componentsTreeView, CampaignItemType.Component, true)));
    context.subscriptions.push(commands.registerCommand('dmbinder.generator.addFolder', ExplorerHelper.addNewTreeItem(contextProps.generatorsTreeView, CampaignItemType.Generator, true)));
    // AddFile commands
    context.subscriptions.push(commands.registerCommand('dmbinder.addFile', ExplorerHelper.addNewTreeItem(contextProps.compositeTreeView, undefined)));
    context.subscriptions.push(commands.registerCommand('dmbinder.source.addFile', ExplorerHelper.addNewTreeItem(contextProps.sourcesTreeView, CampaignItemType.Source)));
    context.subscriptions.push(commands.registerCommand('dmbinder.template.addFile', ExplorerHelper.addNewTreeItem(contextProps.templatesTreeView, CampaignItemType.Template)));
    context.subscriptions.push(commands.registerCommand('dmbinder.component.addFile', ExplorerHelper.addNewTreeItem(contextProps.componentsTreeView, CampaignItemType.Component)));
    context.subscriptions.push(commands.registerCommand('dmbinder.generator.addFile', ExplorerHelper.addNewTreeItem(contextProps.generatorsTreeView, CampaignItemType.Generator)));

    return {
        extendMarkdownIt(md: MarkdownIt) {
            return registerHomebrewRenderer(md);
        }
    };
}

// this method is called when your extension is deactivated
export function deactivate() { }