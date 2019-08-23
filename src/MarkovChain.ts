interface MarkovCacheEntry {
    [varName: string]: number;
}

interface MarkovEntries {
    [tokenVal: string]: MarkovCacheEntry;
}

export class MarkovChain {
    private _chainCache: MarkovEntries;

    constructor() {
        this._chainCache = {};
    }

    public get wordCount(): MarkovCacheEntry {
        return this._chainCache.wordCount;
    }

    public buildChain(trainSet: string[]): void {
        this._chainCache = {
            wordCount: {},
            wordLength: {},
            initialCharacter: {}
        };

        for (var eachEntry of trainSet) {
            var words = eachEntry.split(/\s+/);
            this.incrementWordCount(words.length);

            for (var eachWord of words) {
                this.incrementWordLength(eachWord.length);
                this.incrementInitialCharacter(eachWord.charAt(0));

                for (var charNdx = 1; charNdx < eachWord.length; charNdx++) {
                    this.incrementChain(eachWord.charAt(charNdx - 1), eachWord.charAt(charNdx));
                }
            }
        }
        this.scaleChain();
    }

    public selectLink(key: string): string {
        var length = this._chainCache.tableLength[key];
        var ndx = Math.floor(Math.random() * length);
        var t = 0;
        for (var token in this._chainCache[key]) {
            t += this._chainCache[key][token];
            if (ndx < t) {
                return token;
            }
        }
        return "-";
    }

    public selectWordCount(): number {
        var result = this.selectLink("wordCount");
        return parseInt(result);
    }

    public selectWordLength(): number {
        var result = this.selectLink("wordLength");
        return parseInt(result);
    }

    public selectInitialCharacter(): string {
        return this.selectLink("initialCharacter");
    }

    private scaleChain(): void {
        var tableLength: MarkovCacheEntry = {};
        for (var key in this._chainCache) {
            tableLength[key] = 0;

            for (var token in this._chainCache[key]) {
                var count = this._chainCache[key][token];
                var weighted = Math.floor(Math.pow(count, 1.3));

                this._chainCache[key][token] = weighted;
                tableLength[key] += weighted;
            }
        }
        this._chainCache.tableLength = tableLength;
    }

    private incrementWordCount(count: number): void {
        if (!this.wordCount[count.toString()]) {
            this.wordCount[count.toString()] = 0;
        }
        this.wordCount[count.toString()]++;
    }

    private incrementWordLength(length: number): void {
        if (!this._chainCache.wordLength[length.toString()]) {
            this._chainCache.wordLength[length.toString()] = 0;
        }
        this._chainCache.wordLength[length.toString()]++;
    }

    private incrementInitialCharacter(initialCharacter: string): void {
        if (!this._chainCache.initialCharacter[initialCharacter]) {
            this._chainCache.initialCharacter[initialCharacter] = 0;
        }
        this._chainCache.initialCharacter[initialCharacter]++;
    }

    private incrementChain(previousCharacter: string, currentCharacter: string): void {
        if (!this._chainCache[previousCharacter]) {
            this._chainCache[previousCharacter] = {};
        }
        if (!this._chainCache[previousCharacter][currentCharacter]) {
            this._chainCache[previousCharacter][currentCharacter] = 0;
        }
        this._chainCache[previousCharacter][currentCharacter]++;
    }
}