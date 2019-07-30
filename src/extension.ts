import { commands, ExtensionContext, window, workspace } from 'vscode';
import { renderHomebrew } from './renderer';
import { campaignExplorerProvider } from './campaignExplorerProvider';
import { registerHomebrewRenderer } from './markdownHomebrewery';
import { Utils } from './Utils';
// import { PandocConverter, PandocFormat } from './PandocConverter';

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

    let configWatcherDisposable = workspace.createFileSystemWatcher("**/.dmbinder/*.json", true, false, true);
    let onConfigChangeDisposable = configWatcherDisposable.onDidChange(() => {
        tv.refresh();
    });
    context.subscriptions.push(onConfigChangeDisposable);
    context.subscriptions.push(configWatcherDisposable);

    let refreshCampaignDisposable = commands.registerCommand('dmbinder.campaign.refresh', tv.refresh, tv);
    context.subscriptions.push(refreshCampaignDisposable);

    let brewTreeItemDisposable = commands.registerCommand('dmbinder.item.brew', renderHomebrew);
    context.subscriptions.push(brewTreeItemDisposable);

    let brewCampaignDisposable = commands.registerCommand('dmbinder.campaign.brew', Utils.renderCampaignSources);
    context.subscriptions.push(brewCampaignDisposable);

    let editTreeItemDisposable = commands.registerCommand('dmbinder.item.edit', Utils.editTreeItem);
    context.subscriptions.push(editTreeItemDisposable);

    let initCampaignDisposable = commands.registerCommand('dmbinder.campaign.init', Utils.promptInitCampaign);
    context.subscriptions.push(initCampaignDisposable);

    let buildComponentDisposable = commands.registerCommand('dmbinder.component.build', Utils.promptBuildComponent);
    context.subscriptions.push(buildComponentDisposable);

    let insertComponentDisposable = commands.registerCommand('dmbinder.component.insert', Utils.promptInsertComponent);
    context.subscriptions.push(insertComponentDisposable);

    let promptGenerateDungeon = commands.registerCommand('dmbinder.dungeon.promptGenerate', Utils.promptGenerateDungeonMap);
    context.subscriptions.push(promptGenerateDungeon);

    let generateElementDisposable = commands.registerCommand('dmbinder.generator.generateElement', Utils.generateElementFromConfig);
    context.subscriptions.push(generateElementDisposable);

    let generateElementWithPromptDisposable = commands.registerCommand('dmbinder.generator.generateElementWithPrompt', Utils.generateElementFromConfigPromptArgs);
    context.subscriptions.push(generateElementWithPromptDisposable);

    let chooseChromeExecDisposable = commands.registerCommand('dmbinder.config.chooseChromePath', Utils.promptChooseChromeExecutable);
    context.subscriptions.push(chooseChromeExecDisposable);

    let downloadChromiumDisposable = commands.registerCommand('dmbinder.config.downloadChromiumRevision', Utils.promptDownloadChromiumRevision);
    context.subscriptions.push(downloadChromiumDisposable);

    let toggleViewStyleDisposable = commands.registerCommand('dmbinder.config.toggleViewStyle', Utils.toggleTreeViewStyle);
    context.subscriptions.push(toggleViewStyleDisposable);

    let toggleHomebreweryEnabledDisposable = commands.registerCommand('dmbinder.config.toggleHomebreweryEnabled', Utils.toggleHomebreweryEnabled);
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
export function deactivate() { }