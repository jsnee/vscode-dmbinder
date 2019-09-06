import { IComponentItem } from "./IComponentItem";
import { Uri } from "vscode";
import { ComponentMetadata } from "./ComponentMetadata";
import * as matter from "gray-matter";
import * as yaml from "js-yaml";
import { FileUtility } from "../utils/FileUtility";

export class YamlComponentItem implements IComponentItem {
    private _hasLoaded: boolean = false;
    private _componentUri: Uri;
    private _metadata?: ComponentMetadata;
    private _content?: any;

    public constructor(componentPath: string | Uri) {
        if (componentPath instanceof Uri) {
            this._componentUri = componentPath;
        } else {
            this._componentUri = Uri.parse(componentPath);
        }
    }

    private async loadComponent(): Promise<void> {
        const componentData = await FileUtility.readFileAsync(this.componentUri);
        const componentMatter = matter(componentData, { delimiters: ["---", "---"] });
        const componentContents = yaml.safeLoad(componentMatter.content);
        if (componentMatter.data) {
            this._metadata = {
                templateItem: componentMatter.data.templateItem
            };
        }
        if (typeof(componentContents) === "object") {
            this._content = componentContents;
        }
        this._hasLoaded = true;
    }

    public get componentUri(): Uri {
        return this._componentUri;
    }

    public async getMetadata(): Promise<ComponentMetadata> {
        if (!this._hasLoaded) {
            await this.loadComponent();
        }
        return this._metadata || {};
    }

    public async getContents(): Promise<any> {
        if (!this._hasLoaded) {
            await this.loadComponent();
        }
        return this._content;
    }
}