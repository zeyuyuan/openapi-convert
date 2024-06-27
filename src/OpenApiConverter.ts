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
    const { type, $ref, properties, anyOf, oneOf } = schema;
    const isRequired = required?.includes(key) || false;
    // empty key for inline object
    const base = key ? `${key}${isRequired ? "" : "?"}: ` : "";
    if ($ref) {
      const { refName, folderName } = this.getRef($ref);
      return {
        code: base ? `${base}${refName};` : refName,
        imports: [
          `import { ${refName} } from "../${folderName}/${refName}.ts";`,
        ],
      };
    }
    let value: string = "";
    const allImports: string[] = [];
    const anyOrOneOf = anyOf || oneOf;
    if (anyOrOneOf) {
      const codes: string[] = [];
      for (const schema of anyOrOneOf) {
        const { code, imports } = this.getModelProperty("", schema);
        allImports.push(...imports);
        codes.push(code);
      }
      value = `${codes.join(" | ")}`;
    } else {
      switch (type) {
        case "string":
          if (schema.enum) {
            console.warn("A enum should be a named model", key, schema);
            value = `"${schema.enum.join('" | "')}"`;
          } else {
            value = "string";
          }
          break;
        case "integer":
          value = "number";
          break;
        case "number":
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
          if (!lines.length) {
            console.warn("Empty object should not exist", key, schema);
            value = "object";
          } else {
            value = `{${lines.join("")}}`;
          }
          break;
        }
        default: {
          console.log("todo unknown type", type);
          console.log(schema, key);
          value = `todo unknown ${type}`;
        }
      }
    }
    return {
      code: base ? `${base}${value};` : value, // no ; for inline object
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
        const { code, imports } = this.getModelProperty("", modelItems);
        return {
          code: `${code}[]`,
          imports: imports,
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
    const { type, properties, $ref, oneOf, anyOf } = schema;
    if ($ref) {
      const { refName, folderName } = this.getRef($ref);
      return `import { ${refName} } from "../${folderName}/${refName}.ts";export type ${propertyKey} = ${refName};`;
    }
    const anyOrOneOf = anyOf || oneOf;
    if (anyOrOneOf) {
      const { imports, code } = this.getModelProperty("", schema);
      const allImports = Array.from(new Set(imports));
      return `${allImports.join("")}\n\n export type ${propertyKey} = ${code};`;
    }
    if (!type) {
      throw new Error("unexpected empty type?");
    }
    switch (type) {
      case "string": {
        if (schema.enum) {
          return `export enum ${propertyKey} {${schema.enum.map(
            item => `${item} = "${item}"`
          )}};`;
        }
        return `export type ${propertyKey} = string;`;
      }
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
