import { MarkdownIt } from 'markdown-it';
import { DMBSettings } from '../Settings';

export class HombreweryEngine {
    private md?: Promise<MarkdownIt>;
    private _slugCount = new Map<string, number>();
    private readonly slugifier: Slugifier;

    public constructor() {
        this.slugifier = githubSlugifier;
    }

    private async getEngine(): Promise<MarkdownIt> {
        if (!this.md) {
            this.md = import('markdown-it').then(async markdownIt => {
                let md: MarkdownIt = markdownIt({ html: true });
                this.addNamedHeaders(md);
                this.addHomebreweryWrapper(md);
                this.addPageSplitter(md);
                return md;
            });
        }
        return await this.md;
    }

    public async render(input: string): Promise<string> {
        const engine = await this.getEngine();
        return engine.render(input);
    }

    private addHomebreweryWrapper(md: MarkdownIt): void {
        md.core.ruler.before('replacements', 'homebrewery_wrapper', (state: any) => {
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
        });
    }

    private addPageSplitter(md: MarkdownIt): void {
        md.core.ruler.after('homebrewery_wrapper', 'homebrewery_pages', (state: any) => {
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
        });
    }

    private addNamedHeaders(md: MarkdownIt): void {
        const original = md.renderer.rules.heading_open;
        md.renderer.rules.heading_open = (tokens: any, idx: number, options: any, env: any, self: any) => {
            const title = tokens[idx + 1].children.reduce((acc: string, t: any) => acc + t.content, '');
            let slug = this.slugifier.fromHeading(title);

            if (this._slugCount.has(slug.value)) {
                const count = this._slugCount.get(slug.value)!;
                this._slugCount.set(slug.value, count + 1);
                slug = this.slugifier.fromHeading(slug.value + '-' + (count + 1));
            } else {
                this._slugCount.set(slug.value, 0);
            }

            tokens[idx].attrs = tokens[idx].attrs || [];
            tokens[idx].attrs.push(['id', slug.value]);

            if (original) {
                return original(tokens, idx, options, env, self);
            } else {
                return self.renderToken(tokens, idx, options, env, self);
            }
        };
    }
}

function replaceToken(state: any, tokenPos: number, currentPage: number) {
    const close = new state.Token('pageBr_close', 'div', -1);
    const open = new state.Token('pageBr_open', 'div', 1);
    open.attrPush(['class', 'phb']);
    open.attrPush(['id', `p${currentPage}`]);

    state.tokens[tokenPos-1] = close;
    state.tokens[tokenPos+1] = open;
    state.tokens.splice(tokenPos, 1);
}

class Slug {
    public constructor(
        public readonly value: string
    ) { }

    public equals(other: Slug): boolean {
        return this.value === other.value;
    }
}

interface Slugifier {
    fromHeading(heading: string): Slug;
}

const githubSlugifier: Slugifier = new class implements Slugifier {
    fromHeading(heading: string): Slug {
        const slugifiedHeading = encodeURI(
            heading.trim()
                .toLowerCase()
                .replace(/\s+/g, '-') // Replace whitespace with -
                .replace(/[\]\[\!\'\#\$\%\&\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝]/g, '') // Remove known punctuators
                .replace(/^\-+/, '') // Remove leading -
                .replace(/\-+$/, '') // Remove trailing -
        );
        return new Slug(slugifiedHeading);
    }
};