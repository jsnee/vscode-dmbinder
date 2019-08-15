import { InputBoxOptions, window, QuickPickItem } from "vscode";
import { CorridorLayout, RoomLayout, DungeonLayout, getDungeonGeneratorConfig, DungeonGeneratorConfig } from "../generators/dungeon/DungeonGeneratorConfig";

export namespace DungeonGeneratorHelpers {
    export async function promptGeneratorInput(source: string): Promise<string | undefined> {
        const inputOptions: InputBoxOptions = {
            placeHolder: `{${source}}`,
            prompt: `Override value for "{${source}}"?`
        };
        return await window.showInputBox(inputOptions);
    }

    export async function promptGenerateDungeonMapSettings(): Promise<DungeonGeneratorConfig | undefined> {
        let config = getDungeonGeneratorConfig();

        // Prompt for the seed
        const seedInputOptions: InputBoxOptions = {
            prompt: "Seed",
            value: config.seed
        };
        let seed = await window.showInputBox(seedInputOptions);
        if (!seed) {
            return;
        }
        config.seed = seed;

        // Prompt for the rowCount
        const rowCountInputOptions: InputBoxOptions = {
            prompt: "Row Count (needs to be odd)",
            value: String(config.rowCount),
            validateInput: (value) => isNaN(parseInt(value)) ? "Please provide a valid number of rows" : (parseInt(value) % 2 === 0 ? "Please provide an odd number" : null)
        };
        let rowCount = await window.showInputBox(rowCountInputOptions);
        if (!rowCount) {
            return;
        }
        config.rowCount = parseInt(rowCount);

        // Prompt for the columnCount
        const columnCountInputOptions: InputBoxOptions = {
            prompt: "Column Count (needs to be odd)",
            value: String(config.rowCount),
            validateInput: (value) => isNaN(parseInt(value)) ? "Please provide a valid number of columns" : (parseInt(value) % 2 === 0 ? "Please provide an odd number" : null)
        };
        let colCount = await window.showInputBox(columnCountInputOptions);
        if (!colCount) {
            return;
        }
        config.columnCount = parseInt(colCount);

        // Prompt for the dungeon layout
        let dungeonLayoutItems: QuickPickItem[] = [
            { label: "None", picked: true },
            { label: "Box" },
            { label: "Cross" },
            { label: "Round" }
        ];
        let dungeonLayout = await window.showQuickPick(dungeonLayoutItems, { placeHolder: "Dungeon Layout" });
        if (!dungeonLayout) {
            return;
        }
        if (dungeonLayout.label === "Box") {
            config.dungeonLayout = DungeonLayout.Box;
        } else if (dungeonLayout.label === "Cross") {
            config.dungeonLayout = DungeonLayout.Cross;
        } else if (dungeonLayout.label === "Round") {
            config.dungeonLayout = DungeonLayout.Round;
        } else {
            config.dungeonLayout = DungeonLayout.None;
        }

        // Prompt for the minimumRoomSize
        const minRoomSizeInputOptions: InputBoxOptions = {
            prompt: "Minimum Room Size",
            value: String(config.minimumRoomSize),
            validateInput: (value) => isNaN(parseInt(value)) ? "Please provide a valid number" : (parseInt(value) < 1 ? "Number cannot be less than 1" : null)
        };
        let minRoom = await window.showInputBox(minRoomSizeInputOptions);
        if (!minRoom) {
            return;
        }
        config.minimumRoomSize = parseInt(minRoom);

        // Prompt for the maximumRoomSize
        const maxRoomSizeInputOptions: InputBoxOptions = {
            prompt: "Maximum Room Size",
            value: String(config.maximumRoomSize),
            validateInput: (value) => isNaN(parseInt(value)) ? "Please provide a valid number" : (parseInt(value) < config.minimumRoomSize ? `Number cannot be smaller than minimumRoomSize (${config.minimumRoomSize})` : null)
        };
        let maxRoom = await window.showInputBox(maxRoomSizeInputOptions);
        if (!maxRoom) {
            return;
        }
        config.maximumRoomSize = parseInt(maxRoom);

        // Prompt for the room layout
        let roomLayoutItems: QuickPickItem[] = [
            { label: "Scattered", picked: true },
            { label: "Packed" }
        ];
        let roomLayout = await window.showQuickPick(roomLayoutItems, { placeHolder: "Room Layout" });
        if (!roomLayout) {
            return;
        }
        if (roomLayout.label === "Packed") {
            config.roomLayout = RoomLayout.Packed;
        } else {
            config.roomLayout = RoomLayout.Scattered;
        }

        // Prompt for the corridor layout
        let corridorLayoutItems: QuickPickItem[] = [
            { label: "Bent", picked: true },
            { label: "Labyrinth" },
            { label: "Straight" }
        ];
        let corridorLayout = await window.showQuickPick(corridorLayoutItems, { placeHolder: "Corridor Layout" });
        if (!corridorLayout) {
            return;
        }
        if (corridorLayout.label === "Labyrinth") {
            config.corridorLayout = CorridorLayout.Labyrinth;
        } else if (corridorLayout.label === "Straight") {
            config.corridorLayout = CorridorLayout.Straight;
        } else {
            config.corridorLayout = CorridorLayout.Bent;
        }

        // Prompt for the removeDeadendsRatio
        const deadendsInputOptions: InputBoxOptions = {
            prompt: "Percent of Deadends to Remove (0-100)",
            value: String(config.removeDeadendsRatio),
            validateInput: (value) => isNaN(parseInt(value)) ? "Please provide a valid number" : (parseInt(value) < 0 || parseInt(value) > 100 ? "Please provide a number from 0 to 100" : null)
        };
        let deadends = await window.showInputBox(deadendsInputOptions);
        if (!deadends) {
            return;
        }
        config.removeDeadendsRatio = parseInt(deadends);

        // Prompt for the addStairCount
        const stairCountInputOptions: InputBoxOptions = {
            prompt: "Number of Stairs",
            value: String(config.addStairCount),
            validateInput: (value) => isNaN(parseInt(value)) ? "Please provide a valid number" : null
        };
        let stairCount = await window.showInputBox(stairCountInputOptions);
        if (!stairCount) {
            return;
        }
        config.addStairCount = parseInt(stairCount);

        // Prompt for the cellSize
        const cellSizeInputOptions: InputBoxOptions = {
            prompt: "Cell Size (sizes smaller than 18 not recommended)",
            value: String(config.cellSize),
            validateInput: (value) => isNaN(parseInt(value)) ? "Please provide a valid number" : (parseInt(value) < 1 ? "Number cannot be less than 1" : null)
        };
        let cellSize = await window.showInputBox(cellSizeInputOptions);
        if (!cellSize) {
            return;
        }
        config.cellSize = parseInt(cellSize);

        return config;
    }
}