import { FormatSpec } from "../../utils/FormatSpec";

export interface IGeneratorExpression {
    wholeMatch: string;
    variableName: string | undefined;
    generatorName: string | undefined;
    diceRoll: string | undefined;
    formatSpec: FormatSpec | undefined;
}