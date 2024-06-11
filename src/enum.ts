export const covertEnum = (data: any) => {
  console.log(data.properties);

  const lines: any[] = [];
  return `export enum = {
        ${lines.join(" ")}
    }`;
};
