import fs from "fs-extra";
import unzip from "unzip-stream";
import { BuiltAtlasLayout } from "../common/model";
import path from "node:path";


async function writeSearch(
    log: (msg: string) => void,
    layout: BuiltAtlasLayout,
    outputPath: string
) {

    if (layout.search && layout.search.searchSrcFileName) {
        const searchDir = path.join(outputPath, "/search/", layout.search.outDir);
        if (fs.existsSync(searchDir)) {
            log("Emptying search directory...");
            fs.emptyDirSync(searchDir);
        }
        log("Exporting search...");
        fs.createReadStream("../exporter/input/" + layout.search.searchSrcFileName)
            .pipe(unzip.Extract({ path: searchDir })).on("finish", () => {
                log("Done exporting search");
            });
    }

}

export { writeSearch }