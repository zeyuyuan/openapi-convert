import { ConverterOutput } from "./types/ConverterOutput";
import fs from "fs";
import path from "path";

/**
 * 将output写入本地
 * @desc node only
 */
export const writeOutputToDisk = async (
  { models, apis }: ConverterOutput,
  dirPath: string
) => {
  models.forEach(({ files, folderName }) => {
    files.forEach(({ fileName, content }) => {
      const dir = path.join(dirPath, "/models", folderName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filePath = path.join(dir, `${fileName}.ts`);
      fs.writeFileSync(filePath, content);
    });
  });

  apis.forEach(({ files, folderName }) => {
    files.forEach(({ fileName, content }) => {
      const dir = path.join(dirPath, "/apis", folderName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, `${fileName}.ts`);
      fs.writeFileSync(filePath, content);
    });
  });
};
