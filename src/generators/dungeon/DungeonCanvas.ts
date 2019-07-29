export interface DungeonCanvasConfig {
    width: number;
    height: number;
    colors: DungeonCanvasColors;
    cellSize: number;
    scale: number;
}

export interface DungeonCanvasColors {
    backgroundFill: string;
    foregroundFill: string;
    foregroundStroke: string;
    textStroke: string;
}

export interface DungeonDoor {
    tileId: number;
    doorType: DungeonDoorType;
    isHorizontal: boolean;
}

export enum DungeonDoorType {
    Arch,
    Regular,
    Secret,
    Locked,
    Trapped,
    Portcullis
}

export class DungeonCanvas {
    private _foregroundPath: string = "";
    private _doorPath: string = "";
    private _config: DungeonCanvasConfig;

    public constructor(config: DungeonCanvasConfig) {
        this._config = config;
    }

    public fillSpaces(foregroundTiles: number[]): void {
        for (let row = 0; row < this.height; row++) {
            this._foregroundPath += this.svgNewLine(row);
            for (let col = 0; col < this.width; col++) {
                let tileId = (row * this.width) + col;
                if (foregroundTiles.indexOf(tileId) !== -1) {
                    this._foregroundPath += `h${this.cellSize}v${this.cellSize}h-${this.cellSize}v-${this.cellSize}m${this.cellSize},0`;
                } else {
                    this._foregroundPath += `m${this.cellSize},0`;
                }
            }
        }
    }

    public fillDoors(doors: DungeonDoor[]): void {
        // Make sure doors are in order (to simplify SVG drawing path)
        doors.sort((a, b) => a.tileId - b.tileId);
        let door = doors.shift();
        let moveX = 0;

        for (let row = 0; row < this.height; row++) {
            if (!door) {
                // No more doors
                break;
            }
            this._doorPath += this.svgNewLine(row);
            moveX = 0;
            for (let col = 0; col < this.width; col++) {
                if (door) {
                    let tileId = (row * this.width) + col;
                    if (door.tileId === tileId) {
                        if (moveX) {
                            this._doorPath += `m${moveX * this.cellSize},0`;
                        }
                        this.drawDoor(door);
                        door = doors.shift();
                        moveX = 1;
                    } else {
                        moveX++;
                    }
                } else {
                    // No more doors
                    break;
                }
            }
        }
    }

    public draw(): string {
        return this.svgHead + "\n"
            + this.svgStyle + "\n"
            + this.svgBackground + "\n"
            + this.svgForeground + "\n"
            + this.svgDoors + "\n"
            + this.svgFoot;
    }

    private get svgHead(): string {
        return `<svg width="${(this.width + 2) * this.cellSize}" height="${(this.height + 2) * this.cellSize}">`;
    }

    private get svgFoot(): string {
        return "</svg>";
    }

    private get svgStyle(): string {
        return '<defs><style type="text/css"><![CDATA['
            + `\n    #dungeonBackground { fill: ${this._config.colors.backgroundFill}; } `
            + `\n    #dungeonForeground { stroke: ${this._config.colors.foregroundStroke}; fill: ${this._config.colors.foregroundFill}; }`
            + `\n    #dungeonDoors { stroke: ${this._config.colors.foregroundStroke}; fill: ${this._config.colors.backgroundFill}; }`
            + "]]></style></defs>";
    }

    private get svgBackground(): string {
        return `<rect id="dungeonBackground" width="${(this.width + 2)  * this.cellSize}" height="${(this.height + 2) * this.cellSize}"/>`;
    }

    private get svgForeground(): string {
        return `<path id="dungeonForeground" d="${this._foregroundPath}"/>`;
    }

    private get svgDoors(): string {
        return `<path id="dungeonDoors" d="${this._doorPath}"/>`;
    }

    private get cellSize(): number {
        return this._config.cellSize;
    }

    private get width(): number {
        return this._config.width;
    }

    private get height(): number {
        return this._config.height;
    }

    private get cellMidpoint(): number {
        return this.cellSize / 2;
    }

    private get jambWidth(): number {
        return this.cellSize / 6;
    }

    private get jambThickness(): number {
        return 1;
    }

    private get doorThickness(): number {
        return this.cellSize / 4;
    }

    private get doorWidth(): number {
        return this.cellSize - (2 * this.jambWidth) - 2;
    }

    private get trapThickness(): number {
        return this.cellSize / 3;
    }

    private svgNewLine(row: number): string {
        return `M${this.cellSize},${row * this.cellSize + this.cellSize}`;
    }

    private drawDoor(door: DungeonDoor): void {
        this.drawArch(door.isHorizontal);
        switch (door.doorType) {
            case DungeonDoorType.Regular:
                this.drawPlainDoor(door.isHorizontal);
                break;
            case DungeonDoorType.Trapped:
                this.drawTrapped(door.isHorizontal);
                this.drawPlainDoor(door.isHorizontal);
                break;
            case DungeonDoorType.Locked:
                this.drawLocked(door.isHorizontal);
                this.drawPlainDoor(door.isHorizontal);
                break;
            case DungeonDoorType.Portcullis:
                this.drawPortcullis(door.isHorizontal);
                break;
            case DungeonDoorType.Secret:
                this.drawSecret(door.isHorizontal);
                break;
            case DungeonDoorType.Arch:
            default:
                break;
        }
    }

