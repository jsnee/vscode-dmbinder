import { DungeonGeneratorConfig, DungeonLayout, RoomLayout } from "./DungeonGeneratorConfig";
import seedrandom = require("seedrandom");
import { DungeonCanvasConfig, DungeonCanvas, DungeonCanvasColors, DungeonDoor, DungeonDoorType, DungeonLabel, DungeonStair } from "./DungeonCanvas";

enum DungeonCellType {
    Nothing = 0 << 0,
    Blocked = 1 << 0,
    Room = 1 << 1,
    Corridor = 1 << 2,
    //       = 1 << 3,
    Perimeter = 1 << 4,
    Entrance = 1 << 5,
    RoomId = 1023 << 6,
    Arch = 1 << 16,
    Door = 1 << 17,
    Locked = 1 << 18,
    Trapped = 1 << 19,
    Secret = 1 << 20,
    Portcullis = 1 << 21,
    StairUp = 1 << 22,
    StairDown = 1 << 23,
    Label = 255 << 24,
    // Complex Cell States
    OpenSpace = Room | Corridor,
    DoorSpace = Arch | Door | Locked | Trapped | Secret | Portcullis,
    ESpace = Entrance | DoorSpace | Label,
    Stairs = StairDown | StairUp,
    // Blocked Cell States
    BlockRoom = Blocked | Room,
    BlockCorridor = Blocked | Corridor,
    BlockDoor = Blocked | DoorSpace
}

interface Dict<T> {
    [key: string]: T;
}

interface StairEnd {
    walled: Array<[number, number]>;
    corridor: Array<[number, number]>;
    stair: [number, number];
    next: [number, number];
}

interface CloseEnd {
    walled: Array<[number, number]>;
    close: Array<[number, number]>;
    open?: [number, number];
    recurse: [number, number];
}

const oppositeDirections: Dict<string> = {
    north: "south",
    south: "north",
    west: "east",
    east: "west"
};

const di: Dict<number> = {
    north: -1,
    south: 1,
    west: 0,
    east: 0
};

const dj: Dict<number> = {
    north: 0,
    south: 0,
    west: -1,
    east: 1
};

const roomLayoutMask = {
    "Box": [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
    "Cross": [[0, 1, 0], [1, 1, 1], [0, 1, 0]]
};

const stairEnds: Dict<StairEnd> = {
    north: {
        walled: [[1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]],
        corridor: [[0, 0], [1, 0], [2, 0]],
        stair: [0, 0],
        next: [1, 0]
    },
    south: {
        walled: [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]],
        corridor: [[0, 0], [-1, 0], [-2, 0]],
        stair: [0, 0],
        next: [-1, 0]
    },
    west: {
        walled: [[-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1]],
        corridor: [[0, 0], [0, 1], [0, 2]],
        stair: [0, 0],
        next: [0, 1]
    },
    east: {
        walled: [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]],
        corridor: [[0, 0], [0, -1], [0, -2]],
        stair: [0, 0],
        next: [0, -1]
    }
};

const closeEnd: Dict<CloseEnd> = {
    north: {
        walled: [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1]],
        close: [[0, 0]],
        recurse: [-1, 0]
    },
    south: {
        walled: [[0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]],
        close: [[0, 0]],
        recurse: [1, 0]
    },
    west: {
        walled: [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0]],
        close: [[0, 0]],
        recurse: [0, -1]
    },
    east: {
        walled: [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]],
        close: [[0, 0]],
        recurse: [0, 1]
    }
};

function getLayoutMask(layout: DungeonLayout): number[][] | undefined {
    if (layout === DungeonLayout.Box) {
        return roomLayoutMask.Box;
    }
    if (layout === DungeonLayout.Cross) {
        return roomLayoutMask.Cross;
    }
    return;
}

interface StairData {
    row: number;
    col: number;
    nextRow: number;
    nextCol: number;
    key?: string;
}

interface RoomOptions {
    height?: number;
    width?: number;
    rowPos?: number;
    colPos?: number;
}

interface RoomData {
    id: number;
    row: number;
    col: number;
    north: number;
    south: number;
    west: number;
    east: number;
    height: number;
    width: number;
    area: number;
    doors: DoorCollection;
}

