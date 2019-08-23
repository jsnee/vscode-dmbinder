export enum CampaignItemType {
    Source = "SourceItem",
    Template = "TemplateItem",
    Component = "ComponentItem",
    Generator = "GeneratorItem"
}

export namespace CampaignItemTypeUtils {
    export function getFileExtensions(itemType: CampaignItemType): { extension: string, description: string }[] {
        switch (itemType) {
            case CampaignItemType.Source:
            case CampaignItemType.Template:
                return [
                    { extension: ".md", description: "Markdown" }
                ];
            case CampaignItemType.Component:
                return [
                    { extension: ".json", description: "JSON" },
                    { extension: ".yaml", description: "YAML" }
                ];
            case CampaignItemType.Generator:
                return [
                    { extension: ".dmbgen.json", description: "DM Binder Generator JSON" }
                ];
        }
    }
}