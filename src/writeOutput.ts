import { ConverterOutput } from "./types/ConverterOutput";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

/**
 * 将output写入本地
 * @desc node only
 */
export const writeOutputToDisk = async ({ models, apis }: ConverterOutput) => {
  models.forEach(({ files, folderName }) => {
    files.forEach(({ fileName, content }) => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const dir = path.join(__dirname, "/output", "/models", folderName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filePath = path.join(dir, `${fileName}.ts`);
      fs.writeFileSync(filePath, content);
    });
  });

  apis.forEach(({ files, folderName }) => {
    files.forEach(({ fileName, content }) => {
      const dir = path.join(__dirname, "/output", "/apis", folderName);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, `${fileName}.ts`);
      fs.writeFileSync(filePath, content);
    });
  });
};
