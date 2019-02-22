import { ITreeItem } from "./models/ITreeItem";
import { Uri, window, ProgressLocation, CancellationToken } from "vscode";
import { getExtensionPath } from "./common";
import { contextProps } from "./extension";
import { Campaign } from "./models/Campaign";
import { getVsMd } from "./markdownHomebrewery";
import { DMBSettings } from "./Settings";
import * as fse from 'fs-extra';
import * as path from "path";
import * as Puppeteer from 'puppeteer';

function getBrewPath(): string {
    return path.join(contextProps.localStoragePath, 'dmbinder-brewing');
}

function getAssetPath(): string {
    return path.join(getExtensionPath(), 'assets');
}

async function cleanupBrewDirectory(): Promise<void> {
    let cleanupAction = fse.remove(getBrewPath());
    window.setStatusBarMessage("Cleaning up...", cleanupAction);
    await cleanupAction;
}

async function copyAssetsToBrewDirectory(): Promise<void> {
    let copyAssets = fse.copy(getAssetPath(), getBrewPath(), { recursive: true });
    window.setStatusBarMessage("Copying assets...", copyAssets);
    await copyAssets;
}

async function renderFileContents(uri: Uri): Promise<string> {
    let data = await fse.readFile(uri.fsPath, 'utf-8');
    const md = getVsMd();
    if (!md) {
        console.error("VSCode markdown-it not found.");
        throw new Error("VSCode markdown-it not found.");
    }
    const body = md.render(data);
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
        <link rel="stylesheet" href="${path.join(getBrewPath(), 'jsnee-homebrew.css')}">
        <link rel="stylesheet" href="${path.join(getBrewPath(), 'phb-previewSpecific.css')}">
        <link rel="stylesheet" href="${path.join(getBrewPath(), 'phb.standalone.css')}">
    </head>
    <body class="vscode-body">
        ${body}
    </body>
    </html>`;
}

async function renderHomebrewStandalone(uri: Uri): Promise<void> {
    await copyAssetsToBrewDirectory();

    let basename = path.basename(uri.path, '.md');
    window.setStatusBarMessage(`Printing '${basename}' to HTML ...`, 1000);
    let brewDir = getBrewPath();
    let brewPath = path.join(brewDir, basename + '.html');

    const html = await renderFileContents(uri);

    fse.writeFile(brewPath, html, 'utf-8', function (err) {
        if (err) {
            console.error(err);
        }
    });

    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(Uri.file(brewPath).toString(), { waitUntil: "networkidle2" });

    let outDir = path.dirname(uri.fsPath);
    let outPath = path.join(outDir, basename + '.pdf');
    await page.pdf({ path: outPath, format: 'Letter' });
    await cleanupBrewDirectory();
}

async function renderHtmlFile(filePath: string, outPath?: string): Promise<string> {
    let basename = path.basename(filePath, '.md');
    let brewPath = path.join(getBrewPath(), basename + '.html');
    if (outPath) {
        brewPath = path.join(getBrewPath(), outPath, basename + '.html');
        await fse.ensureDir(path.join(getBrewPath(), outPath));
    }

    const html = await renderFileContents(Uri.file(filePath));

    fse.writeFile(brewPath, html, 'utf-8', function (err) {
        if (err) { console.log(err); }
    });
    return brewPath;
}

async function renderPdfFile(sourcePath: string, outDir: string, brewDir?: string): Promise<void> {
    let htmlPath = await renderHtmlFile(sourcePath, brewDir);

    let opts: Puppeteer.LaunchOptions | undefined = undefined;
    if (DMBSettings.chromeExecutablePath) {
        opts = {
            executablePath: DMBSettings.chromeExecutablePath
        };
    }
    const browser = await Puppeteer.launch(opts);
    const page = await browser.newPage();
    await page.goto(Uri.file(htmlPath).toString(), { waitUntil: "networkidle2" });

    let outPath = path.join(outDir, path.basename(sourcePath, '.md') + '.pdf');
    await page.pdf({ path: outPath, format: 'Letter' });
}

async function renderCampaignSourceItem(campaign: Campaign, sourcePath: string, outPath?: string, progressAction?: (message: string) => void, token?: CancellationToken): Promise<void> {
    let isCancelled = false;
    if (token) {
        isCancelled = token.isCancellationRequested;
        token.onCancellationRequested(() => isCancelled = true);
    }
    if (isCancelled) {
        return;
    }
    let stat = await fse.stat(sourcePath);
    if (stat.isDirectory()) {
        let children = await fse.readdir(sourcePath);
        for (let child of children) {
            if (isCancelled) {
                return;
            }
            if (outPath) {
                await renderCampaignSourceItem(campaign, path.join(sourcePath, child), path.join(outPath, path.basename(sourcePath)), progressAction, token);
            } else {
                await renderCampaignSourceItem(campaign, path.join(sourcePath, child), path.basename(sourcePath), progressAction, token);
            }
        }
    }
    if (stat.isFile() && sourcePath.endsWith(".md")) {
        let outDirPath = campaign.campaignPath;
        if (campaign.outDirectory) {
            if (path.isAbsolute(campaign.outDirectory)) {
                outDirPath = campaign.outDirectory;
            } else {
                outDirPath = path.join(campaign.campaignPath, campaign.outDirectory);
            }
        }
        if (outPath) {
            outDirPath = path.join(outDirPath, outPath);
        }
        await fse.ensureDir(outDirPath);
        let renderAction = renderPdfFile(sourcePath, outDirPath, outPath);
        if (progressAction) {
            progressAction(`Rendering '${path.basename(sourcePath, '.md')}' to PDF`);
        } else {
            window.setStatusBarMessage(`Rendering '${path.basename(sourcePath, '.md')}' to PDF ...`, renderAction);
        }
        await renderAction;
    }
}

async function renderSingleCampaignSource(campaign: Campaign, sourcePath: string, outPath?: string): Promise<void> {
    await copyAssetsToBrewDirectory();

    await renderCampaignSourceItem(campaign, sourcePath, outPath);

    await cleanupBrewDirectory();
}

async function getFileCountRecursive(paths: string[], pathBase: string, extensionFilter?: string | string[]): Promise<number> {
    let result = 0;
    for (let eachPath of paths.map((ea) => path.join(pathBase, ea))) {
        let stat = await fse.stat(eachPath);
        if (stat.isDirectory()) {
            result += await getFileCountRecursive(await fse.readdir(eachPath), path.join(pathBase, path.basename(eachPath)), extensionFilter);
        } else if (stat.isFile()) {
            if (extensionFilter) {
                if (!hasFileExtension(eachPath, ...extensionFilter)) {
                    continue;
                }
            }
            result++;
        }
    }
    return result;
}

function hasFileExtension(filename: string, ...exts: string[]): boolean {
    for (let ext of exts) {
        if (filename.endsWith(ext)) {
            return true;
        }
    }
    return false;
}

export async function renderCampaign(campaign: Campaign): Promise<void> {
    let progOpts = {
        location: ProgressLocation.Notification,
        cancellable: true,
        title: `${campaign.campaignName}`
    };

    let fileCount = await getFileCountRecursive(campaign.sourcePaths, campaign.campaignPath, '.md');

    window.withProgress(progOpts, async (progress, token) => {
        let isCancelled = false;
        token.onCancellationRequested(async () => {
            window.showWarningMessage(`Cancelled rendering files from "${campaign.campaignName}".`);
            window.setStatusBarMessage("Cancelling...", 1000);
        });
        progress.report({
            message: "Copying Assets..."
        });
        await copyAssetsToBrewDirectory();

        for (let source of campaign.sourcePaths) {
            if (isCancelled) {
                break;
            }
            let sourcePath = path.join(campaign.campaignPath, source);
            await renderCampaignSourceItem(campaign, sourcePath, undefined, (message) => {
                progress.report({
                    message: message,
                    increment: 100 / fileCount
                });
            }, token);
        }

        progress.report({
            message: "Cleaning Up..."
        });
        if (isCancelled) {
            window.setStatusBarMessage("Cleaning Up...", 1000);
        }
        await cleanupBrewDirectory();
    });
}

export async function renderHomebrew(item?: ITreeItem): Promise<void> {
    if (item) {
        switch (item.getContextValue()) {
            case "SourceItem":
                let treeItem = await item.getTreeItem();
                if (treeItem.resourceUri) {
                    if (item.getCampaignPath && await Campaign.hasCampaignConfig(item.getCampaignPath())) {
                        let campaign = new Campaign(item.getCampaignPath());
                        return renderSingleCampaignSource(campaign, treeItem.resourceUri.fsPath, item.getContextPath ? item.getContextPath() : undefined);
                    }
                    return renderHomebrewStandalone(treeItem.resourceUri);
                }
                break;
            default:
                break;
        }
    }
}