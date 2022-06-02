import { getParameterFromRemoteConfig } from '../remote-config-utils';
import { serviceFee } from '../../constants/remote-config-params';

export async function getServiceFeeAmount(price: number, currency: string) {
    const fee = await getParameterFromRemoteConfig(serviceFee);
    const minFeeAmount = getMinimalFeeAmount(currency);
    return minFeeAmount + price * parseFloat(fee);
}

function getMinimalFeeAmount(currency: string) {
    if (currency.toUpperCase() === 'PLN') {
        return 1;
    }

    return 0;
}
