import { GeneratorExpression } from "../../../generators/content/GeneratorExpression";
import { DiceHelper } from "../../../helpers/DiceHelper";

export interface DiceRollTestResult {
    output: string;
    hasValidFormat: boolean;
}

export namespace DiceRollTestHelper {
    export function testRoll(input: string, isValidFormat: boolean = true): DiceRollTestResult | undefined {
        const output = GeneratorExpression.matchNextExpression(input);
        if (output && output.diceRoll) {
            let roll = DiceHelper.calculateDiceRollExpression(output.diceRoll);
            return {
                output: output.formatSpec ? output.formatSpec.format(roll) : String(roll),
                hasValidFormat: output.formatSpec !== undefined
            };
        }
        return;
    }
}