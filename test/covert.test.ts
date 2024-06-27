import { describe, expect, it } from "vitest";
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
    await writeOutputToDisk(converter.output);
  });
});
