import * as assert from 'assert';
import { GeneratorExpression } from '../../generators/content/GeneratorExpression';
import { IGeneratorExpression } from '../../generators/content/IGeneratorExpression';

function testGenExpr(input: string, assertion?: IGeneratorExpression) {
    const output = GeneratorExpression.matchNextExpression(input);
    if (assertion === undefined) {
        assert.equal(undefined, output);
    } else {
        assert.notEqual(undefined, output);
        assert.equal(assertion.wholeMatch, output!.wholeMatch);
        assert.equal(assertion.generatorName, output!.generatorName);
        assert.equal(assertion.diceRoll, output!.diceRoll);
        assert.equal(assertion.variableName, output!.variableName);
    }
}

suite("Content Generator Tests", function () {
    // Testing Regex for Generator Expressions
    test("Basic GeneratorExpression Lexing", function () {
        // Valid Situations
        testGenExpr("lorem { jal  salfkjw} ipsum{coolNameGenerator}sfdawsd", {
            wholeMatch: "{coolNameGenerator}",
            generatorName: "coolNameGenerator",
            diceRoll: undefined,
            variableName: undefined,
            formatSpec: undefined
        });
        testGenExpr("lorem{coolNameGenerator:coolName}ipsum", {
            wholeMatch: "{coolNameGenerator:coolName}",
            generatorName: "coolNameGenerator",
            diceRoll: undefined,
            variableName: "coolName",
            formatSpec: undefined
        });
        testGenExpr("lorem{:coolVar}ipsum", {
            wholeMatch: "{:coolVar}",
            generatorName: undefined,
            diceRoll: undefined,
            variableName: "coolVar",
            formatSpec: undefined
        });
        // Invalid Situations
        testGenExpr("{ abc}");
        testGenExpr("{abc }");
        testGenExpr("{ab c}");
        testGenExpr("{#abc}");
        testGenExpr("{[abc]}");
        testGenExpr("{abc:}");
        testGenExpr("{abc#2d4}");
        testGenExpr("{}");
        testGenExpr("{ }");
    });

    test("Dice Roll GeneratorExpression Lexing", function () {
        // Valid Situations
        testGenExpr("awefweaf{#2d4}fwefwefw", {
            wholeMatch: "{#2d4}",
            generatorName: undefined,
            diceRoll: "2d4",
            variableName: undefined,
            formatSpec: undefined
        });
        testGenExpr("awefweaf{#2d4:coolNumber}fwefwefw", {
            wholeMatch: "{#2d4:coolNumber}",
            generatorName: undefined,
            diceRoll: "2d4",
            variableName: "coolNumber",
            formatSpec: undefined
        });
        testGenExpr("dasffweaf{#(2d4 * 3) + (12 * (3d8 + 9 - 1d4))}sfewfae", {
            wholeMatch: "{#(2d4 * 3) + (12 * (3d8 + 9 - 1d4))}",
            generatorName: undefined,
            diceRoll: "(2d4 * 3) + (12 * (3d8 + 9 - 1d4))",
            variableName: undefined,
            formatSpec: undefined
        });
        testGenExpr("{#-(2d4 * 3) + -(-(12 * (3d8 + 9 - 1d4)) * 3)}", {
            wholeMatch: "{#-(2d4 * 3) + -(-(12 * (3d8 + 9 - 1d4)) * 3)}",
            generatorName: undefined,
            diceRoll: "-(2d4 * 3) + -(-(12 * (3d8 + 9 - 1d4)) * 3)",
            variableName: undefined,
            formatSpec: undefined
        });
        // Invalid Situations
        testGenExpr("{abc#2d4}");
        testGenExpr("{ #2d4}");
        testGenExpr("{# 2d4}");
        testGenExpr("{#2d4 }");
        testGenExpr("{#2d4 % 1}");
        testGenExpr("{#1 + 2d4}");
        testGenExpr("{#(1 + 2d4)}");
        testGenExpr("{#2d4  +  1}");
        testGenExpr("{#2d4+1}");
    });
});