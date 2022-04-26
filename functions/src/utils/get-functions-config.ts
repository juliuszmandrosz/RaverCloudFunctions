import { env } from '../index';
import { FunctionsConfig } from '../interfaces/functions-config';

export function getFunctionsConfig() {
    return env as FunctionsConfig;
}
