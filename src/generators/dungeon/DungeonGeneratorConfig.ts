export interface DungeonGeneratorConfig {
    seed: string;
    rowCount: number;
    columnCount: number;
    dungeonLayout: DungeonLayout;
    minimumRoomSize: number;
    maximumRoomSize: number;
    roomLayout: RoomLayout;
    corridorLayout: CorridorLayout;
    removeDeadendsRatio: number;
    addStairCount: number;
    mapStyle: MapStyle;
    cellSize: number;
    mapPadding: number;
}

export function getDungeonGeneratorConfig(
    seed: string = String(Date.now()),
    rowCount: number = 39,
    columnCount: number = 39,
    dungeonLayout: DungeonLayout = DungeonLayout.None,
    minimumRoomSize: number = 3,
    maximumRoomSize: number = 9,
    roomLayout: RoomLayout = RoomLayout.Scattered,
    corridorLayout: CorridorLayout = CorridorLayout.Bent,
    removeDeadendsRatio: number = 50,
    addStairCount: number = 2,
    mapStyle: MapStyle = MapStyle.Standard,
    cellSize: number = 18,
    mapPadding: number = 1
): DungeonGeneratorConfig {
    return {
        seed: seed,
        rowCount: rowCount,
        columnCount: columnCount,
        dungeonLayout: dungeonLayout,
        minimumRoomSize: minimumRoomSize,
        maximumRoomSize: maximumRoomSize,
        roomLayout: roomLayout,
        corridorLayout: corridorLayout,
        removeDeadendsRatio: removeDeadendsRatio,
        addStairCount: addStairCount,
        mapStyle: mapStyle,
        cellSize: cellSize,
        mapPadding: mapPadding
    };
}

export function parseDungeonGeneratorConfig(
    seed?: string,
    rowCount?: string,
    columnCount?: string,
    dungeonLayout?: string,
    minimumRoomSize?: string,
    maximumRoomSize?: string,
    roomLayout?: string,
    corridorLayout?: string,
    removeDeadendsRatio?: string,
    addStairCount?: string,
    mapStyle?: string,
    cellSize?: string,
    mapPadding?: string
): DungeonGeneratorConfig {
    return getDungeonGeneratorConfig(
        seed,
        parseIntOrUndefined(rowCount),
        parseIntOrUndefined(columnCount),
        parseDungeonLayout(dungeonLayout),
        parseIntOrUndefined(minimumRoomSize),
        parseIntOrUndefined(maximumRoomSize),
        parseRoomLayout(roomLayout),
        parseCorridorLayout(corridorLayout),
        parseIntOrUndefined(removeDeadendsRatio),
        parseIntOrUndefined(addStairCount),
        parseMapStyle(mapStyle),
        parseIntOrUndefined(cellSize),
        parseIntOrUndefined(mapPadding),
    );
}

function parseIntOrUndefined(value?: string): number | undefined {
    return !value || isNaN(parseInt(value)) ? undefined : parseInt(value);
}

function parseDungeonLayout(value?: string): DungeonLayout | undefined {
    if (value) {
        let key = value as keyof typeof DungeonLayout;
        return DungeonLayout[key];
    }
    return;
}

function parseRoomLayout(value?: string): RoomLayout | undefined {
    if (value) {
        let key = value as keyof typeof RoomLayout;
        return RoomLayout[key];
    }
    return;
}

function parseCorridorLayout(value?: string): CorridorLayout | undefined {
    if (value) {
        let key = value as keyof typeof CorridorLayout;
        return CorridorLayout[key];
    }
    return;
}

function parseMapStyle(value?: string): MapStyle | undefined {
    if (value) {
        let key = value as keyof typeof MapStyle;
        return MapStyle[key];
    }
    return;
}

export enum DungeonLayout {
    None,
    Box,
    Cross,
    Round
}

export enum RoomLayout {
    Packed,
    Scattered
}

export enum CorridorLayout {
    Labyrinth = 0,
    Bent = 50,
    Straight = 100
}

export enum MapStyle {
    Standard = "None"
}