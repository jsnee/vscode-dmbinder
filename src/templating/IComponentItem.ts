import { Uri } from "vscode";
import { ComponentMetadata } from "./ComponentMetadata";

export interface IComponentItem {
    componentUri: Uri;
    getMetadata(): Promise<ComponentMetadata>;
    getContents(): Promise<any>;
}