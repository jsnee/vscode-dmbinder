import { commands, ExtensionContext, window, workspace } from 'vscode';
import { renderHomebrew } from './renderer';
import { campaignExplorerProvider } from './campaignExplorerProvider';
import { registerHomebrewRenderer } from './markdownHomebrewery';
import { Utils } from './Utils';
import { ExtensionCommands } from './ExtensionCommands';
import { campaignStatus } from './CampaignStatus';

interface ContextProperties {
    localStoragePath: string;
}

export const contextProps: ContextProperties = {
    localStoragePath: ''
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-dm-binder" is now active!');
    if (!(await Utils.puppeteerHasBrowserInstance())) {
        Utils.alertNoPuppeteerBrowser();
    }

    if (context.storagePath) {
        contextProps.localStoragePath = context.storagePath;
    }

    const tv = campaignExplorerProvider;
    context.subscriptions.push(window.registerTreeDataProvider('dmbinder', tv));
    context.subscriptions.push(window.registerTreeDataProvider('dmbinder.sources', tv.sourcesExplorerProvider));
    context.subscriptions.push(window.registerTreeDataProvider('dmbinder.templates', tv.templatesExplorerProvider));
    context.subscriptions.push(window.registerTreeDataProvider('dmbinder.components', tv.componentsExplorerProvider));
    context.subscriptions.push(window.registerTreeDataProvider('dmbinder.generators', tv.generatorsExplorerProvider));

    context.subscriptions.push(campaignStatus.statusBarItem);

    let configWatcherDisposable = workspace.createFileSystemWatcher("**/.dmbinder/*.json", true, false, true);
    let onConfigChangeDisposable = configWatcherDisposable.onDidChange(async () => {
        tv.refresh();
        await campaignStatus.updateStatusBar();
    });
    context.subscriptions.push(onConfigChangeDisposable);
    context.subscriptions.push(configWatcherDisposable);

    let refreshCampaignDisposable = commands.registerCommand('dmbinder.campaign.refresh', tv.refresh, tv);
    context.subscriptions.push(refreshCampaignDisposable);

    let brewTreeItemDisposable = commands.registerCommand('dmbinder.item.brew', renderHomebrew);
    context.subscriptions.push(brewTreeItemDisposable);

    let brewCampaignDisposable = commands.registerCommand('dmbinder.campaign.brew', ExtensionCommands.renderCampaignSources);
    context.subscriptions.push(brewCampaignDisposable);

    let editTreeItemDisposable = commands.registerCommand('dmbinder.item.edit', ExtensionCommands.editTreeItem);
    context.subscriptions.push(editTreeItemDisposable);

    let initCampaignDisposable = commands.registerCommand('dmbinder.campaign.init', ExtensionCommands.promptInitCampaign);
    context.subscriptions.push(initCampaignDisposable);

    let buildComponentDisposable = commands.registerCommand('dmbinder.component.build', ExtensionCommands.promptBuildComponent);
    context.subscriptions.push(buildComponentDisposable);

    let insertComponentDisposable = commands.registerCommand('dmbinder.component.insert', ExtensionCommands.promptInsertComponent);
    context.subscriptions.push(insertComponentDisposable);

    let generateDungeon = commands.registerCommand('dmbinder.dungeon.generate', ExtensionCommands.generateDungeonMap);
    context.subscriptions.push(generateDungeon);

    let generateElementDisposable = commands.registerCommand('dmbinder.generator.generateElement', ExtensionCommands.generateElementFromConfig);
    context.subscriptions.push(generateElementDisposable);

    let generateElementWithPromptDisposable = commands.registerCommand('dmbinder.generator.generateElementWithPrompt', ExtensionCommands.generateElementFromConfigPromptArgs);
    context.subscriptions.push(generateElementWithPromptDisposable);

    let chooseChromeExecDisposable = commands.registerCommand('dmbinder.config.chooseChromePath', ExtensionCommands.promptChooseChromeExecutable);
    context.subscriptions.push(chooseChromeExecDisposable);

    let downloadChromiumDisposable = commands.registerCommand('dmbinder.config.downloadChromiumRevision', ExtensionCommands.promptDownloadChromiumRevision);
    context.subscriptions.push(downloadChromiumDisposable);

    let toggleViewStyleDisposable = commands.registerCommand('dmbinder.config.toggleViewStyle', ExtensionCommands.toggleTreeViewStyle);
    context.subscriptions.push(toggleViewStyleDisposable);

    let toggleHomebreweryEnabledDisposable = commands.registerCommand('dmbinder.config.toggleHomebreweryEnabled', ExtensionCommands.toggleHomebreweryEnabled);
    context.subscriptions.push(toggleHomebreweryEnabledDisposable);

    let onEnabledChangeListener = workspace.onDidChangeConfiguration(cfg => {
        if (cfg.affectsConfiguration('dmbinder.homebrewPreviewEnabled')) {
            commands.executeCommand('markdown.preview.refresh', undefined);
        }
    });
    context.subscriptions.push(onEnabledChangeListener);

    await campaignStatus.updateStatusBar();

    return {
        extendMarkdownIt(md: markdownit) {
            return registerHomebrewRenderer(md);
        }
    };
}

// this method is called when your extension is deactivated
export function deactivate() { }