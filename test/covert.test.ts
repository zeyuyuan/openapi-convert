import { describe, expect, it } from "vitest";
import json from "./mock.json";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { OpenApiConverter } from "../src/OpenApiConverter";

describe("covert", () => {
  it("test", async () => {
    const converter = new OpenApiConverter(json);
    converter.generateModelFolders().generateModelFiles();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const resultPath = path.resolve(__dirname, "result.json");
    const result = JSON.stringify(converter.output, null, 2);
    fs.writeFileSync(resultPath, result, "utf8");
  });
});
