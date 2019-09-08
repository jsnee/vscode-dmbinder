import { CampaignHelper } from "./CampaignHelper";
import { CampaignItemTypeUtils, CampaignItemType } from "../ui/CampaignItemType";
import { QuickPickItem, QuickPickOptions, window, TreeView } from "vscode";
import * as path from "path";
import { ITreeItem } from "../ui/ITreeItem";
import { campaignExplorerProvider } from "../ui/campaignExplorerProvider";

export namespace ExplorerHelper {
    export function addNewTreeItem(treeView: TreeView<ITreeItem>, treeType?: CampaignItemType, addFolder: boolean = false): () => Promise<void> {
        return async () => {
            if (treeView.selection.length) {
                let iTreeItem = treeView.selection[0];
                await _addNewTreeItem(iTreeItem, addFolder);
            } else {
                let campaign = await CampaignHelper.promptSelectCampaign(undefined, true);
                if (campaign) {
                    if (!treeType) {
                        treeType = await _promptChooseCampaignItemType(addFolder);
                    }
                    if (!treeType) {
                        return;
                    }
                    let createdPath: string | undefined;
                    if (addFolder) {
                        createdPath = await CampaignHelper.promptCreateFolder(campaign.campaignPath);
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
                                    paths = campaign.sourcePaths || [];
                                    paths.push(relativePath);
                                    campaign.sourcePaths = paths;
                                    break;
                                case CampaignItemType.Template:
                                    paths = campaign.templatePaths || [];
                                    paths.push(relativePath);
                                    campaign.templatePaths = paths;
                                    break;
                                case CampaignItemType.Component:
                                    paths = campaign.componentPaths || [];
                                    paths.push(relativePath);
                                    campaign.componentPaths = paths;
                                    break;
                                case CampaignItemType.Generator:
                                    paths = campaign.generatorPaths || [];
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
            await CampaignHelper.promptCreateFolder(contextFolder);
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
            return CampaignHelper.parseCampaignItemType(itemType.label);
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
        return await CampaignHelper.promptCreateFile(parentDirectory, allowedExtensions);
    }
}