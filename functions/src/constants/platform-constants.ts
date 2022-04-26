import { getFunctionsConfig } from '../utils/get-functions-config';

const config = getFunctionsConfig().project;
export const projectId = config.id;
export const projectLocation = config.location;
export const functionsLocation = config.functions_location;
export const functionsEndpoint = config.functions_endpoint;
