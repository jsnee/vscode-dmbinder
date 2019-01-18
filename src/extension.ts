// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, QuickPickOptions, window, workspace } from 'vscode';
import { homebrewAddWrapper, homebrewReplacePages } from './HomebrewRenderer';
import * as vscode from 'vscode';
//import * as homebrew from './HomebrewRenderer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-dm-binder" is now active!');

    let addCampaignDisposable = commands.registerCommand('dmbinder.campaign.create', async () => {
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
                const campaignName = await window.showInputBox({ placeHolder: 'Campaign Name', ignoreFocusOut: true });
                if (campaignName) {
                    await context.workspaceState.update('dmbinder.campaignName', campaignName);
                }
            }
        } else {
            window.showErrorMessage('You need to open up a folder in VS Code before you can initialize a DMBinder campaign.');
            const pathToOpen = await window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: 'Open Folder'
            });
            if (pathToOpen) {
                await commands.executeCommand('vscode.openFolder', pathToOpen[0].fsPath);
            }
            return;
        }
    });
    context.subscriptions.push(addCampaignDisposable);

    let onEnabledChangeListener = workspace.onDidChangeConfiguration(cfg => {
        if (cfg.affectsConfiguration('dmbinder.homebrewPreviewEnabled')) {
            commands.executeCommand('markdown.preview.refresh', undefined);
        }
    });
    context.subscriptions.push(onEnabledChangeListener);

    return {
        extendMarkdownIt(md: any) {
            //return md.use(require('./HomebrewRenderer'));
            md.core.ruler.before('replacements', 'homebrewery_wrapper', homebrewAddWrapper);
            md.core.ruler.after('homebrewery_wrapper', 'homebrewery_pages', homebrewReplacePages);
            return md;
        }
    };
}

// this method is called when your extension is deactivated
export function deactivate() {}
