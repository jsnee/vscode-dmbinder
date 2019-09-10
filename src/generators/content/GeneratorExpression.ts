const _expressionRegEx = /\{(?::(\w+)|(?:(\w+)(?::(\w+))?)|#(\(*\d+d\d+(?: [+\-*/] \(*(?:\d+d\d+|\d+)\)*)*)(?::(\w+))?)\}/;

enum TemplateMatch {
    Whole = 0,
    GetVariableName = 1,
    GeneratorName = 2,
    SetVariableName = 3,
    DiceRoll = 4,
    DiceRollVariableName = 5
}

export class GeneratorExpression {
    private _wholeMatch: string;
    private _generatorName?: string;
    private _variableName?: string;
    private _diceRoll?: string;

    private constructor(matches: RegExpMatchArray) {
        this._wholeMatch = matches[TemplateMatch.Whole];
        this._generatorName = matches[TemplateMatch.GeneratorName];
        this._variableName = matches[TemplateMatch.SetVariableName]
            || matches[TemplateMatch.GetVariableName]
            || matches[TemplateMatch.DiceRollVariableName];
        this._diceRoll = matches[TemplateMatch.DiceRoll];
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

    public get wholeMatch(): string {
        return this._wholeMatch;
    }

    public get diceRoll(): string | undefined {
        return this._diceRoll;
    }

    public replace(text: string, value: string): string {
        return text.replace(_expressionRegEx, value);
    }
}