import { ITemplateItem } from "./ITemplateItem";
import { Uri } from "vscode";
import { TemplateMetadata } from "./TemplateMetadata";
import { FileUtility } from "../utils/FileUtility";
import * as matter from "gray-matter";
import * as path from "path";

export class BasicTemplateItem implements ITemplateItem {
    private _hasLoaded: boolean = false;
    private _templateUri: Uri;
    private _inferrredFromComponent: boolean;
    private _templateName: string;
    private _metadata?: TemplateMetadata;
    private _content?: string;

    public constructor(templatePath: string | Uri, templateName?: string, inferredFromComponent: boolean = false) {
        if (templatePath instanceof Uri) {
            this._templateUri = templatePath;
        } else {
            this._templateUri = Uri.file(templatePath);
        }
        this._inferrredFromComponent = inferredFromComponent;
        if (templateName === undefined) {
            this._templateName = path.basename(this._templateUri.fsPath, ".md");
        } else {
            this._templateName = templateName;
        }
    }

    private async loadComponent(): Promise<void> {
        const templateData = await FileUtility.readFileAsync(this.templateUri);
        const templateMatter = matter(templateData, { delimiters: ["---", "---"] });
        if (templateMatter.data) {
            this._metadata = {
                templateEngine: templateMatter.data.templateEngine,
                escapeHtml: templateMatter.data.escapeHtml
            };
        }
        this._content = templateMatter.content;
        this._hasLoaded = true;
    }

    public get templateUri(): Uri {
        return this._templateUri;
    }

    public get templateName(): string {
        return this._templateName;
    }

    public get inferredFromComponent(): boolean {
        return this._inferrredFromComponent;
    }

    public async getMetadata(): Promise<TemplateMetadata> {
        if (!this._hasLoaded) {
            await this.loadComponent();
        }
        return this._metadata || {};
    }

    public async getContents(): Promise<string> {
        if (!this._hasLoaded) {
            await this.loadComponent();
        }
        return this._content || "";
    }
}