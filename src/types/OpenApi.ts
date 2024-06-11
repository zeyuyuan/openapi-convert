export interface OpenApiProperty {
  type?: "string" | "integer" | "array";
  $ref?: string;
  items?: OpenApiProperty[];
}

export interface OpenApiSchema {
  type: "string" | "integer" | "array" | "object";
  properties?: Record<string, OpenApiSchema>; //object
  items?: OpenApiSchema[]; //  array
  $ref?: string; // reference to other scheme
  "x-apifox-orders": string[];
  required?: string[]; // object
  "x-apifox-ignore-properties": string[];
  "x-apifox-folder": string;
}

export interface OpenApiComponents {
  schemas: Record<string, OpenApiSchema>;
}

export interface OpenApi {
  oepnapi: string;
  components: OpenApiComponents;
}
