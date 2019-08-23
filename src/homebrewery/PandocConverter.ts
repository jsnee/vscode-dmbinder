import { spawn } from "child_process";
import { Stream } from "stream";

export enum PandocFormat {
    Html = "html",
    Markdown = "markdown"
}

const command = 'pandoc';

export class PandocConverter {
    private _opts: string[];

    constructor(fromFormat: PandocFormat, toFormat: PandocFormat, ...args: string[]) {
        this._opts = ['-f', fromFormat.toString(), '-t', toFormat.toString()].concat(args);
    }

    public async convert(src: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, this._opts);
            proc.on('error', reject);
            let data: string = '';
            proc.stdout.on('data', chunk => {
                console.log(chunk);
                data += chunk.toString();
            });
            proc.stdout.on('end', () => {
                console.log(data);
                resolve(data);
            });
            proc.stdout.on('error', reject);
            proc.stdin.write(src);
            proc.stdin.end();
        });
    }

    public stream(srcStream: Stream): Stream {
        const proc = spawn(command, this._opts);
        srcStream.pipe(proc.stdin);
        return proc.stdout;
    }
}