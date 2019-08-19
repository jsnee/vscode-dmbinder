import { DMBSettings } from './Settings';
import * as fse from 'fs-extra';
import * as path from 'path';
import { BrowserFetcher } from './BrowserFetcher';
import { window, extensions, MessageItem, TreeView, QuickPickItem, QuickPickOptions, Uri, ProgressOptions, ProgressLocation } from 'vscode';
import { ExtensionCommands } from './ExtensionCommands';
import { ITreeItem } from './models/ITreeItem';
import { CampaignHelpers } from './helpers/CampaignHelpers';
import { campaignExplorerProvider } from './campaignExplorerProvider';
import { CampaignItemTypeUtils, CampaignItemType } from './CampaignItemType';

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

    export function addNewTreeItem(treeView: TreeView<ITreeItem>, treeType?: CampaignItemType, addFolder: boolean = false): () => Promise<void> {
        return async () => {
            if (treeView.selection.length) {
                let iTreeItem = treeView.selection[0];
                await _addNewTreeItem(iTreeItem, addFolder);
            } else {
                let campaign = await CampaignHelpers.promptSelectCampaign(undefined, true);
                if (campaign) {
                    if (!treeType) {
                        treeType = await _promptChooseCampaignItemType(addFolder);
                    }
                    if (!treeType) {
                        return;
                    }
                    let createdPath: string | undefined;
                    if (addFolder) {
                        createdPath = await CampaignHelpers.promptCreateFolder(campaign.campaignPath);
                    } else {
                        createdPath = await _addNewTreeFile(campaign.campaignPath, treeType);
                    }
                    if (createdPath) {
                        if (treeType) {
                            let relativePath = path.relative(campaign.campaignPath, createdPath);
                            relativePath = `./${relativePath}`;
                            let paths: string[] = [];
                            switch (treeType) {
                                case CampaignItemType.Source:
                                    paths = campaign.sourcePaths;
                                    paths.push(relativePath);
                                    campaign.sourcePaths = paths;
                                    break;
                                case CampaignItemType.Template:
                                    paths = campaign.templatePaths;
                                    paths.push(relativePath);
                                    campaign.templatePaths = paths;
                                    break;
                                case CampaignItemType.Component:
                                    paths = campaign.componentPaths;
                                    paths.push(relativePath);
                                    campaign.componentPaths = paths;
                                    break;
                                case CampaignItemType.Generator:
                                    paths = campaign.generatorPaths;
                                    paths.push(relativePath);
                                    campaign.generatorPaths = paths;
                                    break;
                                default:
                                    return;
                            }
                            await campaign.saveConfig();
                        }
                    }
                }
            }
        };
    }

    export function parseCampaignItemType(value?: string): CampaignItemType | undefined {
        if (value) {
            let key = value as keyof typeof CampaignItemType;
            return CampaignItemType[key];
        }
        return;
    }

    export async function fileExists(path: Uri): Promise<boolean> {
        let response = new Promise<boolean>((resolve, reject) => {
            fse.exists(path.fsPath, resolve);
        });
        return response;
    }

    async function _addNewTreeItem(iTreeItem: ITreeItem, addFolder: boolean): Promise<void> {
        const treeItem = await iTreeItem.getTreeItem();
        if (!treeItem.resourceUri) {
            let parentTreeItem = await campaignExplorerProvider.getParent(iTreeItem);
            if (parentTreeItem) {
                return await _addNewTreeItem(parentTreeItem, addFolder);
            }
            throw Error("Can't create file/folder here!");
        }
        let contextFolder = treeItem.resourceUri.fsPath;
        if (iTreeItem.getContextValue().endsWith("Item")) {
            contextFolder = path.dirname(contextFolder);
        }
        if (addFolder) {
            await CampaignHelpers.promptCreateFolder(contextFolder);
        } else {
            let itemType = iTreeItem.campaignItemType;
            if (!itemType) {
                itemType = await _promptChooseCampaignItemType(false);
                if (!itemType) {
                    return;
                }
            }
            await _addNewTreeFile(contextFolder, itemType);
        }
    }

    async function _promptChooseCampaignItemType(isFolder: boolean): Promise<CampaignItemType | undefined> {
        const qpItemTypes: QuickPickItem[] = [
            {
                label: "Source",
                detail: "Documents written in Markdown that are used to generate the output PDF files."
            },
            {
                label: "Template",
                detail: "Used to format 'components' when inserting into source documents."
            },
            {
                label: "Component",
                detail: "Data files that can be reused to insert into source documents."
            },
            {
                label: "Generator",
                detail: "Files that specify how to generate content (like names)"
            }
        ];
        const qpOpts: QuickPickOptions = {
            canPickMany: false,
            placeHolder: `Which Type of Item${isFolder ? " Folder" : ""} Are You Trying to Add?`
        };
        let itemType = await window.showQuickPick(qpItemTypes, qpOpts);
        if (itemType) {
            return parseCampaignItemType(itemType.label);
        }
        return;
    }

    async function _addNewTreeFile(parentDirectory: string, treeType: CampaignItemType): Promise<string | undefined> {
        let extensions = CampaignItemTypeUtils.getFileExtensions(treeType);
        let allowedExtensions: QuickPickItem[] = [];
        for (let ext of extensions) {
            allowedExtensions.push({
                label: ext.description,
                description: ext.extension
            });
        }
        return await CampaignHelpers.promptCreateFile(parentDirectory, allowedExtensions);
    }
}