interface DoorCollection {
    [direction: string]: DoorData[];
}

interface DoorData {
    row: number;
    col: number;
    key?: string;
    type?: string;
    outId?: number;
}

interface SoundRoom {
    isBlocked: boolean;
    collisions?: RoomCollisions;
}

interface RoomCollisions {
    [roomId: string]: number;
}

interface RoomCollection {
    [roomId: number]: RoomData;
}

interface DoorSill {
    sillRow: number;
    sillCol: number;
    direction: string;
    doorRow: number;
    doorCol: number;
    outId?: number;
}

class DungeonGeneratorRaster {
    cells: DungeonCellType[][];
    rooms: RoomCollection;
    stairs: StairData[];
    doors: DoorData[];
    _roomCount: number;
    _rng: seedrandom.prng;
    _rowSteps: number;
    _colSteps: number;
    _minimumRoomSize: number;
    _maximumRoomSize: number;
    _connections: string[];
    _corridorLayoutComplexity: number;
    _cellSize: number;

    public constructor(config: DungeonGeneratorConfig) {
        this.cells = [];
        this.rooms = {};
        this.stairs = [];
        this.doors = [];
        this._roomCount = 0;
        this._rng = seedrandom(config.seed);
        this._rowSteps = Math.floor(config.rowCount / 2);
        this._colSteps = Math.floor(config.columnCount / 2);
        this._minimumRoomSize = config.minimumRoomSize;
        this._maximumRoomSize = config.maximumRoomSize;
        this._corridorLayoutComplexity = config.corridorLayout;
        this._cellSize = config.cellSize;
        for (let r = 0; r <= this._numRows; r++) {
            this.cells[r] = [];
            for (let c = 0; c <= this._numCols; c++) {
                this.cells[r][c] = DungeonCellType.Nothing;
            }
        }
        this._connections = [];
    }

    private get _numRows(): number {
        return this._rowSteps * 2;
    }

    private get _numCols(): number {
        return this._colSteps * 2;
    }

    private get _maxRow(): number {
        return this._numRows - 1;
    }

    private get _maxCol(): number {
        return this._numCols - 1;
    }

    private get _roomBase(): number {
        return Math.floor((this._minimumRoomSize + 1) / 2);
    }

    private get _roomRadix(): number {
        return Math.floor((this._maximumRoomSize - this._minimumRoomSize) / 2) + 1;
    }

    public initializeCellMask(dungeonLayout: DungeonLayout): void {
        switch (dungeonLayout) {
            case DungeonLayout.Box:
            case DungeonLayout.Cross:
                let mask = getLayoutMask(dungeonLayout);
                if (mask !== undefined) {
                    let rowScalar = mask.length * 1.0 / (this._numRows + 1);
                    let colScalar = mask[0].length * 1.0 / (this._numCols + 1);
                    for (let r = 0; r <= this._numRows; r++) {
                        for (let c = 0; c <= this._numCols; c++) {
                            this.cells[r][c] = mask[Math.floor(r * rowScalar)][Math.floor(c * colScalar)] === 1
                                ? this.cells[r][c]
                                : DungeonCellType.Blocked;
                        }
                    }
                }
                break;
            case DungeonLayout.Round:
                let centerRow = Math.floor(this._numRows / 2);
                let centerCol = Math.floor(this._numCols / 2);
                for (let r = 0; r <= this._numRows; r++) {
                    for (let c = 0; c <= this._numCols; c++) {
                        let d = Math.sqrt(Math.pow(r - centerRow, 2) + Math.pow(c - centerCol, 2));
                        this.cells[r][c] = d > centerCol ? DungeonCellType.Blocked : this.cells[r][c];
                    }
                }
                break;
            case DungeonLayout.None:
            default:
        }
    }

    public packRooms(): void {
        for (let i = 0; i < this._rowSteps; i++) {
            let row = i * 2 + 1;
            for (let j = 0; j < this._colSteps; j++) {
                let col = j * 2 + 1;
                if (this.cells[row][col] && DungeonCellType.Room || ((i === 0 || j === 0) && Math.floor(this._rng() * 2))) {
                    continue;
                }
                let opts: RoomOptions = {
                    rowPos: i,
                    colPos: j
                };
                this.emplaceRoom(opts);
            }
        }
    }