    private drawArch(isHorizontal: boolean): void {
        if (isHorizontal) {
            this._doorPath += `m${this.cellMidpoint - this.jambThickness},0`
                + `h${2 * this.jambThickness}`
                + `v${this.jambWidth}`
                + `h-${2 * this.jambThickness}`
                + "z"
                + `m0,${this.cellSize}`
                + `v-${this.jambWidth}`
                + `h${2 * this.jambThickness}`
                + `v${this.jambWidth}`
                + "z"
                + `m-${this.cellMidpoint - this.jambThickness},-${this.cellSize}`;
        } else {
                this._doorPath += `m0,${this.cellMidpoint - this.jambThickness}`
                    + `v${2 * this.jambThickness}`
                    + `h${this.jambWidth}`
                    + `v-${2 * this.jambThickness}`
                    + "z"
                    + `m${this.cellSize},0`
                    + `h-${this.jambWidth}`
                    + `v${2 * this.jambThickness}`
                    + `h${this.jambWidth}`
                    + "z"
                    + `m-${this.cellSize},-${this.cellMidpoint - this.jambThickness}`;
        }
    }

    private drawPlainDoor(isHorizontal: boolean): void {
        if (isHorizontal) {
            this._doorPath += `m${this.cellMidpoint - this.doorThickness},${this.jambWidth + 1}`
                + `v${this.doorWidth}`
                + "m0,0"
                + `h${2 * this.doorThickness}`
                + "m0,0"
                + `v-${this.doorWidth}`
                + "m0,0"
                + `h-${2 * this.doorThickness}`
                + `m-${this.cellMidpoint - this.doorThickness},-${this.jambWidth + 1}`;
        } else {
            this._doorPath += `m${this.jambWidth + 1},${this.cellMidpoint - this.doorThickness}`
                + `h${this.doorWidth}`
                + "m0,0"
                + `v${2 * this.doorThickness}`
                + "m0,0"
                + `h-${this.doorWidth}`
                + "m0,0"
                + `v-${2 * this.doorThickness}`
                + `m-${this.jambWidth + 1},-${this.cellMidpoint - this.doorThickness}`;
        }
    }

    private drawLocked(isHorizontal: boolean): void {
        if (isHorizontal) {
            this._doorPath += `m${this.cellMidpoint},${this.jambWidth + 1}`
                + `v${this.doorWidth}`
                + `m-${this.cellMidpoint},-${this.doorWidth + this.jambWidth + 1}`;
        } else {
            this._doorPath += `m${this.jambWidth + 1},${this.cellMidpoint}`
                + `h${this.doorWidth}`
                + `m-${this.doorWidth + this.jambWidth + 1},-${this.cellMidpoint}`;
        }
    }

    private drawTrapped(isHorizontal: boolean): void {
        if (isHorizontal) {
            this._doorPath += `m${this.cellMidpoint - this.trapThickness},${this.cellMidpoint}`
                + `h${2 * this.trapThickness}`
                + `m-${this.trapThickness + this.cellMidpoint}, -${this.cellMidpoint}`;
        } else {
            this._doorPath += `m${this.cellMidpoint},${this.cellMidpoint - this.trapThickness}`
                + `v${2 * this.trapThickness}`
                + `m-${this.cellMidpoint},-${this.trapThickness + this.cellMidpoint}`;
        }
    }

    private drawPortcullis(isHorizontal: boolean): void {
        if (isHorizontal) {
            this._doorPath += `m${this.cellMidpoint},${this.jambWidth + 1}`;
            let i = 0;
            for (i = 0; i < this.doorWidth; i += 2) {
                if (i !== 0) {
                    this._doorPath += "m0,1";
                }
                this._doorPath += "v1";
            }
            this._doorPath += `m-${this.cellMidpoint},-${i + this.jambWidth}`;
        } else {
            this._doorPath += `m${this.jambWidth + 1},${this.cellMidpoint}`;
            let i = 0;
            for (i = 0; i < this.doorWidth; i += 2) {
                if (i !== 0) {
                    this._doorPath += "m1,0";
                }
                this._doorPath += "h1";
            }
            this._doorPath += `m-${i + this.jambWidth},-${this.cellMidpoint}`;
        }
    }

    private drawSecret(isHorizontal: boolean): void {
        if (isHorizontal) {
            this._doorPath += `m${this.cellMidpoint - 1},${this.cellMidpoint - this.doorThickness}`
                + "h3"
                + "m-4,1"
                + `v${this.doorThickness - 2}`
                + "m1,1"
                + "h2"
                + "m1,1"
                + `v${this.doorThickness - 2}`
                + "m-4,1"
                + "h3"
                + `m-${this.cellMidpoint + 1},-${this.cellMidpoint + this.doorThickness}`;
        } else {
            this._doorPath += `m${this.cellMidpoint - this.doorThickness},${this.cellMidpoint - 1}`
                + "v3"
                + "m1,-4"
                + `h${this.doorThickness - 2}`
                + "m1,1"
                + "v2"
                + "m1,1"
                + `h${this.doorThickness - 2}`
                + "m1,-4"
                + "v3"
                + `m-${this.cellMidpoint + this.doorThickness},-${this.cellMidpoint + 1}`;
        }
    }
}