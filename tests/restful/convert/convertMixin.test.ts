import { expect } from '@jest/globals';
import { mixinConvert } from '../../../src/modules/restful/convert/convert';
import { ConvertExpiredType, ConvertSide } from '../../../src/modules/enum';

class FakeBase {
    prepareSignedPath = jest.fn((path: string, params: object) => `${path}?${JSON.stringify(params)}`);
    makeRequest = jest.fn(async (method: string, url: string) => ({ method, url }));
}

const ConvertClient = mixinConvert(FakeBase);

function createClient(): any {
    return new ConvertClient();
}

describe('mixinConvert', () => {
    describe('listAllConvertPairs', () => {
        it('uses an empty params object when no options are given', async () => {
            const client = createClient();
            const res = await client.listAllConvertPairs();
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/exchangeInfo', {});
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/exchangeInfo?{}' });
        });

        it('passes the options through', async () => {
            const client = createClient();
            const res = await client.listAllConvertPairs({ fromAsset: 'BTC' });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/exchangeInfo', { fromAsset: 'BTC' });
            expect(client.makeRequest).toHaveBeenCalledWith('GET', '/sapi/v1/convert/exchangeInfo?{"fromAsset":"BTC"}');
            expect(res.method).toBe('GET');
        });
    });

    describe('getOrderQuantityPrecisionPerAsset', () => {
        it('uses an empty params object when no options are given', async () => {
            const client = createClient();
            const res = await client.getOrderQuantityPrecisionPerAsset();
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/assetInfo', {});
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/assetInfo?{}' });
        });

        it('passes the options through', async () => {
            const client = createClient();
            const res = await client.getOrderQuantityPrecisionPerAsset({ recvWindow: 5000 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/assetInfo', { recvWindow: 5000 });
            expect(res.url).toBe('/sapi/v1/convert/assetInfo?{"recvWindow":5000}');
        });
    });

    describe('sendQuoteRequest', () => {
        it('sends a POST with assets and no options', async () => {
            const client = createClient();
            const res = await client.sendQuoteRequest('BTC', 'USDT');
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/getQuote', { fromAsset: 'BTC', toAsset: 'USDT' });
            expect(res.method).toBe('POST');
            expect(res.url).toContain('/sapi/v1/convert/getQuote');
        });

        it('merges options with the assets', async () => {
            const client = createClient();
            await client.sendQuoteRequest('BTC', 'USDT', { fromAmount: 1 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/getQuote', { fromAmount: 1, fromAsset: 'BTC', toAsset: 'USDT' });
        });

        it('throws when a required parameter is missing', async () => {
            const client = createClient();
            await expect(client.sendQuoteRequest('', 'USDT')).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });

    describe('acceptQuote', () => {
        it('sends a POST with the quoteId', async () => {
            const client = createClient();
            const res = await client.acceptQuote('q1');
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/acceptQuote', { quoteId: 'q1' });
            expect(res).toEqual({ method: 'POST', url: '/sapi/v1/convert/acceptQuote?{"quoteId":"q1"}' });
        });

        it('merges options with the quoteId', async () => {
            const client = createClient();
            await client.acceptQuote('q1', { recvWindow: 1000 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/acceptQuote', { recvWindow: 1000, quoteId: 'q1' });
        });

        it('throws when quoteId is missing', async () => {
            const client = createClient();
            await expect(client.acceptQuote('')).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });

    describe('orderStatus', () => {
        it('uses an empty params object when no options are given', async () => {
            const client = createClient();
            const res = await client.orderStatus();
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/orderStatus', {});
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/orderStatus?{}' });
        });

        it('passes the options through', async () => {
            const client = createClient();
            const res = await client.orderStatus({ orderId: '123' });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/orderStatus', { orderId: '123' });
            expect(res.method).toBe('GET');
        });
    });

    describe('placeLimitOrder', () => {
        it('sends a POST with all required params', async () => {
            const client = createClient();
            const res = await client.placeLimitOrder('BNB', 'USDT', 1, ConvertSide.BUY, ConvertExpiredType.One_Day);
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/placeOrder', {
                baseAsset: 'BNB',
                quoteAsset: 'USDT',
                limitPrice: 1,
                side: 'BUY',
                expiredType: '1_D',
            });
            expect(res.method).toBe('POST');
            expect(res.url).toContain('/sapi/v1/convert/limit/placeOrder');
        });

        it('merges options with the required params', async () => {
            const client = createClient();
            await client.placeLimitOrder('BNB', 'USDT', 2, ConvertSide.SELL, ConvertExpiredType.Seven_Day, { baseAmount: 3 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/placeOrder', {
                baseAmount: 3,
                baseAsset: 'BNB',
                quoteAsset: 'USDT',
                limitPrice: 2,
                side: 'SELL',
                expiredType: '7_D',
            });
        });

        it('throws when a required parameter is missing', async () => {
            const client = createClient();
            await expect(
                client.placeLimitOrder('', 'USDT', 1, ConvertSide.BUY, ConvertExpiredType.One_Day)
            ).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });

    describe('cancelLimitOrder', () => {
        it('sends a POST with the orderId', async () => {
            const client = createClient();
            const res = await client.cancelLimitOrder(42);
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/cancelOrder', { orderId: 42 });
            expect(res).toEqual({ method: 'POST', url: '/sapi/v1/convert/limit/cancelOrder?{"orderId":42}' });
        });

        it('merges options with the orderId', async () => {
            const client = createClient();
            await client.cancelLimitOrder(42, { recvWindow: 2000 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/cancelOrder', { recvWindow: 2000, orderId: 42 });
        });

        it('throws when orderId is missing', async () => {
            const client = createClient();
            await expect(client.cancelLimitOrder(undefined)).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });

    describe('queryLimitOpenOrders', () => {
        it('uses an empty params object when no options are given', async () => {
            const client = createClient();
            const res = await client.queryLimitOpenOrders();
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/queryOpenOrders', {});
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/limit/queryOpenOrders?{}' });
        });

        it('passes the options through', async () => {
            const client = createClient();
            const res = await client.queryLimitOpenOrders({ recvWindow: 900 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/queryOpenOrders', { recvWindow: 900 });
            expect(res.method).toBe('GET');
        });
    });

    describe('getConvertTradeHistory', () => {
        it('sends a GET with the time range', async () => {
            const client = createClient();
            const res = await client.getConvertTradeHistory(1000, 2000);
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/tradeFlow', { startTime: 1000, endTime: 2000 });
            expect(res.method).toBe('GET');
            expect(res.url).toContain('/sapi/v1/convert/tradeFlow');
        });

        it('merges options with the time range', async () => {
            const client = createClient();
            await client.getConvertTradeHistory(1000, 2000, { limit: 10 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/tradeFlow', { limit: 10, startTime: 1000, endTime: 2000 });
        });

        it('throws when a required parameter is missing', async () => {
            const client = createClient();
            await expect(client.getConvertTradeHistory(undefined, 2000)).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });
});