    public scatterRooms(): void {
        let numRooms = this.allocateRooms();
        for (let i = 0; i < numRooms; i++) {
            this.emplaceRoom();
        }
    }

    public openRooms(): void {
        for (let id = 1; id <= this._roomCount; id++) {
            this.openRoom(this.rooms[id]);
        }
        this._connections = [];
    }

    public labelRooms(): void {
        for (let id = 1; id <= this._roomCount; id++) {
            let room = this.rooms[id];
            let label = String(room.id);
            let len = label.length;
            let labelRow = Math.floor((room.north + room.south) / 2);
            let labelCol = Math.floor((room.west + room.east - len) / 2) + 1;

            for (let col = 0; col < len; col++) {
                this.cells[labelRow][labelCol + col] |= (label.charCodeAt(col) << 24);
            }
        }
    }

    public corridors(): void {
        for (let i = 1; i < this._rowSteps; i++) {
            let row = (i * 2) + 1;
            for (let j = 1; j < this._colSteps; j++) {
                let col = (j * 2) + 1;
                if (this.cells[row][col] & DungeonCellType.Corridor) {
                    continue;
                }
                this.tunnel(i, j);
            }
        }
    }

    public emplaceStairs(stairCount: number): void {
        if (stairCount > 0) {
            let ends = this.listStairEnds();
            if (ends.length) {
                for (let i = 0; i < stairCount; i++) {
                    let stair = ends.splice(Math.floor(this._rng() * ends.length), 1)[0];
                    if (!stair) {
                        break;
                    }
                    let type = (i < 2) ? i : Math.floor(this._rng() * 2);

                    if (type === 0) {
                        this.cells[stair.row][stair.col] |= DungeonCellType.StairDown;
                        stair.key = "down";
                    } else {
                        this.cells[stair.row][stair.col] |= DungeonCellType.StairUp;
                        stair.key = "up";
                    }
                    this.cells[stair.row][stair.col] |= (stair.key.charCodeAt(0) << 24);
                    this.stairs.push(stair);
                }
            }
        }
    }

    public cleanDungeon(removeDeadendsRatio: number): void {
        if (removeDeadendsRatio) {
            this.removeDeadends(removeDeadendsRatio);
        }
        this.fixDoors();
        this.emptyBlocks();
    }

    public drawMap(colors: DungeonCanvasColors, mapPadding: number, scale: number = 1.0): string {
        let config: DungeonCanvasConfig = {
            width: this._numCols,
            height: this._numRows,
            cellSize: this._cellSize,
            colors: colors,
            scale: scale,
            mapPadding: mapPadding
        };
        let canvas = new DungeonCanvas(config);
        let foregroundTiles: number[] = [];
        for (let row = 0; row <= this._numRows; row++) {
            for (let col = 0; col <= this._numCols; col++) {
                if (this.cells[row][col] & DungeonCellType.OpenSpace) {
                    let tileId = (row * this._numCols) + col;
                    foregroundTiles.push(tileId);
                }
            }
        }
        canvas.fillSpaces(foregroundTiles);
        canvas.fillDoors(this.getDoors());
        canvas.populateLabels(this.getLabels());
        canvas.fillStairs(this.getStairs());
        return canvas.draw();
    }

    private getDoors(): DungeonDoor[] {
        let results: DungeonDoor[] = [];
        for (let door of this.doors) {
            let doorType: DungeonDoorType;
            switch (door.key) {
                case "arch":
                    doorType = DungeonDoorType.Arch;
                    break;
                case "open":
                    doorType = DungeonDoorType.Regular;
                    break;
                case "lock":
                    doorType = DungeonDoorType.Locked;
                    break;
                case "trap":
                    doorType = DungeonDoorType.Trapped;
                    break;
                case "secret":
                    doorType = DungeonDoorType.Secret;
                    break;
                case "portc":
                    doorType = DungeonDoorType.Portcullis;
                    break;
                default:
                    continue;
            }
            let tileId = (door.row * this._numCols) + door.col;
            let isHorizontal = !!(this.cells[door.row][door.col - 1] & DungeonCellType.OpenSpace);
            results.push({
                tileId: tileId,
                doorType: doorType,
                isHorizontal: isHorizontal
            });
        }
        return results;
    }

