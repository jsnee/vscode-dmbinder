import { EventEmitter, Pseudoterminal, window, Terminal } from "vscode";
import { ExtensionHelper } from "../helpers/ExtensionHelper";
import { DiceHelper } from "../helpers/DiceHelper";

var Parser = require("simple-argparse").Parser;

export namespace TerminalCtrlSeq {
    const esc = "\x1b";

    export function getControlSequence(...codes: TerminalCtrlChar[]): string {
        return `${esc}[${codes.join(";")}m`;
    }
}

export enum TerminalCtrlChar {
    // Set Formatting
    Bold = "1",
    Dim = "2",
    Underline = "4",
    Invert = "7",
    Hidden = "8",

    // Reset Formatting
    ResetAll = "0",
    ResetBold = "21",
    ResetDim = "22",
    ResetUnderline = "24",
    ResetInvert = "27",
    ResetHidden = "28",

    // Background Colors
    BackgroundDefault = "49",
    BackgroundBlack = "40",
    BackgroundRed = "41",
    BackgroundGreen = "42",
    BackgroundYellow = "43",
    BackgroundBlue = "44",
    BackgroundMagenta = "45",
    BackgroundCyan = "46",
    BackgroundLightGray = "47",
    BackgroundDarkGray = "100",
    BackgroundLightRed = "101",
    BackgroundLightGreen = "102",
    BackgroundLightYellow = "103",
    BackgroundLightBlue = "104",
    BackgroundLightMagenta = "105",
    BackgroundLightCyan = "106",
    BackgroundWhite = "107",

    // Foreground Colors
    TextDefault = "39",
    TextBlack = "30",
    TextRed = "31",
    TextGreen = "32",
    TextYellow = "33",
    TextBlue = "34",
    TextMagenta = "35",
    TextCyan = "36",
    TextLightGray = "37",
    TextDarkGray = "90",
    TextLightRed = "91",
    TextLightGreen = "92",
    TextLightYellow = "93",
    TextLightBlue = "94",
    TextLightMagenta = "95",
    TextLightCyan = "96",
    TextWhite = "97"
}

const MaxHistoryCount = 20;

export class DMBTerminal {
    private readonly _writeEmitter: EventEmitter<string>;
    private readonly _terminal: Terminal;
    private readonly _parser: any;
    private _line: string = "";
    private _history: string[];
    private _historyLocation?: number;
    private _lineLocation: number = 0;

    public constructor(show: boolean = true) {
        const extensionVersion = ExtensionHelper.getExtensionVersion();
        this._history = [];
        const _this = this;
        let parser = new Parser(function (output: string) {
            output = output.replace(/[^\r]\n/g, "\r\n");
            _this.processOutput(output);
        });
        parser.description("DMBinder", "DMBinder Visual Studio Code extension.");
        parser.version(extensionVersion);
        parser.option("roll", "Roll some dice.", function () {
            let args: string[] = Array.prototype.slice.call(arguments);
            _this.rollDice(args.join(" "));
        });
        parser.option("exit", "Exit the terminal.", function () {});
        this._parser = parser;

        this._writeEmitter = new EventEmitter<string>();
        const pty: Pseudoterminal = {
            onDidWrite: this._writeEmitter.event,
            open: () => {
                this.writeToTerminal([
                    TerminalCtrlSeq.getControlSequence(TerminalCtrlChar.Bold),
                    "VSCode DMBinder version ",
                    extensionVersion
                ]);
                this.writePrompt();
            },
            close: () => { },
            handleInput: (data: string) => {
                _this.handleInput(data);
            }
        };
        this._terminal = window.createTerminal({ name: 'DMBinder', pty });
        if (show) {
            this._terminal.show();
        }
    }

    public run(input: string, echoInput: boolean = false): void {
        this._parser.parse(input);
    }

    public show(preserveFocus?: boolean): void {
        this._terminal.show(preserveFocus);
    }

    public hide(): void {
        this._terminal.hide();
    }

    public writeToTerminal(text: string | string[]): void {
        if (text instanceof Array) {
            this._writeEmitter.fire(text.join(""));
        } else {
            this._writeEmitter.fire(text);
        }
    }

