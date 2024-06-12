import {
  ConverterOutput,
  OutputFile,
  OutputFolder,
} from "./types/ConverterOutput";
import { OpenApi, OpenApiSchema } from "./types/OpenApi";

interface ConvertPropertyResult {
  code: string;
  imports: string[];
}

export class OpenApiConverter {
  public output: ConverterOutput = {
    models: [],
    apis: [],
  };

  constructor(public input: OpenApi) {}

  public readSchemaFolder(schema: OpenApiSchema) {
    return schema["x-apifox-folder"] || "DefaultFolder";
  }

  /**
   * set all model folders (with empty files)
   */
  public generateModelFolders() {
    const schemas = this.input.components.schemas;
    const modelFolders = new Map<string, OutputFolder>();
    for (const value of Object.values(schemas)) {
      const folderName = this.readSchemaFolder(value);
      modelFolders.set(folderName, {
        folderName,
        files: [],
      });
    }
    this.output.models = Array.from(modelFolders.values());
    return this;
  }

  /**
   * get the model property code string and imports
   */
  public getModelProperty(
    key: string,
    schema: OpenApiSchema,
    required?: string[]
  ): ConvertPropertyResult {
    const { type, $ref, properties } = schema;
    const isRequired = required?.includes(key) || false;
    const base = `${key}${isRequired ? "" : "?"}: `;
    if ($ref) {
      const refName = $ref.split("/").pop();
      if (!refName) {
        throw new Error(`invalid ref: ${$ref}`);
      }
      const folderName =
        this.input.components.schemas[refName]["x-apifox-folder"];
      return {
        code: `${base}${refName};`,
        imports: [
          `import { ${refName} } from "../${folderName}/${refName}.ts";`,
        ],
      };
    }
    let value: string = "";
    const allImports: string[] = [];
    switch (type) {
      case "string":
        value = "string";
        break;
      case "integer":
        value = "number";
        break;
      case "array":
        value = "todo array";
        break;
      case "object": {
        const lines: string[] = [];
        if (properties) {
          for (const [key, value] of Object.entries(properties)) {
            const { code, imports } = this.getModelProperty(
              key,
              value,
              schema.required
            );
            lines.push(code);
            allImports.push(...imports);
          }
        }
        value = `{${lines.join("")}}`;
        break;
      }
      default: {
        value = `todo unknown ${type}`;
      }
    }
    return {
      code: `${base}${value};`,
      imports: allImports,
    };
  }

  public getModelFileContent(
    propertyKey: string,
    schema: OpenApiSchema
  ): string {
    const { type, properties } = schema;
    switch (type) {
      case "string":
        return `export type ${propertyKey} = string;`;
      case "integer":
        return `export type ${propertyKey} = number;`;
      case "number":
        return `export type ${propertyKey} = number;`;
      case "array":
        return "todo array";
      case "object": {
        const lines: string[] = [];
        const allImports: string[] = [];
        if (properties) {
          for (const [key, value] of Object.entries(properties)) {
            const { code, imports } = this.getModelProperty(
              key,
              value,
              schema.required
            );
            lines.push(code);
            allImports.push(...imports);
          }
        }

        return `${allImports.join("")} export interface ${propertyKey} {${lines.join("")}}`;
      }
      default: {
        throw new Error(`unknown type: ${type}`);
      }
    }
  }

  public generateModelFiles() {
    const schemas = this.input.components.schemas;
    for (const [key, value] of Object.entries(schemas)) {
      const folderName = this.readSchemaFolder(value);
      const folder = this.output.models.find(
        folder => folder.folderName === folderName
      );
      if (!folder) {
        throw new Error(
          "Folder not found, run generateModelFolders method first"
        );
      }
      const file: OutputFile = {
        fileName: key,
        content: this.getModelFileContent(key, value),
      };
      folder.files.push(file);
    }
    return this;
  }
}
