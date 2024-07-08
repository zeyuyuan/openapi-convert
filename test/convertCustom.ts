import { fetchByApi, OpenApiConverter, writeOutputToDisk } from "../src";
import { ApiInfo } from "../src/types/api";
import { OpenApi } from "../src/types/OpenApi";
import path from "path";

const API_URL =
  "http://127.0.0.1:4523/export/openapi?projectId=1826684&specialPurpose=openapi-generator";

class CustomOpenApiConverter extends OpenApiConverter {
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
    import { request, AxiosConfig, TaskOnRes } from "@/core/utils/request.ts";
    ${imports.join("")}

    /**
     * ${summary} 
     */
    export const ${name} = async (${requestBodyCode ? `params: ${requestBodyCode},` : ""} options?: AxiosConfig): Promise<${responseCode ? `TaskOnRes<${responseCode}>` : "TaskOnRes"}> => {
        const { result } = await request({
            url: '${path}',
            method: 'POST',
            data: params,
            ...options
        });
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
