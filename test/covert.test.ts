import { describe, expect, it } from "vitest";
import { covert } from "../src/covert";
import json from "./mock.json";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

describe("covert", () => {
  it("test", async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const result = await covert(json);
    const koPath = path.resolve(__dirname, "result.json");
    fs.writeFileSync(koPath, result, "utf8");
    expect(result).toEqual(1);
  });
});
