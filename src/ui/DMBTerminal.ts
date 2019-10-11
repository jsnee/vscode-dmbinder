import { EventEmitter, Pseudoterminal, window, Terminal } from "vscode";
import { ExtensionHelper } from "../helpers/ExtensionHelper";

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

export class DMBTerminal {
    private readonly _writeEmitter: EventEmitter<string>;
    private readonly _terminal: Terminal;
    private _line: string = "";

    public constructor(show: boolean = true) {
        const extensionVersion = ExtensionHelper.getExtensionVersion();
        this._writeEmitter = new EventEmitter<string>();
        const pty: Pseudoterminal = {
            onDidWrite: this._writeEmitter.event,
            open: () => {
                this.writeToTerminal([
                    TerminalCtrlSeq.getControlSequence(TerminalCtrlChar.Bold),
                    "VSCode DMBinder version ",
                    extensionVersion
                ].join(""));
                this.writePrompt();
            },
            close: () => { },
            handleInput: (data: string) => {
                if (data === '\r') { // Enter
                    const input = this._line;
                    this._line = '';
                    if (input === "exit") {
                        this._terminal.dispose();
                        return;
                    }
                    if (input !== "") {
                        this.writeToTerminal("\r\n");
                    }
                    this.run(input);
                    this.writePrompt();
                    return;
                }
                if (data === '\x7f') { // Backspace
                    if (this._line.length === 0) {
                        return;
                    }
                    this._line = this._line.substr(0, this._line.length - 1);
                    // Move cursor backward
                    this.writeToTerminal('\x1b[D');
                    // Delete character
                    this.writeToTerminal('\x1b[P');
                    return;
                }
                this._line += data;
                this.writeToTerminal(data);
            }
        };
        this._terminal = window.createTerminal({ name: 'DMBinder', pty });
        if (show) {
            this._terminal.show();
        }
    }

    public run(input: string, echoInput: boolean = false): void {
    }

    public show(preserveFocus?: boolean): void {
        this._terminal.show(preserveFocus);
    }

    public hide(): void {
        this._terminal.hide();
    }

    public writeToTerminal(text: string): void {
        this._writeEmitter.fire(text);
    }

    private writePrompt(): void {
        this.writeToTerminal([
            TerminalCtrlSeq.getControlSequence(TerminalCtrlChar.ResetAll),
            "\r\nDMBinder> "
        ].join(""));
    }
}