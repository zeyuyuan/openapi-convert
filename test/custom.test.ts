import { describe, it } from "vitest";
import { convertCustom } from "./convertCustom";

describe("covert", () => {
  it("test convert model and api", async () => {
    await convertCustom();
  });
});
