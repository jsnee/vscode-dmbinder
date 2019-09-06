import { ITemplateEngine } from "./ITemplateEngine";
import { exec } from "child_process";
import { IComponentItem } from "./IComponentItem";
import { ITemplateItem } from "./ITemplateItem";

export class PandocEngine implements ITemplateEngine {
    public async buildComponent(template: ITemplateItem, component: IComponentItem): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            exec(`echo '' | pandoc --template="${template.templateUri.fsPath}" --metadata-file="${component.componentUri.fsPath}" --metadata pagetitle=" "`, (error, stdout, stderr) => {
                resolve(stderr || stdout);
            });
        });
    }
}