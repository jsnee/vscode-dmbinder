export interface DungeonGeneratorConfig {
    seed: number;
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

export function getConfig(
    seed: number = Date.now(),
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