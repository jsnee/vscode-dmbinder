import { GeneratorSourceConfig } from "../../models/GeneratorSourceConfig";

export interface GeneratorVars {
    [varName: string]: string;
}

export abstract class BaseContentGenerator {
    protected _source: GeneratorSourceConfig;

    constructor(generatorSource: GeneratorSourceConfig) {
        this._source = generatorSource;
    }

    abstract generate(vars?: GeneratorVars): string;

    protected getRandomValue(): string | undefined {
        if (!this._source.values || (this._source.values instanceof Array && this._source.values.length === 0)) {
            return undefined;
        }
        if (this._source.values instanceof Array) {
            return this._source.values[Math.floor(Math.random() * this._source.values.length)];
        }
        throw Error("There was a problem while trying to generate content...");
    }
}