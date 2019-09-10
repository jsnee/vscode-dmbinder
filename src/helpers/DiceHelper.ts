const _diceRollRegEx = /\d+d\d+/;

export namespace DiceHelper {
    export function rollDice(dice: string): number {
        const diceMatch = dice.match(/^(\d+)d(\d+)$/);
        if (diceMatch && diceMatch.length === 3) {
            const dieCount = parseInt(diceMatch[1]);
            const dieValue = parseInt(diceMatch[2]);
            if (!isNaN(dieCount) && !isNaN(dieValue)) {
                let value = 0;
                for (let ndx = 0; ndx < dieCount; ndx++) {
                    value += Math.floor(Math.random() * dieValue) + 1;
                }
                return value;
            }
        }
        throw new Error(`Encountered unexpected value while rolling dice: ${dice}`);
    }

    function rollDiceToString(dice: string): string {
        return String(rollDice(dice));
    }

    export function calculateDiceRollExpression(diceRoll: string): number {
        let result = diceRoll;
        while (result.match(_diceRollRegEx)) {
            result = result.replace(_diceRollRegEx, rollDiceToString);
        }
        if (/^\(*\d+(?: [+\-*/] \(*\d+\)*)*$/.test(result)) {
            return eval(result) as number;
        }
        throw new Error(`Encountered invalid dice roll expression: ${diceRoll}`);
    }
}