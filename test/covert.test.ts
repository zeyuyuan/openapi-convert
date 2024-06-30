import { describe, expect, it } from "vitest";
import { OpenApiConverter, fetchByApi, writeOutputToDisk } from "../src";
import { OpenApi } from "../src/types/OpenApi";

const API_URL =
  "http://127.0.0.1:4523/export/openapi?projectId=1826684&specialPurpose=openapi-generator";

describe("covert", () => {
  it.skip("test readSchemaFolder", () => {
    const folder = {
      "x-apifox-folder": "test/name/Ace",
    };
    const result = OpenApiConverter.prototype.readSchemaFolder(folder);
    expect(result).toBe("TestNameAce");
  });

  it("test convert model and api", async () => {
    const apiJson: OpenApi = await fetchByApi(API_URL);
    const converter = new OpenApiConverter(apiJson);
    converter.generateModelFolders().generateModelFiles().generateApiFiles();
    await writeOutputToDisk(converter.output);
  });

  it("test getApiFoldName with hyphen and underscore", () => {
    const testcase = "taskon-community_summarize";
    const result = OpenApiConverter.prototype.getApiFoldName(testcase);
    expect(result).toBe("TaskonCommunitySummarize");
  });

  it("test getApiFoldName with non-English characters", () => {
    const testcase = "TaskOnCommunity 相关接口";
    const result = OpenApiConverter.prototype.getApiFoldName(testcase);
    expect(result).toBe("TaskOnCommunity");
  });

  it("test getApiFoldName with multiple hyphens", () => {
    const testcase = "taskon-community-task";
    const result = OpenApiConverter.prototype.getApiFoldName(testcase);
    expect(result).toBe("TaskonCommunityTask");
  });
});
