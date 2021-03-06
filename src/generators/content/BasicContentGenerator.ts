import { BaseContentGenerator, GeneratorVars } from "./BaseContentGenerator";
import { GeneratorSourceConfig } from "./GeneratorSourceConfig";

export class BasicContentGenerator extends BaseContentGenerator {
    constructor(generatorSource: GeneratorSourceConfig) {
        super(generatorSource);
    }

    public generate(vars: GeneratorVars = {}): string {
        return this.getRandomValue() || "";
    }
}