import { FormatSpec } from "../utils/FormatSpec";

export namespace FormatSpecHelper {
    export function format(input: number | string, formatSpec: string) {
        let spec = FormatSpec.getFormatSpec(formatSpec);
        if (spec) {
            return spec.format(input);
        }
        return input;
    }
}