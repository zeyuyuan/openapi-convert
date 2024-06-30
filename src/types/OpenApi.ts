import { ApiInfo } from "./api";

export interface OpenApiProperty {
  type?: "string" | "integer" | "array";
  $ref?: string;
  items?: OpenApiProperty[];
}

export interface OpenApiSchema {
  type?: "string" | "integer" | "boolean" | "number" | "array" | "object";
  properties?: Record<string, OpenApiSchema>; //object
  items?: OpenApiSchema; //  array
  $ref?: string; // reference to other scheme
  anyOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  enum?: string[];
  "x-apifox-orders"?: string[];
  required?: string[]; // object
  "x-apifox-ignore-properties"?: string[];
  "x-apifox-folder"?: string;
}

export interface OpenApiComponents {
  schemas: Record<string, OpenApiSchema>;
}

export enum Method {
  get = "get",
  post = "post",
  put = "put",
  delete = "delete",
}

export type OpenApiPath = Record<Method, ApiInfo>;

export interface OpenApi {
  oepnapi: string;
  components: OpenApiComponents;
  paths: Record<string, OpenApiPath>;
}
