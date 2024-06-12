export interface OutputFile {
  fileName: string;
  content: string;
}

export interface OutputFolder {
  folderName: string;
  files: OutputFile[];
}

export interface ConverterOutput {
  models: OutputFolder[];
  apis: OutputFolder[];
}
