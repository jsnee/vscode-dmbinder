export enum TemplateEngineType {
    Pandoc = "pandoc",
    Mustache = "mustache"
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