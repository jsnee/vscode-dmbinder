import { Uri } from "vscode";
import { TemplateMetadata } from "./TemplateMetadata";

export interface ITemplateItem {
    templateUri: Uri;
    templateName: string;
    inferredFromComponent: boolean;
    getMetadata(): Promise<TemplateMetadata>;
    getContents(): Promise<string>;
}