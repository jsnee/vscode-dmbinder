// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, QuickPickOptions, Uri, window, workspace } from 'vscode';
import { homebrewAddWrapper, homebrewReplacePages } from './HomebrewRenderer';
import { promptCreateCampaign, promptInitCampaign } from './common';
//import * as homebrew from './HomebrewRenderer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-dm-binder" is now active!');

    let addCampaignDisposable = commands.registerCommand('dmbinder.campaign.create', async () => {
        let campaign = await promptCreateCampaign();
        if (campaign) {
            const qpOpts: QuickPickOptions = {
                canPickMany: false,
                ignoreFocusOut: true,
                placeHolder: 'Open campaign in new window?'
            };
            const shouldOpen = await window.showQuickPick(['Yes', 'No'], qpOpts);
            if (shouldOpen) {
                await commands.executeCommand('vscode.openFolder', Uri.file(campaign.path), shouldOpen === 'Yes');
            }
        }
    });
    context.subscriptions.push(addCampaignDisposable);

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

    let onEnabledChangeListener = workspace.onDidChangeConfiguration(cfg => {
        if (cfg.affectsConfiguration('dmbinder.homebrewPreviewEnabled')) {
            commands.executeCommand('markdown.preview.refresh', undefined);
        }
    });
    context.subscriptions.push(onEnabledChangeListener);

    return {
        extendMarkdownIt(md: any) {
            md.core.ruler.before('replacements', 'homebrewery_wrapper', homebrewAddWrapper);
            md.core.ruler.after('homebrewery_wrapper', 'homebrewery_pages', homebrewReplacePages);
            return md;
        }
    };
}

// this method is called when your extension is deactivated
export function deactivate() {}
