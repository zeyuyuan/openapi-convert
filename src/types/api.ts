import { OpenApiSchema } from "./OpenApi";

export interface SchemaRef {
  $ref: string;
}

export interface RequestBodyContent {
  "application/json": {
    schema: OpenApiSchema;
  };
  // todo support more content types
}

export interface RequestBody {
  content: RequestBodyContent;
}

export interface ResponseContent {
  "application/json": {
    schema: OpenApiSchema;
  };
}

export interface Responses {
  "200": {
    description: string;
    content: ResponseContent;
  };
}

export interface ApiInfo {
  summary: string;
  deprecated: boolean;
  description: string;
  tags: string[];
  // todo  parameters: any[];
  requestBody?: RequestBody;
  responses: Responses;
  // todo  security: any[];
  "x-apifox-folder": string;
  "x-apifox-status": string;
  "x-apifox-maintainer": string;
  "x-run-in-apifox": string;
}
