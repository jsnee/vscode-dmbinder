import { window } from "vscode";

export namespace WindowHelper {
    export function showErrorMessage(err: any): Thenable<string | undefined> {
        let msg: string = "DMBinder has encountered an unexpected error.";
        if (typeof(err) === "string") {
            msg = err;
        } else if (err instanceof Error) {
            msg = (err as Error).message;
        }
        return window.showErrorMessage(msg);
    }
}