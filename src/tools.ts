export const fetchByApi = async (url: string) => {
  // fetch api url
  const res = await fetch(url);
  return res.json();
};

// Corrected version of generateFormDataCode to avoid generating an empty formData.append line
export const generateFormDataCode = (interfaceStr: string): string => {
  // Step 1: Remove curly braces and split by semicolon to get fields
  const fields = interfaceStr
    .slice(1, -1)
    .split(";")
    .filter(field => field.trim()) // Filter out empty fields
    .map(field =>
      field
        .trim()
        .split(":")
        .map(part => part.trim())
    );

  // Step 2: Initialize the output string
  let formDataCode = "";

  // Step 3: Iterate over fields to generate formData.append code
  fields.forEach(([name, type]) => {
    const isOptional = name.endsWith("?");
    const cleanName = isOptional ? name.slice(0, -1) : name; // Remove '?' from name if optional

    if (type === "File" || type === "Blob") {
      formDataCode += `formData.append('${cleanName}', params.${cleanName});\n`;
    } else {
      // Check if the field is optional
      if (isOptional) {
        formDataCode += `if (params.${cleanName} !== undefined) {\n  formData.append('${cleanName}', String(params.${cleanName}));\n}\n`;
      } else {
        formDataCode += `formData.append('${cleanName}', String(params.${cleanName}));\n`;
      }
    }
  });

  // Step 4: Return the generated code
  return formDataCode;
};
