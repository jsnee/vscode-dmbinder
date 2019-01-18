import { Uri, window } from 'vscode';
import { Campaign, CampaignConfig } from './Campaign';

export async function promptCreateCampaign(): Promise<Campaign | undefined> {
    const path: Uri[] | undefined = await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Campaign Folder'
    });
    if (path) {
        if (path.length === 1) {
            window.showInformationMessage('Creating new campaign in: ' + path[0].fsPath);
            const result = new Campaign(path[0].fsPath);
            if (await result.exists()) {
                window.showInformationMessage('A DMBinder already exists in the selected folder.');
                return result;
            } else {
                const campaignName = await window.showInputBox({ placeHolder: 'Campaign Name', ignoreFocusOut: true });

                if (campaignName) {
                    let config: CampaignConfig = {
                        name: campaignName
                    };
                    if (await result.init(config)) {
                        window.showInformationMessage('Campaign Created!');
                        return result;
                    }
                } else {
                    window.showErrorMessage('Something happened while trying to setup the campaign...');
                }
            }
            return;
        }
        window.showErrorMessage('Something happened while retrieving your selected folder...');
    }
    return;
}

export function homebrewAddWrapper(state: any) {
    if (state.tokens.length === 0) {
        return;
    }
    if (state.tokens[0].type !== 'pageBr_open') {
        const open = new state.Token('pageBr_open', 'div', 1);
        open.attrPush(['class', 'phb']);
        open.attrPush(['id', 'p1']);
        open.attrPush(['style', 'margin-bottom: 30px;']);
        state.tokens.splice(0, 0, open);
    }
    if (state.tokens[state.tokens.length - 1].type !== 'pageBr_close') {
        const close = new state.Token('pageBr_close', 'div', -1);
        state.tokens.push(close);
    }
}

export function homebrewReplacePages(state: any) {
    if (state.tokens.length === 0) {
        return;
    }

    let currentPage = 2;

    for (let i = state.tokens.length - 1; i >= 0; i--) {
        if (state.tokens[i].type !== 'inline') {
            continue;
        }
        if (state.tokens[i].content === '\\page') {
            let token;
            const inlineTokens = state.tokens[i].children;
            for (let j = inlineTokens.length - 1; j >= 0; j--) {
                token = inlineTokens[j];
                if (token.type === 'text') {
                    if (token.content === '\\page') {
                        replaceToken(state, i, currentPage);
                        currentPage++;
                        break;
                    }
                }
            }
        }
    }
}

function replaceToken(state: any, tokenPos: any, currentPage: any) {
    const close = new state.Token('pageBr_close', 'div', -1);
    const open = new state.Token('pageBr_open', 'div', 1);
    open.attrPush(['class', 'phb']);
    open.attrPush(['style', 'margin-bottom: 30px;']);
    open.attrPush(['id', `p${currentPage}`]);

    state.tokens[tokenPos-1] = close;
    state.tokens[tokenPos+1] = open;
    state.tokens.splice(tokenPos, 1);
}