    private rollDice(input: string): void {
        console.log(`Dice roll: ${input}`);
        try {
            let result = DiceHelper.calculateDiceRollExpression(`${input}`);
            this.writeToTerminal(`${result}`);
        } catch (ex)
        {
            this.writeToTerminal(TerminalCtrlSeq.getControlSequence(TerminalCtrlChar.TextRed));
            this.processOutput(ex);
        }
    }

    private processOutput(output: string): void {
        this.writeToTerminal([
            TerminalCtrlSeq.getControlSequence(TerminalCtrlChar.Bold),
            output,
            TerminalCtrlSeq.getControlSequence(TerminalCtrlChar.ResetAll)
        ]);
    }

    private writePrompt(): void {
        this.writeToTerminal([
            TerminalCtrlSeq.getControlSequence(TerminalCtrlChar.ResetAll),
            "\r\nDMBinder> "
        ]);
        this._lineLocation = 0;
    }

    private setLine(value: string): void {
        console.log(`Setting Line: "${value}"`);
        while (this._lineLocation > 0) {
            this.writeToTerminal("\x1b[D");
            this._lineLocation--;
        }
        while (this._line.length > 0) {
            this.deleteAtCursor(false);
        }
        this._line = value;
        this.writeToTerminal(value);
        this._lineLocation = this._line.length;
    }

    public handleInput(data: string): void {
        if (data.charAt(0) === "\\") {
            console.log(`Special Char: ${data}`);
        }
        switch (data) {
            case "\r": // Enter key
                const input = this._line;
                this._line = "";
                if (input === "exit") {
                    this._terminal.dispose();
                    return;
                }
                this._historyLocation = undefined;
                if (input !== "") {
                    this.writeToTerminal("\r\n");
                    this._history.unshift(input);
                    this._history = this._history.slice(0, MaxHistoryCount - 1);
                }
                this.run(input);
                this.writePrompt();
                return;
            case "\x7f": // Backspace key
                if (this._line.length > 0 && this._lineLocation > 0) {
                    this.deleteAtCursor(true);
                }
                return;
            case "\x1b[3~": // Delete key
                if (this._lineLocation !== this._line.length) {
                    this.deleteAtCursor(false);
                }
                return;
            case "\x1b[D": // Left arrow
                if (this._lineLocation > 0 && this._lineLocation <= this._line.length) {
                    this._lineLocation--;
                    break;
                }
                return;
            case "\x1b[C": // Right arrow
                if (this._lineLocation >= 0 && this._lineLocation < this._line.length) {
                    this._lineLocation++;
                    break;
                }
                return;
            case "\x1b[A": // Up arrow
                if (this._history.length) {
                    if (this._historyLocation === undefined) {
                        this._historyLocation = 0;
                        this.setLine(this._history[this._historyLocation]);
                    } else if (this._historyLocation < (this._history.length - 1)) {
                        this._historyLocation++;
                        this.setLine(this._history[this._historyLocation]);
                    }
                }
                return;
            case "\x1b[B": // Down arrow
                if (this._history.length) {
                    if (this._historyLocation !== undefined && this._historyLocation < this._history.length) {
                        if (this._historyLocation <= 0) {
                            this._historyLocation = undefined;
                            this.setLine("");
                        } else {
                            this._historyLocation--;
                            this.setLine(this._history[this._historyLocation]);
                        }
                    }
                }
                return;
            default:
                this.insertIntoLine(data);
                this._lineLocation++;
                console.log(JSON.stringify({ data: data, line: this._line, cursorPos: this._lineLocation }));
                break;
        }
        this.writeToTerminal(data);
    }

    private insertIntoLine(value: string): void {
        let result = "";
        if (this._line.length === this._lineLocation) {
            this._line += value;
            return;
        }
        for (let ndx = 0; ndx < this._line.length; ndx++) {
            if (ndx === this._lineLocation) {
                result += value;
            } else {
                result += this._line[ndx];
            }
        }
        this._line = result;
    }

    private deleteAtCursor(isBackspace: boolean): void {
        //this._line = this._line.substr(0, this._line.length - 1);
        let commands = [
            // Delete character
            "\x1b[P"
        ];
        if (isBackspace) {
            this._lineLocation--;
            commands.unshift("\x1b[D"); // Move cursor backward
        }
        this.writeToTerminal(commands);
        let result = "";
        for (let ndx = 0; ndx < this._line.length; ndx++) {
            if (ndx !== this._lineLocation) {
                result += this._line[ndx];
            }
        }
        this._line = result;
    }
}