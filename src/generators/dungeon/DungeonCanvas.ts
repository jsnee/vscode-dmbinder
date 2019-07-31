export interface DungeonCanvasConfig {
    width: number;
    height: number;
    colors: DungeonCanvasColors;
    cellSize: number;
    scale: number;
    mapPadding: number;
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

export interface DungeonLabel {
    tileId: number;
    text: string;
}

export interface DungeonStair {
    row: number;
    col: number;
    nextRow: number;
    nextCol: number;
    isDown: boolean;
}

export enum DungeonDoorType {
    Arch,
    Regular,
    Secret,
    Locked,
    Trapped,
    Portcullis
}

interface SvgText {
    x: number;
    y: number;
    text: string;
    cssClass?: string;
}

interface Coordinates {
    x: number;
    y: number;
}

export class DungeonCanvas {
    private _foregroundPath: string = "";
    private _doorPath: string = "";
    private _secretPath: string = "";
    private _labels: SvgText[] = [];
    private _stairPath: string = "";
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
        // Remove duplicate doors (why are there duplciate doors?)
        doors = this.dedupeDoors(doors);
        // Make sure doors are in order (to simplify SVG drawing path)
        doors.sort((a, b) => a.tileId - b.tileId);
        let door = doors.shift();
        let moveX = 0;
        let isFirstDoorInRow = true;

        for (let row = 0; row < this.height; row++) {
            if (!door) {
                // No more doors
                break;
            }
            isFirstDoorInRow = true;
            moveX = 0;
            for (let col = 0; col < this.width; col++) {
                if (door) {
                    let tileId = (row * this.width) + col;
                    if (door.tileId === tileId) {
                        if (isFirstDoorInRow) {
                            this._doorPath += this.svgNewLine(row);
                            isFirstDoorInRow = false;
                        }
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

    public populateLabels(labels: DungeonLabel[]): void {
        for (let label of labels) {
            let pixelCoords = this.getPixelCoords(label.tileId);
            this._labels.push({
                x: pixelCoords.x,
                y: pixelCoords.y,
                cssClass: "dungeonLabels",
                text: label.text
            });
        }
    }

    public fillStairs(stairs: DungeonStair[]): void {
        let s_px = Math.floor(this.cellSize / 2);
        let t_px = Math.floor(this.cellSize / 20) + 2;
        for (let stair of stairs) {
            if (stair.nextRow > stair.row) {
                let xc = (stair.col + this.mapPadding + 0.5) * this.cellSize;
                let y1 = (stair.row + this.mapPadding) * this.cellSize;
                let y2 = (stair.nextRow + this.mapPadding + 1) * this.cellSize;

                for (let y = y1; y < y2; y += t_px) {
                    let dx: number;
                    if (stair.isDown) {
                        dx = Math.floor(((y - y1) / (y2 - y1)) * s_px);
                    } else {
                        dx = s_px;
                    }
                    this._stairPath += `M${xc - dx},${y}L${xc + dx},${y}`;
                }
            } else if (stair.nextRow < stair.row) {
                let xc = (stair.col + this.mapPadding + 0.5) * this.cellSize;
                let y1 = (stair.row + this.mapPadding + 1) * this.cellSize;
                let y2 = (stair.nextRow + this.mapPadding) * this.cellSize;

                for (let y = y1; y > y2; y -= t_px) {
                    let dx: number;
                    if (stair.isDown) {
                        dx = Math.floor(((y - y1) / (y2 - y1)) * s_px);
                    } else {
                        dx = s_px;
                    }
                    this._stairPath += `M${xc - dx},${y}L${xc + dx},${y}`;
                }
            } else if (stair.nextCol > stair.col) {
                let x1 = (stair.col + this.mapPadding) * this.cellSize;
                let x2 = (stair.nextCol + this.mapPadding + 1) * this.cellSize;
                let yc = (stair.row + this.mapPadding + 0.5) * this.cellSize;
                
                for (let x = x1; x < x2; x += t_px) {
                    let dy: number;
                    if (stair.isDown) {
                        dy = Math.floor(((x - x1) / (x2 - x1)) * s_px);
                    } else {
                        dy = s_px;
                    }
                    this._stairPath += `M${x},${yc - dy}L${x},${yc + dy}`;
                }
            } else if (stair.nextCol < stair.col) {
                let x1 = (stair.col + this.mapPadding + 1) * this.cellSize;
                let x2 = (stair.nextCol + this.mapPadding) * this.cellSize;
                let yc = (stair.row + this.mapPadding + 0.5) * this.cellSize;
                
                for (let x = x1; x > x2; x -= t_px) {
                    let dy: number;
                    if (stair.isDown) {
                        dy = Math.floor(((x - x1) / (x2 - x1)) * s_px);
                    } else {
                        dy = s_px;
                    }
                    this._stairPath += `M${x},${yc - dy}L${x},${yc + dy}`;
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
            + this.svgSecrets + "\n"
            + this.svgLabels + "\n"
            + this.svgStairs + "\n"
            + this.svgFoot;
    }

    private get svgHead(): string {
        return `<svg width="${(this.width + (2 * this.mapPadding)) * this.cellSize}" height="${(this.height + (2 * this.mapPadding)) * this.cellSize}">`;
    }

    private get svgFoot(): string {
        return "</svg>";
    }

    private get svgStyle(): string {
        return '<defs><style type="text/css"><![CDATA['
            + `\n    #dungeonBackground { fill: ${this._config.colors.backgroundFill}; } `
            + `\n    #dungeonForeground { stroke: ${this._config.colors.foregroundStroke}; fill: ${this._config.colors.foregroundFill}; }`
            + `\n    #dungeonDoors { stroke: ${this._config.colors.foregroundStroke}; fill: ${this._config.colors.backgroundFill}; }`
            + `\n    #dungeonSecrets { stroke: ${this._config.colors.foregroundStroke}; fill: transparent; }`
            + `\n    .dungeonLabels { stroke: ${this._config.colors.foregroundStroke}; text-anchor: middle; font-size: ${this.labelFontSize}px; }`
            + `\n    #dungeonStairs { stroke: ${this._config.colors.foregroundStroke}; fill: transparent; }`
            + "]]></style></defs>";
    }

    private get svgBackground(): string {
        return `<rect id="dungeonBackground" width="${(this.width + (2 * this.mapPadding))  * this.cellSize}" height="${(this.height + (2 * this.mapPadding)) * this.cellSize}"/>`;
    }

    private get svgForeground(): string {
        return `<path id="dungeonForeground" d="${this._foregroundPath}"/>`;
    }

    private get svgDoors(): string {
        return `<path id="dungeonDoors" d="${this._doorPath}"/>`;
    }

    private get svgSecrets(): string {
        return `<path id="dungeonSecrets" d="${this._secretPath}"/>`;
    }

    private get svgLabels(): string {
        return this._labels
            .map((label) => `<text x="${label.x + (this.cellSize / 2)}" y="${label.y + this.labelFontSize}" class="${label.cssClass || ''}">${label.text}</text>`)
            .join("\n");
    }

    private get svgStairs(): string {
        return `<path id="dungeonStairs" d="${this._stairPath}"/>`;
    }

    private get labelFontSize(): number {
        return this.cellSize * 2 / 3;
    }

    private get mapPadding(): number {
        return this._config.mapPadding;
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

    private dedupeDoors(doors: DungeonDoor[]): DungeonDoor[] {
        let results: DungeonDoor[] = [];
        let doorIds: number[] = [];
        for (let door of doors) {
            if (doorIds.indexOf(door.tileId) === -1) {
                doorIds.push(door.tileId);
                results.push(door);
            }
        }
        return results;
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
                this.drawSecret(door);
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

    private drawSecret(door: DungeonDoor): void {
        let pixelCoords = this.getPixelCoords(door.tileId);
        this._secretPath += `M${pixelCoords.x},${pixelCoords.y}`;
        if (door.isHorizontal) {
            this._secretPath += `m${this.cellMidpoint + (this.doorThickness / 2) + this.jambThickness},${this.jambWidth + 1}`
                + `h-${this.jambThickness}`
                + `c-${this.trapThickness},0,-${this.trapThickness},${this.doorWidth / 2},-${this.doorThickness / 2},${this.doorWidth / 2}`
                + `s${this.trapThickness},${this.doorWidth / 2},-${this.doorThickness / 2},${this.doorWidth / 2}`
                + `h-${this.jambThickness}`;
        } else {
            this._secretPath += `m${this.jambWidth + 1},${this.cellMidpoint - (this.doorThickness / 2) - this.jambThickness}`
                + `v${this.jambThickness}`
                + `c0,${this.trapThickness},${this.doorWidth / 2},${this.trapThickness},${this.doorWidth / 2},${this.doorThickness / 2}`
                + `s${this.doorWidth / 2},-${this.trapThickness},${this.doorWidth / 2},${this.doorThickness / 2}`
                + `v${this.jambThickness}`;
        }
    }

    private svgNewLine(row: number): string {
        return `M${this.cellSize * this.mapPadding},${row * this.cellSize + (this.cellSize * this.mapPadding)}`;
    }

    private getTileCoords(tileId: number): Coordinates {
        let col = tileId % this.width;
        let row = (tileId - col) / this.width;
        return {
            x: col + this.mapPadding,
            y: row + this.mapPadding
        };
    }

    private getPixelCoords(tileId: number): Coordinates {
        let tileCoords = this.getTileCoords(tileId);
        return {
            x: this.cellSize * tileCoords.x,
            y: this.cellSize * tileCoords.y
        };
    }
}