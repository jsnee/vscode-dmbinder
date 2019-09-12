import * as assert from 'assert';
import { GeneratorExpression } from '../../generators/content/GeneratorExpression';
import { IGeneratorExpression } from '../../generators/content/IGeneratorExpression';

function testGenExpr(input: string, assertion?: IGeneratorExpression) {
    const output = GeneratorExpression.matchNextExpression(input);
    if (assertion === undefined) {
        assert.equal(output, undefined);
    } else {
        assert.notEqual(undefined, output);
        assert.equal(output!.wholeMatch, assertion.wholeMatch);
        assert.equal(output!.generatorName, assertion.generatorName);
        assert.equal(output!.generatorRepeat, assertion.generatorRepeat);
        assert.equal(output!.repeatSeparator, assertion.repeatSeparator);
        assert.equal(output!.diceRoll, assertion.diceRoll);
        assert.equal(output!.variableName, assertion.variableName);
    }
}

suite("Content Generator Tests", function () {
    // Testing Regex for Generator Expressions
    test("Basic Generator Expression Lexing", function () {
        // Valid Situations
        testGenExpr("lorem { jal  salfkjw} ipsum{coolNameGenerator}sfdawsd", {
            wholeMatch: "{coolNameGenerator}",
            generatorName: "coolNameGenerator",
            diceRoll: undefined,
            variableName: undefined,
            formatSpec: undefined,
            generatorRepeat: undefined,
            repeatSeparator: undefined
        });
        testGenExpr("lorem{coolNameGenerator:coolName}ipsum", {
            wholeMatch: "{coolNameGenerator:coolName}",
            generatorName: "coolNameGenerator",
            diceRoll: undefined,
            variableName: "coolName",
            formatSpec: undefined,
            generatorRepeat: undefined,
            repeatSeparator: undefined
        });
        testGenExpr("lorem{:coolVar}ipsum", {
            wholeMatch: "{:coolVar}",
            generatorName: undefined,
            diceRoll: undefined,
            variableName: "coolVar",
            formatSpec: undefined,
            generatorRepeat: undefined,
            repeatSeparator: undefined
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

    test("Repeat Generator Expression Lexing", function () {
        testGenExpr("lorem{abc<5|, >}ipsum", {
            wholeMatch: "{abc<5|, >}",
            generatorName: "abc",
            diceRoll: undefined,
            variableName: undefined,
            formatSpec: undefined,
            generatorRepeat: 5,
            repeatSeparator: ", "
        });
    });

    test("Dice Roll Generator Expression Lexing", function () {
        // Valid Situations
        testGenExpr("awefweaf{#2d4}fwefwefw", {
            wholeMatch: "{#2d4}",
            generatorName: undefined,
            diceRoll: "2d4",
            variableName: undefined,
            formatSpec: undefined,
            generatorRepeat: undefined,
            repeatSeparator: undefined
        });
        testGenExpr("awefweaf{#2d4:coolNumber}fwefwefw", {
            wholeMatch: "{#2d4:coolNumber}",
            generatorName: undefined,
            diceRoll: "2d4",
            variableName: "coolNumber",
            formatSpec: undefined,
            generatorRepeat: undefined,
            repeatSeparator: undefined
        });
        testGenExpr("dasffweaf{#(2d4 * 3) + (12 * (3d8 + 9 - 1d4))}sfewfae", {
            wholeMatch: "{#(2d4 * 3) + (12 * (3d8 + 9 - 1d4))}",
            generatorName: undefined,
            diceRoll: "(2d4 * 3) + (12 * (3d8 + 9 - 1d4))",
            variableName: undefined,
            formatSpec: undefined,
            generatorRepeat: undefined,
            repeatSeparator: undefined
        });
        testGenExpr("{#-(2d4 * 3) + -(-(12 * (3d8 + 9 - 1d4)) * 3)}", {
            wholeMatch: "{#-(2d4 * 3) + -(-(12 * (3d8 + 9 - 1d4)) * 3)}",
            generatorName: undefined,
            diceRoll: "-(2d4 * 3) + -(-(12 * (3d8 + 9 - 1d4)) * 3)",
            variableName: undefined,
            formatSpec: undefined,
            generatorRepeat: undefined,
            repeatSeparator: undefined
        });
        testGenExpr("lorem{#1d1 * 1010 + -(1d1 / 2)[+010_.2f]:coolVar}ipsum", {
            wholeMatch: "{#1d1 * 1010 + -(1d1 / 2)[+010_.2f]:coolVar}",
            generatorName: undefined,
            diceRoll: "1d1 * 1010 + -(1d1 / 2)",
            variableName: "coolVar",
            formatSpec: undefined,
            generatorRepeat: undefined,
            repeatSeparator: undefined
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