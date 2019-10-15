import { window, TextDocument } from "vscode";

export namespace EditorHelper {
    export async function insertIntoCurrent(text: string): Promise<void> {
        let editor = window.activeTextEditor;
        let res = text;
        if (editor) {
            let selection = editor.selection;
            await editor.edit((editBuilder) => {
                editBuilder.replace(selection, res);
            });
        }
    }

    export function getCurrentDocument(): TextDocument | undefined {
        let editor = window.activeTextEditor;
        if (editor) {
            return editor.document;
        }
        return;
    }
}