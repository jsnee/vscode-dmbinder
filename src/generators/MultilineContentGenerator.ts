import { BaseContentGenerator, GeneratorVars } from "./BaseContentGenerator";
import { GeneratorSourceConfig } from "../models/GeneratorSourceConfig";

export class MultilineContentGenerator extends BaseContentGenerator {
    constructor(generatorSource: GeneratorSourceConfig) {
        super(generatorSource);
    }

    public generate(vars: GeneratorVars): string {
        if (this._source.values && this._source.values.length) {
            return this._source.values.join("\n");
        }
        return "";
    }
}