// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, QuickPickOptions, Uri, window } from 'vscode';
import { promptCreateCampaign, homebrewAddWrapper, homebrewReplacePages } from './common';
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
                await commands.executeCommand('vscode.openFolder', Uri.parse(campaign.path), shouldOpen === 'Yes');
            }
        }
    });
    context.subscriptions.push(addCampaignDisposable);
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
