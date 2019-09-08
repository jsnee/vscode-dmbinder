export enum TemplateEngineType {
    Handlebars = "handlebars",
    Mustache = "mustache",
    Pandoc = "pandoc"
}

export namespace TemplateEngineTypeExtensions {
    export function parseTemplateEngineType(value?: string): TemplateEngineType | undefined {
        if (value) {
            let key = value as keyof typeof TemplateEngineType;
            return TemplateEngineType[key];
        }
        return;
    }
}