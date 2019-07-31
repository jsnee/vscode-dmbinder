import { DMBSettings } from './Settings';
import * as fse from 'fs-extra';
import { BrowserFetcher } from './BrowserFetcher';
import { window, extensions, MessageItem } from 'vscode';
import { ExtensionCommands } from './ExtensionCommands';

export namespace Utils {
    export function alertError(error: Error): Thenable<void> {
        return window.showErrorMessage(error.message).then();
    }

    export function getExtensionPath(): string {
        let result = extensions.getExtension('jpsnee.vscode-dmbinder');
        if (!result) {
            return '';
        }
        return result.extensionPath;
    }

    export async function puppeteerHasBrowserInstance(): Promise<boolean> {
        if (DMBSettings.chromeExecutablePath) {
            let pathValid = await fse.pathExists(DMBSettings.chromeExecutablePath);
            if (pathValid) {
                return Promise.resolve(true);
            }
            window.showWarningMessage("Specified Chrome executable path not found.");
            await DMBSettings.updateChromeExecutablePath(undefined);
        }
        const fetcher = new BrowserFetcher();
        let revs = await fetcher.localRevisions();
        return revs.length > 0;
    }

    export async function modalNoPuppeteerBrowser(): Promise<boolean> {
        await alertNoPuppeteerBrowser(true);
        return await puppeteerHasBrowserInstance();
    }

    export function alertNoPuppeteerBrowser(useModal: boolean = false): Thenable<void> {
        let responses: MessageItem[] = [
            {
                title: "Download Chromium"
            },
            {
                title: "Use Local Chrome"
            },
            {
                title: "Ignore",
                isCloseAffordance: true
            },
        ];
        let msg = "No local Chrome path specified and no Chromium instances installed for PDF generation.";
        return window.showErrorMessage(msg, { modal: useModal }, ...responses).then((response) => {
            switch (response) {
                case responses[0]:
                    return ExtensionCommands.promptDownloadChromiumRevision();
                case responses[1]:
                    return ExtensionCommands.promptChooseChromeExecutable();
                case responses[2]:
                default:
                    return Promise.resolve();
            }
        });
    }
}