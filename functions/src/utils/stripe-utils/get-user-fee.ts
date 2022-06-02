import { getParameterFromRemoteConfig } from '../remote-config-utils';
import { userFeeAmount } from '../../constants/remote-config-params';

export async function getUserFee(price: number) {
    const fee = await getParameterFromRemoteConfig(userFeeAmount);
    return price * parseFloat(fee);
}
