import { campaignExplorerProvider } from "../ui/campaignExplorerProvider";
import { QuickPickItem, Uri } from "vscode";
import { GeneratorSource } from "../generators/content/GeneratorSource";

export namespace GeneratorHelper {
    export async function generateElementByName(generatorName: string): Promise<string | undefined> {
        const generatorItem = await getGenerator(generatorName);
        if (generatorItem && generatorItem.detail) {
            let generator = await GeneratorSource.loadGeneratorSource(Uri.file(generatorItem.detail).fsPath);
            return generator.generateContent({});
        }
        return;
    }

    export async function getGenerator(generatorName: string): Promise<QuickPickItem | undefined> {
        if (generatorName) {
            const qpItemList = await campaignExplorerProvider.getGeneratorItems();
            if (qpItemList) {
                for (let each of qpItemList) {
                    if (each.label === generatorName) {
                        return each;
                    }
                }
            }
        }
        return;
    }
}