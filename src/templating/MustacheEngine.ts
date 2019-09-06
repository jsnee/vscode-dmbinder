import { ITemplateEngine } from "./ITemplateEngine";
import Mustache = require("mustache");
import { ITemplateItem } from "./ITemplateItem";
import { IComponentItem } from "./IComponentItem";
import { ComponentHelper } from "../helpers/ComponentHelper";

export class MustacheEngine implements ITemplateEngine {
    private static _pandocSyntaxRegEx = /\$(?:if\(|for\()?[\w.]+\)?\$/g;

    public async buildComponent(template: ITemplateItem, component: IComponentItem): Promise<string> {
        // TODO: Load partials
        const templateData = await template.getContents();
        const componentData = await component.getContents();
        if (MustacheEngine._pandocSyntaxRegEx.test(templateData)) {
            // tslint:disable-next-line: no-floating-promises
            ComponentHelper.alertPandocDetectedWhileMustacheRendering();
        }
        return Mustache.render(templateData, componentData);
    }
}