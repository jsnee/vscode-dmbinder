// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as vscode from "vscode";
import { CampaignItemType } from "./CampaignItemType";

export interface ITreeItem {
    /**
     * If implemented, it will return the CampaignItemType of the tree item.
     */
    readonly campaignItemType?: CampaignItemType | undefined;
    isEmpty?: boolean;
    getContextValue(): string;
    getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem>;

    /**
     * If implemented, it will be triggered to get children items.
     */
    getChildren?(): vscode.ProviderResult<ITreeItem[]>;
    /**
     * If implemented, it will be triggered to get the path to the campaign root.
     */
    getCampaignPath?(): string;
    /**
     * If implemented, it will be triggered to get the path relative to the campaign root.
     */
    getContextPath?(): string;
    /**
     * If implemented, it will be triggered to refresh tree item.
     */
    refresh?(): void | Promise<void>;
}
