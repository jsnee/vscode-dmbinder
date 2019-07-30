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
    cellSize: number = 18
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
        cellSize: cellSize
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
    cellSize?: string
): DungeonGeneratorConfig {
    return getDungeonGeneratorConfig(
        seed,
        !rowCount || isNaN(parseInt(rowCount)) ? undefined : parseInt(rowCount),
        !columnCount || isNaN(parseInt(columnCount)) ? undefined : parseInt(columnCount),
        parseDungeonLayout(dungeonLayout),
        !minimumRoomSize || isNaN(parseInt(minimumRoomSize)) ? undefined : parseInt(minimumRoomSize),
        !maximumRoomSize || isNaN(parseInt(maximumRoomSize)) ? undefined : parseInt(maximumRoomSize),
        parseRoomLayout(roomLayout),
        parseCorridorLayout(corridorLayout),
        !removeDeadendsRatio || isNaN(parseInt(removeDeadendsRatio)) ? undefined : parseInt(removeDeadendsRatio),
        !addStairCount || isNaN(parseInt(addStairCount)) ? undefined : parseInt(addStairCount),
        parseMapStyle(mapStyle),
        !cellSize || isNaN(parseInt(cellSize)) ? undefined : parseInt(cellSize),
    );
}

function parseDungeonLayout(value?: string): DungeonLayout | undefined {
    if (value === "None") {
        return DungeonLayout.None;
    }
    if (value === "Box") {
        return DungeonLayout.Box;
    }
    if (value === "Cross") {
        return DungeonLayout.Cross;
    }
    if (value === "Round") {
        return DungeonLayout.Round;
    }
    return;
}

function parseRoomLayout(value?: string): RoomLayout | undefined {
    if (value === "Scattered") {
        return RoomLayout.Scattered;
    }
    if (value === "Packed") {
        return RoomLayout.Packed;
    }
    return;
}

function parseCorridorLayout(value?: string): CorridorLayout | undefined {
    if (value === "Bent") {
        return CorridorLayout.Bent;
    }
    if (value === "Labyrinth") {
        return CorridorLayout.Labyrinth;
    }
    if (value === "Straight") {
        return CorridorLayout.Straight;
    }
    return;
}

function parseMapStyle(value?: string): MapStyle | undefined {
    if (value === "Standard") {
        return MapStyle.Standard;
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
    Standard
}