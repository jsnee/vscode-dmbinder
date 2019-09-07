import { ITemplateEngine } from "./ITemplateEngine";
import { ITemplateItem } from "./ITemplateItem";
import { IComponentItem } from "./IComponentItem";

export class MustacheEngine implements ITemplateEngine {
    public async buildComponent(template: ITemplateItem, component: IComponentItem): Promise<string> {
        // TODO: Load partials
        const templateMetadata = await template.getMetadata();
        // Thread-safe usage of mustache
        const Mustache = await import("mustache");
        // Replace the escape function unless the template specifies to escape HTML
        if (!templateMetadata.escapeHtml) {
            Mustache.escape = function(text) {return text;};
        }
        const templateData = await template.getContents();
        const componentData = await component.getContents();
        return Mustache.render(templateData, componentData);
    }
}