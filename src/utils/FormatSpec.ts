const _formatSpecRegEx = /^(?:([^\n{}])?([<>=^]))?([+\- ])?(#)?(0)?(\d+)?([_,])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/;

enum FormatSpecMatch {
    Whole = 0,
    Fill = 1,
    Align = 2,
    Sign = 3,
    AlternateForm = 4,
    SignAwareZeroPadding = 5,
    Width = 6,
    Grouping = 7,
    Precision = 8,
    PresentationType = 9
}

function parseAlignment(val?: string): FormatSpecAlignment | undefined {
    switch (val) {
        case "<":
            return FormatSpecAlignment.Left;
        case ">":
            return FormatSpecAlignment.Right;
        case "=":
            return FormatSpecAlignment.PadAfterSign;
        case "^":
            return FormatSpecAlignment.Centered;
        default:
            return;
    }
}

function parseSign(val?: string): FormatSpecSign | undefined {
    switch (val) {
        case "+":
            return FormatSpecSign.Always;
        case "-":
            return FormatSpecSign.Negative;
        case " ":
            return FormatSpecSign.Space;
        default:
            return;
    }
}

function parseGrouping(val?: string): FormatSpecGrouping | undefined {
    switch (val) {
        case "_":
            return FormatSpecGrouping.Underscore;
        case ",":
            return FormatSpecGrouping.Comma;
        default:
            return;
    }
}

function parsePresentationType(val?: string): FormatSpecPresentationType | undefined {
    switch (val) {
        case "s":
            return FormatSpecPresentationType.String;
        case "b":
            return FormatSpecPresentationType.Binary;
        case "c":
            return FormatSpecPresentationType.Character;
        case "d":
            return FormatSpecPresentationType.Decimal;
        case "o":
            return FormatSpecPresentationType.Octal;
        case "x":
            return FormatSpecPresentationType.Hexadecimal;
        case "X":
            return FormatSpecPresentationType.UpperHex;
        case "n":
            return FormatSpecPresentationType.LocaleNumber;
        case "e":
            return FormatSpecPresentationType.ScientificNotation;
        case "E":
            return FormatSpecPresentationType.UpperScientificNotation;
        case "f":
            return FormatSpecPresentationType.FixedPoint;
        case "F":
            return FormatSpecPresentationType.UpperFixedPoint;
        case "g":
            return FormatSpecPresentationType.GeneralNumber;
        case "G":
            return FormatSpecPresentationType.UpperGeneralNumber;
        case "%":
            return FormatSpecPresentationType.Percentage;
        default:
            return;
    }
}

export enum FormatSpecAlignment {
    Left,
    Right,
    PadAfterSign,
    Centered
}

export enum FormatSpecSign {
    Always,
    Negative,
    Space
}

export enum FormatSpecGrouping {
    Underscore,
    Comma
}

export enum FormatSpecPresentationType {
    String,
    Binary,
    Character,
    Decimal,
    Octal,
    Hexadecimal,
    UpperHex,
    LocaleNumber,
    ScientificNotation,
    UpperScientificNotation,
    FixedPoint,
    UpperFixedPoint,
    GeneralNumber,
    UpperGeneralNumber,
    Percentage
}

function parseIntOrUndefined(val?: string) {
    return val === undefined ? val : parseInt(val);
}

export class FormatSpec {
    private _whole: string;
    private _fill?: string;
    private _alignment?: FormatSpecAlignment;
    private _sign?: FormatSpecSign;
    private _alternateForm: boolean;
    private _width?: number;
    private _grouping?: FormatSpecGrouping;
    private _precision?: number;
    private _presentationType?: FormatSpecPresentationType;

    private constructor(spec: RegExpMatchArray) {
        this._whole = spec[FormatSpecMatch.Whole];
        this._fill = spec[FormatSpecMatch.Fill];
        this._alignment = parseAlignment(spec[FormatSpecMatch.Align]);
        this._sign = parseSign(spec[FormatSpecMatch.Sign]);
        this._alternateForm = spec[FormatSpecMatch.AlternateForm] === "#";
        this._width = parseInt(spec[FormatSpecMatch.Width]);
        this._grouping = parseGrouping(spec[FormatSpecMatch.Grouping]);
        this._precision = parseIntOrUndefined(spec[FormatSpecMatch.Precision]);
        this._presentationType = parsePresentationType(spec[FormatSpecMatch.PresentationType]);
        if (this._alignment === undefined
            && this._fill === undefined
            && spec[FormatSpecMatch.SignAwareZeroPadding] === "0") {
            this._alignment = FormatSpecAlignment.PadAfterSign;
            this._fill = "0";
        }
    }

    public static getFormatSpec(spec?: string): FormatSpec | undefined {
        if (spec !== undefined && spec !== "") {
            const matches = spec.match(_formatSpecRegEx);
            if (matches) {
                return new FormatSpec(matches);
            }
        }
        return;
    }

    public get wholeMatch(): string {
        return this._whole;
    }

    public format(input: number | string): string {
        if (typeof (input) === "number") {
            let alignment = this._alignment === undefined ? FormatSpecAlignment.Right : this._alignment;
            let sign = getSign(input, this._sign);
            let result: string;
            let precision = this._precision;
            if (precision === undefined) {
                precision = 6;
            }
            switch (this._presentationType) {
                case FormatSpecPresentationType.Binary:
                    result = input.toString(2);
                    if (this._alternateForm) {
                        result = "0b" + result;
                    }
                    break;
                case FormatSpecPresentationType.Character:
                    result = String.fromCharCode(input);
                    break;
                case FormatSpecPresentationType.Octal:
                    result = input.toString(8);
                    if (this._alternateForm) {
                        result = "0o" + result;
                    }
                    break;
                case FormatSpecPresentationType.Hexadecimal:
                case FormatSpecPresentationType.UpperHex:
                    result = input.toString(16);
                    if (this._alternateForm) {
                        result = "0x" + result;
                    }
                    break;
                case FormatSpecPresentationType.ScientificNotation:
                case FormatSpecPresentationType.UpperScientificNotation:
                    result = input.toExponential(precision);
                    break;
                case FormatSpecPresentationType.FixedPoint:
                case FormatSpecPresentationType.UpperFixedPoint:
                    result = input.toFixed(precision);
                    break;
                case FormatSpecPresentationType.GeneralNumber:
                case FormatSpecPresentationType.UpperGeneralNumber:
                    if (input === 0
                        || isNaN(input)
                        || input === Number.NEGATIVE_INFINITY
                        || input === Number.POSITIVE_INFINITY) {
                        result = String(input);
                    } else {
                        if (precision < 1) {
                            precision = 1;
                        }
                        let exp = parseInt(input.toExponential(precision - 1).split("e")[1]);
                        if (exp < precision && exp >= -4) {
                            result = String(Number(input.toFixed(precision - 1 - exp)));
                        } else {
                            result = Number(input.toPrecision(precision - 1)).toExponential();
                        }
                    }
                    break;
                case FormatSpecPresentationType.Percentage:
                    result = (input * 100).toFixed(precision) + "%";
                    break;
                case FormatSpecPresentationType.LocaleNumber:
                    result = input.toLocaleString(undefined, { maximumSignificantDigits: precision });
                    break;
                case FormatSpecPresentationType.Decimal:
                default:
                    result = String(input);
                    break;
            }
            let width = this._width;
            if (width !== undefined) {
                width -= sign.length;
            }
            if (result.charAt(0) === sign) {
                result = result.substr(1);
            }
            if (this._grouping !== undefined) {
                let grouping: string;
                switch (this._grouping) {
                    case FormatSpecGrouping.Comma:
                        grouping = ",";
                        break;
                    case FormatSpecGrouping.Underscore:
                        grouping = "_";
                        break;
                    default:
                        grouping = "";
                        break;
                }
                result = addSeparators(result, grouping);
            }
            // Uppercase
            switch (this._presentationType) {
                case FormatSpecPresentationType.UpperFixedPoint:
                case FormatSpecPresentationType.UpperGeneralNumber:
                case FormatSpecPresentationType.UpperHex:
                case FormatSpecPresentationType.UpperScientificNotation:
                    result = result.toUpperCase();
                    break;
                default:
                    break;
            }
            if (width !== undefined && alignment !== FormatSpecAlignment.PadAfterSign) {
                result = sign + result;
                width += sign.length;
                sign = "";
            }
            result = pad(result, alignment, width, this._fill);
            return sign + result;
        } else {
            let alignment = this._alignment === undefined ? FormatSpecAlignment.Left : this._alignment;
            return pad(input, alignment, this._width, this._fill);
        }
    }
}

function addSeparators(val: string, separator: string): string {
    let x = val.split('.');
    let x1 = x[0];
    let x2 = x.length > 1 ? '.' + x[1] : '';
    let rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + separator + '$2');
    }
    return x1 + x2;
}

function getSign(val: number, signConfig?: FormatSpecSign): string {
    if (val > 0) {
        switch (signConfig) {
            case FormatSpecSign.Always:
                return "+";
            case FormatSpecSign.Space:
                return " ";
            case FormatSpecSign.Negative:
            default:
                return "";
        }
    }
    if (val < 0) {
        return "-";
    }
    return "";
}

function pad(input: string, alignment: FormatSpecAlignment, width?: number, fill?: string): string {
    if (width !== undefined) {
        let addLeft = alignment === FormatSpecAlignment.PadAfterSign || alignment === FormatSpecAlignment.Right;
        fill = fill || " ";
        while (input.length < width) {
            if (addLeft) {
                input = fill + input;
            } else {
                input = input + fill;
            }
            if (alignment && alignment === FormatSpecAlignment.Centered) {
                addLeft = !addLeft;
            }
        }
    }
    return input;
}