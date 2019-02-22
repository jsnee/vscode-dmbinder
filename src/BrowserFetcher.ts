export enum BrowserPlatform {
    Mac = "mac",
    Win32 = "win32",
    Win64 = "win64",
    Linux = "linux"
}

export interface BrowserFetcherOptions {
    host?: string;
    path?: string;
    platform?: BrowserPlatform;
}

export interface BrowserRevisionInfo {
    revision: string;
    executablePath: string;
    folderPath: string;
    local: boolean;
    url: string;
}

export class BrowserFetcher {
    private _fetcher: any;

    constructor(options?: BrowserFetcherOptions) {
        let opts = undefined;
        if (options) {
            let platform: string | undefined;
            if (options.platform) {
                switch (options.platform) {
                    case BrowserPlatform.Mac:
                        platform = "mac";
                        break;
                    case BrowserPlatform.Win32:
                        platform = "win32";
                        break;
                    case BrowserPlatform.Win64:
                        platform = "win64";
                        break;
                    case BrowserPlatform.Linux:
                        platform = "linux";
                        break;
                    default:
                        break;
                }
            }
            opts = {
                host: options.host,
                path: options.path,
                platform: platform
            };
        }
        this._fetcher = require('puppeteer').createBrowserFetcher(opts);
    }
    
    public async canDownload(revision: string): Promise<boolean> {
        return this._fetcher.canDownload(revision);
    }

    public async download(revision: string): Promise<BrowserRevisionInfo | undefined> {
        if (!(await this.canDownload(revision))) {
            return;
        }
        return this._fetcher.download(revision);
    }

    public async localRevisions(): Promise<string[]> {
        return this._fetcher.localRevisions();
    }

    public async platform(): Promise<string> {
        return this._fetcher.platform();
    }
}