    private getLabels(): DungeonLabel[] {
        let results: DungeonLabel[] = [];
        for (let row = 0; row <= this._numRows; row++) {
            for (let col = 0; col <= this._numCols; col++) {
                if (this.cells[row][col] & DungeonCellType.OpenSpace) {
                    let tileId = (row * this._numCols) + col;
                    if (this.cells[row][col] & DungeonCellType.OpenSpace) {
                        let charCode = (this.cells[row][col] >> 24) & (DungeonCellType.Label >> 24);//255
                        if (charCode) {
                            let char = String.fromCharCode(charCode);
                            if (/^\d/.test(char)) {
                                results.push({
                                    tileId: tileId,
                                    text: char
                                });
                            }
                        }
                    }
                }
            }
        }
        return results;
    }

    private getStairs(): DungeonStair[] {
        let results: DungeonStair[] = [];
        for (let stair of this.stairs) {
            results.push({
                row: stair.row,
                col: stair.col,
                nextRow: stair.nextRow,
                nextCol: stair.nextCol,
                isDown: stair.key && stair.key === "down" ? true : false
            });
        }
        return results;
    }

    private allocateRooms(): number {
        let dungeonArea = this._numCols * this._numRows;
        let maxRoomArea = Math.pow(this._maximumRoomSize, 2);
        return Math.floor(dungeonArea / maxRoomArea);
    }

    private emplaceRoom(roomOpts: RoomOptions = {}): void {
        if (this._roomCount < 999) {
            // Room position and Size
            if (roomOpts.height === undefined) {
                if (roomOpts.rowPos !== undefined) {
                    let val = this._rowSteps - this._roomBase - roomOpts.rowPos;
                    val = Math.max(val, 0);
                    val = Math.min(val, this._roomRadix);
                    roomOpts.height = Math.floor(this._rng() * val) + this._roomBase;
                } else {
                    roomOpts.height = Math.floor(this._rng() * this._roomRadix) + this._roomBase;
                }
            }
            if (roomOpts.width === undefined) {
                if (roomOpts.colPos !== undefined) {
                    let val = this._colSteps - this._roomBase - roomOpts.colPos;
                    val = Math.max(val, 0);
                    val = Math.min(val, this._roomRadix);
                    roomOpts.width = Math.floor(this._rng() * val) + this._roomBase;
                } else {
                    roomOpts.width = Math.floor(this._rng() * this._roomRadix) + this._roomBase;
                }
            }
            if (roomOpts.rowPos === undefined) {
                roomOpts.rowPos = Math.floor(this._rng() * (this._rowSteps - roomOpts.height));
            }
            if (roomOpts.colPos === undefined) {
                roomOpts.colPos = Math.floor(this._rng() * (this._colSteps - roomOpts.width));
            }

            // Room boundaries
            let row1 = roomOpts.rowPos * 2 + 1;
            let col1 = roomOpts.colPos * 2 + 1;
            let row2 = (roomOpts.rowPos + roomOpts.height) * 2 - 1;
            let col2 = (roomOpts.colPos + roomOpts.width) * 2 - 1;

            // Check for collisions
            if (row1 >= 1 && row2 <= this._maxRow && col1 >= 1 && col2 <= this._maxCol) {
                let hit = this.soundRoom(row1, col1, row2, col2);
                if (!hit.isBlocked) {
                    let hitList: string[] = [];
                    if (hit.collisions !== undefined) {
                        hitList = Object.keys(hit.collisions);
                    }
                    if (hitList.length === 0) {
                        let roomId = this._roomCount + 1;
                        this._roomCount = roomId;

                        // Emplace room
                        for (let r = row1; r <= row2; r++) {
                            for (let c = col1; c <= col2; c++) {
                                if (this.cells[r][c] & DungeonCellType.Entrance) {
                                    this.cells[r][c] &= ~DungeonCellType.ESpace;
                                } else if (this.cells[r][c] & DungeonCellType.Perimeter) {
                                    this.cells[r][c] &= ~DungeonCellType.Perimeter;
                                }
                                this.cells[r][c] |= DungeonCellType.Room | (roomId << 6);
                            }
                        }

                        let height = ((row2 - row1) + 1) * 10;
                        let width = ((col2 - col1) + 1 * 10);

                        let roomData: RoomData = {
                            id: roomId,
                            row: row1,
                            col: col1,
                            north: row1,
                            south: row2,
                            west: col1,
                            east: col2,
                            height: height,
                            width: width,
                            area: height * width,
                            doors: {
                                north: [],
                                south: [],
                                west: [],
                                east: []
                            }
                        };
                        this.rooms[roomId] = roomData;

                        // Block corridors from room boundary; Check for door openings from adjacent rooms
                        for (let r = row1 - 1; r <= row2 + 1; r++) {
                            if (!(this.cells[r][col1 - 1] & (DungeonCellType.Room | DungeonCellType.Entrance))) {
                                this.cells[r][col1 - 1] |= DungeonCellType.Perimeter;
                            }
                            if (!(this.cells[r][col2 + 1] & (DungeonCellType.Room | DungeonCellType.Entrance))) {
                                this.cells[r][col2 + 1] |= DungeonCellType.Perimeter;
                            }
                        }
                        for (let c = col1 - 1; c <= col2 + 1; c++) {
                            if (!(this.cells[row1 - 1][c] & (DungeonCellType.Room | DungeonCellType.Entrance))) {
                                this.cells[row1 - 1][c] |= DungeonCellType.Perimeter;
                            }
                            if (!(this.cells[row2 + 1][c] & (DungeonCellType.Room | DungeonCellType.Entrance))) {
                                this.cells[row2 + 1][c] |= DungeonCellType.Perimeter;
                            }
                        }
                    }
                }
            }
        }
    }

