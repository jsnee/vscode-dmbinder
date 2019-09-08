import { Uri } from "vscode";
import { ComponentMetadata } from "./ComponentMetadata";

export interface IComponentItem {
    componentUri: Uri;
    componentName: string;
    getMetadata(): Promise<ComponentMetadata>;
    getContents(): Promise<any>;
}