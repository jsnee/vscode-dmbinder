import * as assert from 'assert';
import { DiceRollTestHelper } from './DiceRollTestHelper';

function testRollExpr(input: string, expected?: string, expectValidFormat: boolean = true) {
    let result = DiceRollTestHelper.testRoll(input);
    assert.notEqual(result, undefined);
    assert.equal(result!.hasValidFormat, expectValidFormat);
    assert.equal(result!.output, expected);
}

suite("Dice Roll Generator FormatSpec Tests", function () {
    test("Dice Roll Generator Fill and Alignment Formatting", function () {
        testRollExpr("{#-(1d1 * 3) + -(-(12 * (1d1 + 9 - 1d1)) * 3)}", "321", false); // No Formatting
        testRollExpr("{#1d1 * 3[<4]}", "3   "); // Default "fill" is space
        testRollExpr("{#1d1 * 3[4]}", "   3"); // Default "align" is right
        testRollExpr("{#1d1 * 3[*^4]}", "*3**");
        testRollExpr("{#1d1 * 3[*<5]}", "3****");
        testRollExpr("{#1d1 * 3[*>5]}", "****3");
        testRollExpr("{#1d1 * -3[*=5]}", "-***3");
        testRollExpr("{#1d1 * -333[*=2]}", "-333"); // Number Longer than Width
        testRollExpr("{#1d1 * -3[*=]}", "-3"); // No Width Specified
        testRollExpr("{#1d1 * -3[05]}", "-0003"); // Sign-Aware Zero-Padding

        // Invalid Situations
        assert.equal(DiceRollTestHelper.testRoll("{#1d1[*]}", false), undefined);
    });

    test("Dice Roll Generator Sign Formatting", function () {
        testRollExpr("{#1d1 * 3[+]}", "+3");
        testRollExpr("{#1d1 * -3[+]}", "-3");
        testRollExpr("{#1d1 * 3[-]}", "3");
        testRollExpr("{#1d1 * -3[-]}", "-3");
        testRollExpr("{#1d1 * 3[ ]}", " 3");
        testRollExpr("{#1d1 * -3[ ]}", "-3");
    });

    test("Dice Roll Generator Alternate Form Formatting", function () {
        testRollExpr("{#1d1 * 4[#b]}", "0b100");
        testRollExpr("{#1d1 * 9[#o]}", "0o11");
        testRollExpr("{#1d1 * 31[#x]}", "0x1f");
        testRollExpr("{#1d1 * 31[#X]}", "0X1F"); // Uppercase Hexadecimal
    });

    test("Dice Roll Generator Grouping Formatting", function () {
        testRollExpr("{#1d1 * 1000[_]}", "1_000");
        testRollExpr("{#1d1 * 1000[,]}", "1,000");
    });

    test("Dice Roll Generator Precision Formatting", function () {
        testRollExpr("{#1d1[.5]}", "1");            // Integer
        testRollExpr("{#1d1[.5e]}", "1.00000e+0");  // Scientific Notation
        testRollExpr("{#1d1[.5f]}", "1.00000");     // Fixed-Point
        testRollExpr("{#1d1[.5g]}", "1");           // General Number
        testRollExpr("{#1d1 / 2[.1%]}", "50.0%");    // Percent
        testRollExpr("{#1d1 * 1000[.5n]}", Number(1000).toLocaleString(undefined, { maximumSignificantDigits: 5 })); // Localized
    });

    test("Dice Roll Generator Presentation Type Formatting", function () {
        // Integers
        testRollExpr("{#1d1 * 4[b]}", "100");       // Binary
        testRollExpr("{#1d1 * 33[c]}", "!");        // Unicode Character
        testRollExpr("{#1d1 * 33[d]}", "33");       // Decimal
        testRollExpr("{#1d1 * 9[o]}", "11");        // Octal
        testRollExpr("{#1d1 * 31[x]}", "1f");       // Hexadecimal
        testRollExpr("{#1d1 * 31[X]}", "1F");       // Uppercase Hexadecimal

        // Non-Integers
        testRollExpr("{#1d1[e]}", "1.000000e+0");   // Scientific Notation
        testRollExpr("{#1d1[f]}", "1.000000");      // Fixed-Point
        testRollExpr("{#1d1 / 2[%]}", "50.000000%"); // Percent

        // Localized
        testRollExpr("{#1d1 * 3100[n]}", Number(3100).toLocaleString());
        testRollExpr("{#1d1 * 3100 + (1d1 / 2)[n]}", Number(3100.5).toLocaleString());

        // General Number
        testRollExpr("{#1d1 * 3[g]}", "3");
        testRollExpr("{#(1d1 * 3) / 2[g]}", "1.5");
        testRollExpr("{#1d1 / 16000000[g]}", "6.25e-8");
        testRollExpr("{#1d1 * 16000000[g]}", "1.6e+7");

        // Infinities
        testRollExpr("{#1d1 / 0}", "Infinity", false);
        testRollExpr("{#1d1 / 0[+]}", "+Infinity");
        testRollExpr("{#1d1 / 0[ ]}", " Infinity");
        testRollExpr("{#-(1d1 / 0)[-]}", "-Infinity");

        // Uppercase
        testRollExpr("{#1d1[E]}", "1.000000E+0");
        testRollExpr("{#1d1 / 0[F]}", "INFINITY");
        testRollExpr("{#1d1 / 0[+F]}", "+INFINITY");
        testRollExpr("{#1d1 / 0[ F]}", " INFINITY");
        testRollExpr("{#-(1d1 / 0)[F]}", "-INFINITY");
        testRollExpr("{#1d1 * 16000000[G]}", "1.6E+7");
    });

    test("Dice Roll Generator Complete Formatting", function () {
        testRollExpr("{#1d1 * 1010 + -(1d1 / 2)[+010_.2f]}", "+01_009.50");
        testRollExpr("{#1d1 / 0[v^ 12F]}", "v INFINITYvv");
        testRollExpr("{#1d1 / 0[v= 12F]}", " vvvINFINITY");
        testRollExpr("{#1d1 / 0[v> 12F]}", "vvv INFINITY");
        testRollExpr("{#1d1 / 0[v< 12F]}", " INFINITYvvv");
    });
});