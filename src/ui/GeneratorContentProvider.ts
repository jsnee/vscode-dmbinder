import { TextDocumentContentProvider, EventEmitter, Uri, Event } from "vscode";

export class GeneratorContentProvider implements TextDocumentContentProvider {
    public readonly onDidChange: Event<Uri>;
    private _onDidChangeEmitter: EventEmitter<Uri>;

    constructor() {
        this._onDidChangeEmitter = new EventEmitter<Uri>();
        this.onDidChange = this._onDidChangeEmitter.event;
    }

    provideTextDocumentContent(uri: Uri): string {
        return "";
    }
}