import { BaseContentGenerator } from "./BaseContentGenerator";
import { GeneratorSourceConfig } from "../models/GeneratorSource";

export class BasicContentGenerator extends BaseContentGenerator {
    constructor(generatorSource: GeneratorSourceConfig) {
        super(generatorSource);
    }

    public generate(): string {
        return this.getRandomValue() || "";
    }
}