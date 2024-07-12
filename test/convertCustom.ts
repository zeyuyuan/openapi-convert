import {
  fetchByApi,
  generateFormDataCode,
  OpenApiConverter,
  writeOutputToDisk,
} from "../src";
import { ApiInfo } from "../src/types/api";
import { OpenApi } from "../src/types/OpenApi";
import path from "path";

const API_URL =
  "http://127.0.0.1:4523/export/openapi?projectId=1826684&specialPurpose=openapi-generator";

class CustomOpenApiConverter extends OpenApiConverter {
  public getRequestNameFromPath(path: string) {
    // Remove 'v1' from path if present
    path = path.replace("/v1", "");

    // Convert path to camel case
    const pathParts = path.split("/").slice(1);
    return pathParts
      .map((part, index) => {
        if (index === 0) {
          return part[0].toLowerCase() + part.slice(1);
        }
        return part[0].toUpperCase() + part.slice(1);
      })
      .join("");
  }

  protected getJsonApiFileContent(
    name: string,
    path: string,
    openApiPath: ApiInfo
  ): string {
    const { summary, requestBody, responses } = openApiPath;
    let requestBodyCode = "";
    let requestBodyImports: string[] = [];
    if (requestBody) {
      ({ code: requestBodyCode, imports: requestBodyImports } =
        this.getModelProperty(
          "",
          requestBody.content["application/json"]!.schema
        ));
    }
    let responseCode = "";
    let responseImports: string[] = [];
    const responseSchema = responses["200"].content["application/json"].schema;
    if (responseSchema.$ref === "#/components/schemas/TaskOnStringResponse") {
      responseCode = "string";
    } else if (responseSchema.$ref !== "#/components/schemas/TaskOnResponse") {
      const resultSchema = responseSchema?.properties?.result;
      if (!resultSchema) {
        throw new Error(`response no result: ${path}`);
      }
      const { code, imports } = this.getModelProperty("", resultSchema);
      responseCode = code;
      responseImports = imports;
    }
    if (responseCode === "boolean") {
      responseCode = "";
    }

    const imports = Array.from(
      new Set([...requestBodyImports, ...responseImports])
    );

    return `
    import { request, AxiosConfig, TaskOnRes } from "@/core/utils/request";
    ${imports.join("")}

    /**
     * ${summary} 
     */
    export const ${name} = async (${requestBodyCode ? `params?: ${requestBodyCode},` : ""} options?: AxiosConfig): Promise<${responseCode || "boolean"}> => {
        const { result } = await request<${responseCode ? `TaskOnRes<${responseCode}>` : "TaskOnRes"}>({
            url: '${path}',
            method: 'POST',${requestBodyCode ? "data: params," : ""}
            ...options
        });
        if (typeof result === 'undefined') {
          throw new Error('unexpected: result should exist when no error')
        }
        return result;
    }
    `;
  }

  protected getFormDataApiFileContent(
    name: string,
    path: string,
    openApiPath: ApiInfo
  ): string {
    const { summary, requestBody, responses } = openApiPath;
    let requestBodyCode = "";
    let requestBodyImports: string[] = [];
    if (requestBody) {
      ({ code: requestBodyCode, imports: requestBodyImports } =
        this.getModelProperty(
          "",
          requestBody.content["multipart/form-data"]!.schema
        ));
    }
    let responseCode = "";
    let responseImports: string[] = [];
    const responseSchema = responses["200"].content["application/json"].schema;
    if (responseSchema.$ref === "#/components/schemas/TaskOnStringResponse") {
      responseCode = "string";
    } else if (responseSchema.$ref !== "#/components/schemas/TaskOnResponse") {
      const resultSchema = responseSchema?.properties?.result;
      if (!resultSchema) {
        console.log(
          "resultSchema",
          responses["200"].content["application/json"].schema
        );
        throw new Error("response no result");
      }
      const { code, imports } = this.getModelProperty("", resultSchema);
      responseCode = code;
      responseImports = imports;
    }
    if (responseCode === "boolean") {
      responseCode = "";
    }
    const imports = Array.from(
      new Set([...requestBodyImports, ...responseImports])
    );

    return `
      import { request, AxiosConfig, TaskOnRes } from "@/core/utils/request";
      ${imports.join("")}

      /**
       * ${summary}
       */
      export const ${name} = async (${requestBodyCode ? `params: ${requestBodyCode},` : ""} options?: AxiosConfig): Promise<${responseCode || "boolean"}> => {
      const formData = new FormData();
      ${requestBodyCode ? generateFormDataCode(requestBodyCode) : ""}
       const { result } = await request<${responseCode ? `TaskOnRes<${responseCode}>` : "TaskOnRes"}>({
            url: '${path}',
            method: 'POST',${requestBodyCode ? "data: formData," : ""}
            ...options
        });
        if (typeof result === 'undefined') {
          throw new Error('unexpected: result should exist when no error')
        }
        return result;
      }
    `;
  }
}

export const convertCustom = async () => {
  const apiJson: OpenApi = await fetchByApi(API_URL);
  const converter = new CustomOpenApiConverter(apiJson);
  converter.generateModelFolders().generateModelFiles().generateApiFiles();
  const rootPath = path.resolve(__dirname, "output");
  await writeOutputToDisk(converter.output, rootPath);
};