    private soundRoom(row1: number, col1: number, row2: number, col2: number): SoundRoom {
        let result: SoundRoom = {
            isBlocked: false
        };
        for (let r = row1; r <= row2; r++) {
            for (let c = col1; c <= col2; c++) {
                if (this.cells[r][c] & DungeonCellType.Blocked) {
                    return {
                        isBlocked: true
                    };
                }
                if (this.cells[r][c] & DungeonCellType.Room) {
                    let id = (this.cells[r][c] & DungeonCellType.RoomId) >> 6;
                    if (result.collisions === undefined) {
                        result.collisions = {};
                    }
                    result.collisions[String(id)] += 1;
                }
            }
        }
        return result;
    }

    private openRoom(room: RoomData): void {
        let sills = this.doorSills(room);
        if (sills.length > 0) {
            let numOpenings = this.allocateOpenings(room);
            for (let i = 0; i < numOpenings; i++) {
                let sill = sills.splice(Math.floor(this._rng() * sills.length), 1)[0];
                if (!sill) {
                    break;
                }
                let doorCell = this.cells[sill.doorRow][sill.doorCol];
                if (doorCell & DungeonCellType.DoorSpace) {
                    i--;
                    continue;
                }
                let outId = sill.outId;
                // tslint:disable-next-line:triple-equals
                if (outId != null) {
                    let connection = Math.min(room.id, outId) + "," + Math.max(room.id, outId);
                    if (this._connections.indexOf(connection) !== -1) {
                        i--;
                        continue;
                    }
                    this._connections.push(connection);
                }

                for (let x = 0; x < 3; x++) {
                    let row = sill.sillRow + (di[sill.direction] * x);
                    let col = sill.sillCol + (dj[sill.direction] * x);

                    this.cells[row][col] &= ~DungeonCellType.Perimeter;
                    this.cells[row][col] |= DungeonCellType.Entrance;
                }

                let doorType = this.pickDoorType();
                let door: DoorData = {
                    row: sill.doorRow,
                    col: sill.doorCol,
                };
                switch (doorType) {
                    case DungeonCellType.Arch:
                        this.cells[door.row][door.col] |= doorType;
                        door.key = "arch";
                        door.type = "Archway";
                        break;
                    case DungeonCellType.Door:
                        this.cells[door.row][door.col] |= doorType;
                        door.key = "open";
                        door.type = "Unlocked Door";
                        break;
                    case DungeonCellType.Locked:
                        this.cells[door.row][door.col] |= doorType;
                        door.key = "lock";
                        door.type = "Locked Door";
                        break;
                    case DungeonCellType.Trapped:
                        this.cells[door.row][door.col] |= doorType;
                        door.key = "trap";
                        door.type = "Trapped Door";
                        break;
                    case DungeonCellType.Secret:
                        this.cells[door.row][door.col] |= doorType;
                        door.key = "secret";
                        door.type = "Secret Door";
                        break;
                    case DungeonCellType.Portcullis:
                        this.cells[door.row][door.col] |= doorType;
                        door.key = "portc";
                        door.type = "Portcullis";
                        break;
                    default:
                        throw Error("Unrecognized door type was processed!");
                }
                door.outId = outId;
                room.doors[sill.direction].push(door);
            }
        }
    }

