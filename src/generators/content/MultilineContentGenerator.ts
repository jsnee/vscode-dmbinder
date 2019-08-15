import { BaseContentGenerator, GeneratorVars } from "./BaseContentGenerator";
import { GeneratorSourceConfig } from "./GeneratorSourceConfig";

export class MultilineContentGenerator extends BaseContentGenerator {
    constructor(generatorSource: GeneratorSourceConfig) {
        super(generatorSource);
    }

    public generate(vars: GeneratorVars): string {
        if (this._source.values && this._source.values instanceof Array && this._source.values.length) {
            return this._source.values.join("\n");
        }
        return "";
    }
}