import Ajv from "ajv"

const ajv = new Ajv();

export const isValidTool = (tool, toolsList) => {
  const toolFound = toolsList.tools.find(t => t.name === tool.function.name);

  if (!toolFound) {
    throw new Error(`Tool ${toolReponse.name} not found.`);
  }

  const validate = ajv.compile(toolFound.inputSchema);
  const isValid = validate(tool.function.arguments);

  console.log(isValid)
  return isValid
}