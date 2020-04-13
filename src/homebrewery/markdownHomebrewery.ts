import { DMBSettings } from "../Settings";
import { MarkdownIt } from 'markdown-it';

export function registerHomebrewRenderer(ogMd: MarkdownIt): MarkdownIt {
    ogMd.core.ruler.before('replacements', 'homebrewery_wrapper', homebrewAddWrapper);
    ogMd.core.ruler.after('homebrewery_wrapper', 'homebrewery_pages', homebrewReplacePages);
    return ogMd;
}

function homebrewAddWrapper(state: any) {
    if (state.tokens.length === 0 || !DMBSettings.homebreweryEnabled) {
        return;
    }
    if (state.tokens[0].type !== 'pageBr_open') {
        const open = new state.Token('pageBr_open', 'div', 1);
        open.attrPush(['class', 'phb']);
        open.attrPush(['id', 'p1']);
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

    for (let i = 0; i < state.tokens.length; i++) {
        if (state.tokens[i].type !== 'inline') {
            continue;
        }
        if (state.tokens[i].content === '\\page') {
            let token;
            const inlineTokens = state.tokens[i].children;
            for (let j = 0; j < inlineTokens.length; j++) {
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
    open.attrPush(['id', `p${currentPage}`]);

    state.tokens[tokenPos-1] = close;
    state.tokens[tokenPos+1] = open;
    state.tokens.splice(tokenPos, 1);
}