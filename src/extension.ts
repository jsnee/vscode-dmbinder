// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Uri } from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-dm-binder" is now active!');

    let addCampaignDisposable = vscode.commands.registerCommand('dmbinder.campaign.create', async () => {
        const path: Uri[] | undefined = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Campaign Folder'
        });
        if (path && path.length) {
            vscode.window.showInformationMessage('Selected folder: ' + path[0].fsPath);
        }
    });
    context.subscriptions.push(addCampaignDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
