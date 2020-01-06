import { TextDocumentContentProvider, EventEmitter, Uri, Event } from "vscode";
import { ComponentHelper } from "../helpers/ComponentHelper";

export class ComponentContentProvider implements TextDocumentContentProvider {
    public readonly onDidChange: Event<Uri>;
    private _onDidChangeEmitter: EventEmitter<Uri>;

    constructor() {
        this._onDidChangeEmitter = new EventEmitter<Uri>();
        this.onDidChange = this._onDidChangeEmitter.event;
    }

    async provideTextDocumentContent(uri: Uri): Promise<string> {
        return await ComponentHelper.generateComponentByName(uri.path);
    }
}