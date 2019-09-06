import { IComponentItem } from "./IComponentItem";
import { ITemplateItem } from "./ITemplateItem";

export interface ITemplateEngine {
    buildComponent(template: ITemplateItem, component: IComponentItem): Promise<string>;
}