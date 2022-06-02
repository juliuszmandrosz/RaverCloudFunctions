import { getParameterFromRemoteConfig } from '../remote-config-utils';
import { clubFeeAmount } from '../../constants/remote-config-params';

export async function getClubFee(price: number) {
    const fee = await getParameterFromRemoteConfig(clubFeeAmount);
    return price * parseFloat(fee);
}
