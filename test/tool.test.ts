// test generateFormDataCode

import { describe, expect, it } from "vitest";
import { generateFormDataCode } from "../src";

describe("test tool", () => {
  it("test generateFormDataCode", () => {
    const interfaceStr = `{file: File;test: number;optional?: string;}`;
    const result = generateFormDataCode(interfaceStr);
    expect(result).toBe(
      "formData.append('file', params.file);\nformData.append('test', String(params.test));\nif (params.optional !== undefined) {\n  formData.append('optional', String(params.optional));\n}\n"
    );
  });
});
