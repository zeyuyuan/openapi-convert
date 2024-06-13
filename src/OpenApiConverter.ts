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
    let folder = schema["x-apifox-folder"] || "DefaultFolder";
    folder = folder
      .split("/")
      .map(folderName => {
        return folderName[0].toUpperCase() + folderName.slice(1);
      })
      .join("");
    return folder;
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

  public getRef($ref: string) {
    const refName = $ref.split("/").pop();
    if (!refName) {
      throw new Error(`invalid ref: ${$ref}`);
    }
    const folderName = this.readSchemaFolder(
      this.input.components.schemas[refName]
    );
    return {
      refName,
      folderName,
    };
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
      const { refName, folderName } = this.getRef($ref);
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
        // todo support enum
        value = "string";
        break;
      case "integer":
        value = "number";
        break;
      case "boolean":
        value = "boolean";
        break;
      case "array": {
        const { code, imports } = this.getModelArray(schema.items!);
        allImports.push(...imports);
        value = code;
        break;
      }
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

  public getModelArray(modelItems: OpenApiSchema): ConvertPropertyResult {
    const { type, $ref, items } = modelItems;
    if ($ref) {
      const { refName, folderName } = this.getRef($ref);
      return {
        code: `${refName}[]`,
        imports: [
          `import { ${refName} } from "../${folderName}/${refName}.ts";`,
        ],
      };
    }
    switch (type) {
      case "string":
        // todo support enum
        return {
          code: "string[]",
          imports: [],
        };
      case "integer":
        return {
          code: "number[]",
          imports: [],
        };
      case "number":
        return {
          code: "number[]",
          imports: [],
        };
      case "boolean":
        return {
          code: "boolean[]",
          imports: [],
        };
      case "object": {
        // todo support object?
        console.log("todo object in array");
        return {
          code: "object[]",
          imports: [],
        };
      }
      case "array": {
        if (!items?.$ref) {
          throw new Error("array in array items ref not found");
        }
        const { refName, folderName } = this.getRef(items.$ref);
        return {
          code: `${refName}[][]`,
          imports: [
            `import { ${refName} } from "../${folderName}/${refName}.ts";`,
          ],
        };
      }
      default: {
        throw new Error(`unknown type: ${type}`);
      }
    }
  }

  public getModelFileContent(
    propertyKey: string,
    schema: OpenApiSchema
  ): string {
    const { type, properties } = schema;
    if (!type) {
      // may be $ref, ok to ignore?
      return "";
    }
    switch (type) {
      case "string":
        // todo support enum
        return `export type ${propertyKey} = string;`;
      case "integer":
        return `export type ${propertyKey} = number;`;
      case "number":
        return `export type ${propertyKey} = number;`;
      case "boolean":
        return `export type ${propertyKey} = boolean;`;
      case "array": {
        if (!schema.items) {
          throw new Error("array items not found");
        }
        const { code, imports } = this.getModelArray(schema.items);
        return `${imports.join("")} export type ${propertyKey} = ${code};`;
      }

      case "object": {
        const lines: string[] = [];
        let allImports: string[] = [];
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
        allImports = Array.from(new Set(allImports));
        return `${allImports.join("")}\n\n export interface ${propertyKey} {${lines.join("")}}`;
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
