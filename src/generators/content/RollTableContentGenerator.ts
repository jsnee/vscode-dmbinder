import { BaseContentGenerator, GeneratorVars } from "./BaseContentGenerator";
import { GeneratorSourceConfig } from "./GeneratorSourceConfig";

interface RollTableRange {
    key: string;
    min: number;
    max: number;
}

// Make abstract class to prevent accessing lazy loaded values directly
abstract class BaseRollTableContentGenerator extends BaseContentGenerator {
    private _ranges: RollTableRange[] | undefined;
    private _maxVal: number | undefined;
    
    constructor(generatorSource: GeneratorSourceConfig) {
        super(generatorSource);
    }

    protected get ranges(): RollTableRange[] {
        if (this._ranges === undefined) {
            this.loadRanges();
        }
        return this._ranges || [];
    }

    protected get maxVal(): number {
        if (this._maxVal === undefined) {
            this.loadRanges();
        }
        return this._maxVal || 0;
    }

    private loadRanges(): void {
        if (this._source.rollValues === undefined) {
            throw new Error('"RollTable" content generator encountered an unexpected error: No "rollValues" configured!');
        }
        let ranges: RollTableRange[] = [];

        // Build the range list
        for (let value in this._source.rollValues) {
            const vals = value.split("-");
            const range = {
                key: value,
                min: parseInt(vals[0]),
                max: parseInt(vals[vals.length - 1])
            };
            if (isNaN(range.min) || isNaN(range.max) || range.max < range.min) {
                throw new Error(`'RollTable' content generator encountered an unexpected error: Invalid roll value "${value}"!`);
            }
            ranges.push(range);
        }

        // Sort the ranges
        ranges = ranges.sort((a, b) => {
            return a.min - b.min;
        });

        // Make sure none of the ranges overlap or gap and determine the maxVal
        let max = 0;
        let lastRange: RollTableRange | undefined;
        for (let range of ranges) {
            if (lastRange === undefined) {
                if (range.min !== 1) {
                    throw new Error('"RollTable" content generator encountered an unexpected error: Lowest roll value needs to start at 1!');
                }
                lastRange = range;
                max = range.max;
                continue;
            }
            const diff = lastRange.max - range.min;
            if (diff !== -1) {
                throw new Error(`'RollTable' content generator encountered an unexpected error: There is ${diff >= 0 ? "an overlap" : "a gap"} in values between "${lastRange.key}" and "${range.key}"!`);
            }
            lastRange = range;
            max = range.max;
        }

        this._ranges = ranges;
        this._maxVal = max;
    }
}

export class RollTableContentGenerator extends BaseRollTableContentGenerator {
    constructor(generatorSource: GeneratorSourceConfig) {
        super(generatorSource);
    }

    public generate(vars: GeneratorVars = {}): string {
        const max = this.maxVal;
        const roll = Math.floor(Math.random() * max) + 1;
        let key: string | undefined;
        for (let range of this.ranges) {
            if (roll >= range.min && roll <= range.max) {
                key = range.key;
                break;
            }
        }
        if (key === undefined) {
            throw new Error('"RollTable" content generator encountered an unexpected error while rolling on the table!');
        }
        return this._source.rollValues![key];
    }
}