    private doorSills(room: RoomData): DoorSill[] {
        let results: DoorSill[] = [];
        if (room.north >= 3) {
            for (let col = room.west; col <= room.east; col += 2) {
                let sill = this.checkSill(room, room.north, col, 'north');
                if (sill) {
                    results.push(sill);
                }
            }
        }
        if (room.south <= (this._numRows - 3)) {
            for (let col = room.west; col <= room.east; col += 2) {
                let sill = this.checkSill(room, room.south, col, 'south');
                if (sill) {
                    results.push(sill);
                }
            }
        }
        if (room.west >= 3) {
            for (let row = room.north; row <= room.south; row += 2) {
                let sill = this.checkSill(room, row, room.west, 'west');
                if (sill) {
                    results.push(sill);
                }
            }
        }
        if (room.east <= (this._numCols - 3)) {
            for (let row = room.north; row <= room.south; row += 2) {
                let sill = this.checkSill(room, row, room.east, 'east');
                if (sill) {
                    results.push(sill);
                }
            }
        }
        results.sort(() => this._rng() - 0.5);
        return results;
    }

    private allocateOpenings(room: RoomData): number {
        let roomHeight = ((room.south - room.north) / 2) + 1;
        let roomWidth = ((room.east - room.west) / 2) + 1;
        let flumph = Math.floor(Math.sqrt(roomWidth * roomHeight));
        let numOpenings = flumph + Math.floor(this._rng() * flumph);
        return numOpenings;
    }

    private checkSill(room: RoomData, row: number, col: number, dir: string): DoorSill | undefined {
        let doorRow = row + di[dir];
        let doorCol = col + dj[dir];
        let doorCell = this.cells[doorRow][doorCol];
        if (doorCell & DungeonCellType.Perimeter && !(doorCell & DungeonCellType.BlockDoor)) {
            let outRow = doorRow + di[dir];
            let outCol = doorCol + dj[dir];
            let outCell = this.cells[outRow][outCol];
            if (!(outCell & DungeonCellType.Blocked)) {
                let outId: number | undefined;
                if (outCell & DungeonCellType.Room) {
                    outId = (outCell & DungeonCellType.RoomId) >> 6;
                    if (outId === room.id) {
                        return;
                    }
                }
                return {
                    sillRow: row,
                    sillCol: col,
                    direction: dir,
                    doorRow: doorRow,
                    doorCol: doorCol,
                    outId: outId
                };
            }
        }
        return;
    }

    private pickDoorType(): DungeonCellType {
        let i = Math.floor(this._rng() * 110);

        if (i < 15) {
            return DungeonCellType.Arch;
        }
        if (i < 60) {
            return DungeonCellType.Door;
        }
        if (i < 75) {
            return DungeonCellType.Locked;
        }
        if (i < 90) {
            return DungeonCellType.Trapped;
        }
        if (i < 100) {
            return DungeonCellType.Secret;
        }
        return DungeonCellType.Portcullis;
    }

