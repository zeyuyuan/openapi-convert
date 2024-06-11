import { OpenApiSchema } from "./types/OpenApi";

export const convertProperty = (key: string, schema: OpenApiSchema): string => {
  const { type, $ref, properties, required } = schema;
  if ($ref) {
    return "todo ref";
  }
  const isRequired = required?.includes(key) || false;
  const base = `${key}${isRequired ? "" : "?"}: `;
  let value: string = "";
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
    case "object":
      value = "todo object";
      break;
    default: {
      value = `todo unknown ${type}`;
    }
  }
  return `${base}${value};`;
};

export const convertSchema = (key: string, schema: OpenApiSchema): string => {
  const { type, $ref, properties } = schema;
  if ($ref) {
    return "todo ref";
  }
  switch (type) {
    case "string":
      return `export type ${key} = string;`;
    case "integer":
      return `export type ${key} = number;`;
    case "array":
      return "todo array";
    case "object": {
      let lines: string[] = [];
      if (properties) {
        lines = Object.keys(properties).map(key =>
          convertProperty(key, properties[key])
        );
      }
      return `export interface ${key} {${lines.join("")}}`;
    }
    default: {
      return `todo unknown ${type}`;
    }
  }
};
