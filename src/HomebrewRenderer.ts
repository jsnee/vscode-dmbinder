import { DMBSettings } from "./Settings";
import { ITreeItem } from "./models/ITreeItem";
import { Uri, window } from "vscode";
import * as fse from 'fs-extra';
import * as path from "path";
import { getExtensionPath } from "./common";

let vscMd: markdownit;

async function renderHomebrewItem(uri: Uri): Promise<void> {
    let basename = path.basename(uri.path, '.md');
    window.setStatusBarMessage(`Printing '${basename}' to HTML ...`, 1000);
    let outPath = path.join(path.dirname(uri.fsPath), basename + '.html');

    const body = vscMd.render(await fse.readFile(uri.fsPath, 'utf-8'));
    const html = `<!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
        <link rel="stylesheet" href="jsnee-homebrew.css">
        <link rel="stylesheet" href="phb-previewSpecific.css">
        <link rel="stylesheet" href="phb.standalone.css">
    </head>
    <body class="vscode-body">
        ${body}
    </body>
    </html>`;

    fse.writeFile(outPath, html, 'utf-8', function (err) {
        if (err) { console.log(err); }
    });
    window.showInformationMessage(`Created ${outPath}`);

    const assetPath = path.join(getExtensionPath(), 'assets');
    await fse.copy(assetPath, path.dirname(outPath), { recursive: true });
}

export async function renderHomebrew(item?: ITreeItem): Promise<void> {
    if (item) {
        switch (item.getContextValue()) {
            case "SourceItem":
                let treeItem = await item.getTreeItem();
                if (treeItem.resourceUri) {
                    return renderHomebrewItem(treeItem.resourceUri);
                }
                break;
            default:
                break;
        }
    }
}

export function registerHomebrewRenderer(md: markdownit): markdownit {
    vscMd = md;
    md.core.ruler.before('replacements', 'homebrewery_wrapper', homebrewAddWrapper);
    md.core.ruler.after('homebrewery_wrapper', 'homebrewery_pages', homebrewReplacePages);
    return md;
}

function homebrewAddWrapper(state: any) {
    if (state.tokens.length === 0 || !DMBSettings.homebreweryEnabled) {
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

function homebrewReplacePages(state: any) {
    if (state.tokens.length === 0 || !DMBSettings.homebreweryEnabled) {
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