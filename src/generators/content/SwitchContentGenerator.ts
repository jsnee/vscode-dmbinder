import { GeneratorSourceConfig } from "./GeneratorSourceConfig";
import { BaseContentGenerator, GeneratorVars } from "./BaseContentGenerator";

export class SwitchContentGenerator extends BaseContentGenerator {
    constructor(generatorSource: GeneratorSourceConfig) {
        super(generatorSource);
    }

    public generate(vars: GeneratorVars = {}): string {
        if (!this._source.condition) {
            throw Error("'Switch' content generator is missing a condition");
        }
        let cases = Object.keys(this._source.switchValues || {});
        // Checking switchValues again so typscript knows it's empty
        if (!this._source.switchValues || !cases.length) {
            throw Error("'Switch' content generator is missing 'switchValues'!");
        }
        if (vars[this._source.condition] === undefined) {
            // Variable doesn't exist, so randomly pick one of the variables
            let pickedCase = cases[Math.floor(Math.random() * cases.length)];
            vars[this._source.condition] = pickedCase;
        }
        if (vars[this._source.condition]) {
            let conditionValue = vars[this._source.condition];
            if (this._source.switchValues[conditionValue]) {
                let result = this._source.switchValues[conditionValue];
                if (result instanceof Array) {
                    return result[Math.floor(Math.random() * result.length)];
                }
                return result;
            }
        }
        throw Error("'Switch' content generator encountered an unexpected error");
    }
}