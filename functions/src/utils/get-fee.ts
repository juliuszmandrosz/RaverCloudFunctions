import {getParameterFromRemoteConfig} from "./remote-config-utils";
import {feeAmount} from "../constants/remote-config-params";

export async function getFee(price: number) {
    const fee = await getParameterFromRemoteConfig(feeAmount);
    return price * parseFloat(fee);
}