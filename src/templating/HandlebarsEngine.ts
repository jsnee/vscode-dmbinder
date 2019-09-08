import { ITemplateEngine } from "./ITemplateEngine";
import { ITemplateItem } from "./ITemplateItem";
import { IComponentItem } from "./IComponentItem";
import * as Handlebars from "handlebars";

export class HandlebarsEngine implements ITemplateEngine {
    public async buildComponent(template: ITemplateItem, component: IComponentItem): Promise<string> {
        // TODO: Load partials
        // TODO: Allow custom helpers
        const templateMetadata = await template.getMetadata();
        const templateData = await template.getContents();
        const componentData = await component.getContents();
        var templateOpts: CompileOptions = {
            noEscape: !templateMetadata.escapeHtml
        };
        var compiledTemplate = Handlebars.compile(templateData, templateOpts);
        var componentOpts: RuntimeOptions = {};
        return compiledTemplate(componentData, componentOpts);
    }
}