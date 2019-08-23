import { BrowserFetcher } from "../utils/BrowserFetcher";
import { DMBSettings } from "../Settings";
import { window, ProgressOptions, ProgressLocation, MessageItem } from "vscode";
import { ExtensionCommands } from "../ExtensionCommands";
import { pathExists } from "fs-extra";

export namespace PuppeteerHelper {
    export async function puppeteerError(ex?: Error): Promise<void> {
        const changeResponse = "Change Chromium Version";
        const downloadRecommendedResponse = "Download Recommended Chromium";
        const switchToRecommendedResponse = "Switch to Recommended Chromium";
        const suggestedRevision = require('../package.json').puppeteer.chromium_revision;

        let infoMessageItems = [changeResponse];

        let fetcher = new BrowserFetcher();
        let suggestedRevInfo = fetcher.revisionInfo(suggestedRevision);
        if (suggestedRevInfo) {
            if (suggestedRevInfo.local) {
                let chromeExecPath = DMBSettings.chromeExecutablePath;
                if (chromeExecPath === undefined || chromeExecPath !== suggestedRevInfo.executablePath) {
                    infoMessageItems.push(switchToRecommendedResponse);
                }
            } else {
                infoMessageItems.push(downloadRecommendedResponse);
            }
        }
        
        if (ex) {
            window.showErrorMessage(`Problem encountered while trying to render document to PDF: ${ex.message}`);
        }
        let response = await window.showInformationMessage("Problems rendering PDFs may be caused by a version of Chrome that is incompatible with the version of Puppeteer DM Binder uses.", ...infoMessageItems);
        if (response) {
            if (response === changeResponse) {
                await ExtensionCommands.promptDownloadChromiumRevision();
            } else if (response === downloadRecommendedResponse) {
                await downloadChromiumRevision(suggestedRevision);
            } else if (response === switchToRecommendedResponse && suggestedRevInfo) {
                DMBSettings.chromeExecutablePath = suggestedRevInfo.executablePath;
            }
        }
    }

    export async function downloadChromiumRevision(chromeRev: string | undefined): Promise<void> {
        if (chromeRev) {
            let fetcher = new BrowserFetcher();
            if (await fetcher.canDownload(chromeRev)) {
                let progOpts: ProgressOptions = {
                    location: ProgressLocation.Notification,
                    title: `Downloading Chromium Revision`
                };
                return window.withProgress(progOpts, async (progress, token) => {
                    progress.report({
                        message: chromeRev
                    });
                    let revInfo = await fetcher.download(chromeRev);
                    if (revInfo) {
                        DMBSettings.chromeExecutablePath = revInfo.executablePath;
                    } else {
                        window.showErrorMessage(`Failed to download Chromium revision ${chromeRev}`);
                    }
                });
            } else {
                window.showErrorMessage(`"${chromeRev}" is not a valid Chromium revision number for the given platform (${await fetcher.platform()})`);
            }
        }
    }

    export async function puppeteerHasBrowserInstance(): Promise<boolean> {
        if (DMBSettings.chromeExecutablePath) {
            let pathValid = await pathExists(DMBSettings.chromeExecutablePath);
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