    private tunnel(i: number, j: number, lastDir?: string): void {
        let dirs = this.tunnelDirections(lastDir);
        for (let dir of dirs) {
            if (this.openTunnel(i, j, dir)) {
                let iNext = i + di[dir];
                let jNext = j + dj[dir];
                this.tunnel(iNext, jNext, dir);
            }
        }
    }

    private tunnelDirections(lastDir?: string): string[] {
        let dirs = Object.keys(dj).sort().sort(() => this._rng() - 0.5);
        if (lastDir && this._corridorLayoutComplexity && Math.floor(this._rng() * 100) < this._corridorLayoutComplexity) {
            dirs.unshift(lastDir);
        }
        return dirs;
    }

    private openTunnel(i: number, j: number, dir: string): number {
        let thisRow = (i * 2) + 1;
        let thisCol = (j * 2) + 1;
        let nextRow = ((i + di[dir]) * 2) + 1;
        let nextCol = ((j + dj[dir]) * 2) + 1;
        let midRow = (thisRow + nextRow) / 2;
        let midCol = (thisCol + nextCol) / 2;

        if (this.soundTunnel(midRow, midCol, nextRow, nextCol)) {
            return this.delveTunnel(thisRow, thisCol, nextRow, nextCol);
        }
        return 0;
    }

    private soundTunnel(midRow: number, midCol: number, nextRow: number, nextCol: number): number {
        if (nextRow < 0 || nextRow > this._numRows || nextCol < 0 || nextCol > this._numCols) {
            return 0;
        }
        let r1 = Math.min(midRow, nextRow);
        let r2 = Math.max(midRow, nextRow);
        let c1 = Math.min(midCol, nextCol);
        let c2 = Math.max(midCol, nextCol);

        for (let row = r1; row <= r2; row++) {
            for (let col = c1; col <= c2; col++) {
                if (this.cells[row][col] & DungeonCellType.BlockCorridor) {
                    return 0;
                }
            }
        }
        return 1;
    }

    private delveTunnel(thisRow: number, thisCol: number, nextRow: number, nextCol: number): number {
        let r1 = Math.min(thisRow, nextRow);
        let r2 = Math.max(thisRow, nextRow);
        let c1 = Math.min(thisCol, nextCol);
        let c2 = Math.max(thisCol, nextCol);
        
        for (let row = r1; row <= r2; row++) {
            for (let col = c1; col <= c2; col++) {
                this.cells[row][col] &= ~DungeonCellType.Entrance;
                this.cells[row][col] |= DungeonCellType.Corridor;
            }
        }
        return 1;
    }

    private listStairEnds(): StairData[] {
        let results: StairData[] = [];
        ROW:
        for (let i = 0; i < this._rowSteps; i++) {
            let row = (i * 2) + 1;
            COL:
            for (let j = 0; j < this._colSteps; j++) {
                let col = (j * 2) + 1;
                if (this.cells[row][col] === DungeonCellType.Corridor) {
                    if (this.cells[row][col] & DungeonCellType.Stairs) {
                        continue;
                    }
                    for (let dir in stairEnds) {
                        if (this.checkTunnel(row, col, stairEnds[dir])) {
                            let next = stairEnds[dir].next;
                            let end: StairData = {
                                row: row,
                                col: col,
                                nextRow: row + next[0],
                                nextCol: col + next[1]
                            };
                            results.push(end);
                            continue COL;
                        }
                    }
                } else {
                    continue;
                }
            }
        }
        return results;
    }

    private checkTunnel(row: number, col: number, check: { walled: Array<[number, number]>, corridor?: Array<[number, number]> }): number {
        if (check.corridor && check.corridor.length) {
            for (let p of check.corridor) {
                if (this.cells[row + p[0]][col + p[1]] === DungeonCellType.Corridor) {
                    continue;
                }
                return 0;
            }
        }
        if (check.walled && check.walled.length) {
            for (let p of check.walled) {
                if (this.cells[row + p[0]][col + p[1]] & DungeonCellType.OpenSpace) {
                    return 0;
                }
            }
        }
        return 1;
    }

    private removeDeadends(ratio: number): void {
        this.collapseTunnels(ratio);
    }

