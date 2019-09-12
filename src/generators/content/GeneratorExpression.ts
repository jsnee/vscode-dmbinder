import { FormatSpec } from "../../utils/FormatSpec";
import { IGeneratorExpression } from "./IGeneratorExpression";

const _expressionRegEx = /{(?!})(?:(\w+)(?:<(\d+)(?:\|([^>]+)?)>)?|#((?:\-?\()*\d+d\d+(?: [+\-*/] (?:\-?\()*(?:\d+d\d+|\-?\d+)\)*)*))?(?:(?<!{)\[((?:[^\n{}]?[<>=^])?[+\- ]?#?0?\d*[_,]?(?:\.\d+)?[bcdeEfFgGnosxX%]?)\])?(?::(\w+))?}/;

enum TemplateMatch {
    Whole = 0,
    GeneratorName = 1,
    GeneratorRepeat = 2,
    RepeatSeparator = 3,
    DiceRoll = 4,
    FormatSpec = 5,
    VariableName = 6
}

export class GeneratorExpression implements IGeneratorExpression {
    private _wholeMatch: string;
    private _generatorName?: string;
    private _generatorRepeat?: number;
    private _repeatSeparator?: string;
    private _variableName?: string;
    private _diceRoll?: string;
    private _formatSpec?: FormatSpec;

    private constructor(matches: RegExpMatchArray) {
        this._wholeMatch = matches[TemplateMatch.Whole];
        this._generatorName = matches[TemplateMatch.GeneratorName];
        let repeat = parseInt(matches[TemplateMatch.GeneratorRepeat]);
        if (!isNaN(repeat)) {
            this._generatorRepeat = repeat;
        }
        this._repeatSeparator = matches[TemplateMatch.RepeatSeparator];
        this._variableName = matches[TemplateMatch.VariableName];
        this._diceRoll = matches[TemplateMatch.DiceRoll];
        this._formatSpec = FormatSpec.getFormatSpec(matches[TemplateMatch.FormatSpec]);
    }

    public static matchNextExpression(text: string): GeneratorExpression | undefined {
        let matches = text.match(_expressionRegEx);
        if (!matches) {
            return;
        }
        return new GeneratorExpression(matches);
    }

    public get variableName(): string | undefined {
        return this._variableName;
    }

    public get generatorName(): string | undefined {
        return this._generatorName;
    }

    public get generatorRepeat(): number | undefined {
        return this._generatorRepeat;
    }

    public get repeatSeparator(): string | undefined {
        return this._repeatSeparator;
    }

    public get wholeMatch(): string {
        return this._wholeMatch;
    }

    public get diceRoll(): string | undefined {
        return this._diceRoll;
    }

    public get formatSpec(): FormatSpec | undefined {
        return this._formatSpec;
    }

    public replace(text: string, value: string): string {
        return text.replace(_expressionRegEx, value);
    }
}