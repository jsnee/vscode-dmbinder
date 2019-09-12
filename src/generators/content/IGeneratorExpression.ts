import { FormatSpec } from "../../utils/FormatSpec";

export interface IGeneratorExpression {
    wholeMatch: string;
    generatorName: string | undefined;
    generatorRepeat: number | undefined;
    repeatSeparator: string | undefined;
    diceRoll: string | undefined;
    formatSpec: FormatSpec | undefined;
    variableName: string | undefined;
}