    private collapseTunnels(removeDeadendsRatio: number): void {
        if (removeDeadendsRatio) {
            let all = removeDeadendsRatio === 100;
            for (let i = 0; i < this._rowSteps; i++) {
                let row = (i * 2) + 1;
                for (let j = 0; j < this._colSteps; j++) {
                    let col = (j * 2) + 1;

                    let isOpenSpace = this.cells[row][col] & DungeonCellType.OpenSpace;
                    let isStairs = this.cells[row][col] & DungeonCellType.Stairs;

                    if (isOpenSpace && !isStairs && (all || (Math.floor(this._rng() * 100) < removeDeadendsRatio))) {
                        this.collapse(row, col);
                    }
                }
            }
        }
    }

    private collapse(row: number, col: number): void {
        if (this.cells[row][col] & DungeonCellType.OpenSpace) {
            for (let dir in closeEnd) {
                let xc = closeEnd[dir];
                if (this.checkTunnel(row, col, xc)) {
                    for (let p of xc.close) {
                        this.cells[row + p[0]][col + p[1]] = DungeonCellType.Nothing;
                    }
                    if (xc.open) {
                        let p = xc.open;
                        this.cells[row + p[0]][col + p[1]] |= DungeonCellType.Corridor;
                    }
                    if (xc.recurse) {
                        let p = xc.recurse;
                        this.collapse(row + p[0], col + p[1]);
                    }
                }
            }
        }
    }

    private fixDoors(): void {
        let fixed: string[] = [];
        for (let roomId in this.rooms) {
            let room = this.rooms[roomId];
            for (let dir of Object.keys(room.doors).sort()) {
                let shiny: DoorData[] = [];
                for (let door of room.doors[dir]) {
                    let doorCell = this.cells[door.row][door.col];
                    if (doorCell & DungeonCellType.OpenSpace) {
                        if (fixed.indexOf(door.row + "," + door.col) !== -1) {
                            shiny.push(door);
                        } else {
                            if (door.outId) {
                                this.rooms[door.outId].doors[oppositeDirections[dir]].push(door);
                            }
                            shiny.push(door);
                            fixed.push(door.row + "," + door.col);
                        }
                    }
                }
                if (shiny.length) {
                    room.doors[dir] = shiny;
                    this.doors.push(...shiny);
                } else {
                    room.doors[dir] = [];
                }
            }
        }
    }

    private emptyBlocks(): void {
        for (let row = 0; row <= this._numRows; row++) {
            for (let col = 0; col <= this._numCols; col++) {
                if (this.cells[row][col] & DungeonCellType.Blocked) {
                    this.cells[row][col] = DungeonCellType.Nothing;
                }
            }
        }
    }
}

export class DungeonGenerator {
    private _config: DungeonGeneratorConfig;

    public constructor(config: DungeonGeneratorConfig) {
        this._config = config;
        this.validateConfig();
    }

    public generate(): string {
        let raster = new DungeonGeneratorRaster(this._config);
        raster.initializeCellMask(this._config.dungeonLayout);
        switch (this._config.roomLayout) {
            case RoomLayout.Packed:
                raster.packRooms();
                break;
            case RoomLayout.Scattered:
            default:
                raster.scatterRooms();
        }
        raster.openRooms();
        raster.labelRooms();
        raster.corridors();
        raster.emplaceStairs(this._config.addStairCount);
        raster.cleanDungeon(this._config.removeDeadendsRatio);

        return raster.drawMap(
            {
                backgroundFill: "black",
                foregroundFill: "white",
                foregroundStroke: "black",
                textStroke: "black"
            },
            this._config.mapPadding);
    }

    private validateConfig(): void {
        if ((this._config.rowCount % 2) !== 1) {
            throw Error("Invalid DungeonGeneratorConfig: rowCount must be an odd number!");
        }
        if ((this._config.columnCount % 2) !== 1) {
            throw Error("Invalid DungeonGeneratorConfig: columnCount must be an odd number!");
        }
        if (this._config.removeDeadendsRatio < 0 || this._config.removeDeadendsRatio > 100) {
            throw Error("Invalid DungeonGeneratorConfig: removeDeadendsRatio must be between 0 and 100!");
        }
    }
}