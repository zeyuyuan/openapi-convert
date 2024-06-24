import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { OpenApiConverter, fetchByApi, writeOutputToDisk } from "../src";

const API_URL =
  "http://127.0.0.1:4523/export/openapi?projectId=1826684&specialPurpose=openapi-generator";

describe("covert", () => {
  it("test readSchemaFolder", () => {
    const folder = {
      "x-apifox-folder": "test/name/Ace",
    };
    const result = OpenApiConverter.prototype.readSchemaFolder(folder);
    expect(result).toBe("TestNameAce");
  });

  it("test", async () => {
    const apiJson = await fetchByApi(API_URL);
    const converter = new OpenApiConverter(apiJson);
    converter.generateModelFolders().generateModelFiles();

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const resultPath = path.resolve(__dirname, "result.json");
    const result = JSON.stringify(converter.output, null, 2);
    fs.writeFileSync(resultPath, result, "utf8");
    await writeOutputToDisk(converter.output);
  });
});
