import { convertSchema } from "./schema";
import { OpenApi } from "./types/OpenApi";

const API_URL =
  "http://127.0.0.1:4523/export/openapi?projectId=1826684&specialPurpose=openapi-generator";

// model按照文件夹分类
export const covert = async (json: OpenApi) => {
  // fetch api url
  // const res = await fetch(API_URL);
  // const json = await res.json();
  // const data = json.data;
  // const apiUrls = json.paths;
  const schemas = json.components.schemas;

  // 1.先将models转换按文件夹分类的数据结构
  // models文件夹结构
  const modelFolders = new Map();
  Object.keys(schemas).forEach(item => {
    const target = schemas[item];
    const folder = target["x-apifox-folder"];
    if (!modelFolders.has(folder)) {
      modelFolders.set(folder, {
        folder,
        files: [],
      });
    }
    const file = {
      name: item,
      code: "",
    };
    file.code = convertSchema(item, target);
    modelFolders.get(folder).files.push(file);
  });
  console.log("======result====");
  return JSON.stringify(Object.fromEntries(modelFolders), null, 2);
};
