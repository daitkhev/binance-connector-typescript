import { expect } from '@jest/globals';
import { mixinConvert } from '../../../src/modules/restful/convert/convert';
import { ConvertExpiredType, ConvertSide } from '../../../src/modules/enum';

class FakeBase {
    prepareSignedPath = jest.fn((path: string, params: object) => `${path}?${JSON.stringify(params)}`);
    makeRequest = jest.fn(async (method: string, url: string) => ({ method, url }));
}

const Client = mixinConvert(FakeBase);

describe('mixinConvert', () => {
    let client: InstanceType<typeof Client> & FakeBase;

    beforeEach(() => {
        client = new Client() as any;
    });

    describe('GET endpoints without required parameters', () => {
        const cases: [string, string][] = [
            ['listAllConvertPairs', '/sapi/v1/convert/exchangeInfo'],
            ['getOrderQuantityPrecisionPerAsset', '/sapi/v1/convert/assetInfo'],
            ['orderStatus', '/sapi/v1/convert/orderStatus'],
            ['queryLimitOpenOrders', '/sapi/v1/convert/limit/queryOpenOrders'],
        ];

        it.each(cases)('%s uses an empty object when no options given', async (name, path) => {
            const res = await (client as any)[name]();
            expect(client.prepareSignedPath).toHaveBeenCalledWith(path, {});
            expect(client.makeRequest).toHaveBeenCalledWith('GET', `${path}?{}`);
            expect(res).toEqual({ method: 'GET', url: `${path}?{}` });
        });

        it.each(cases)('%s passes the given options through', async (name, path) => {
            const res = await (client as any)[name]({ recvWindow: 5000 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith(path, { recvWindow: 5000 });
            expect(res).toEqual({ method: 'GET', url: `${path}?{"recvWindow":5000}` });
        });
    });

    describe('sendQuoteRequest', () => {
        it('sends a POST with merged params', async () => {
            const res = await client.sendQuoteRequest('BTC', 'USDT', { fromAmount: 1 } as any);
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/getQuote', {
                fromAmount: 1,
                fromAsset: 'BTC',
                toAsset: 'USDT',
            });
            expect(res).toEqual({
                method: 'POST',
                url: '/sapi/v1/convert/getQuote?{"fromAmount":1,"fromAsset":"BTC","toAsset":"USDT"}',
            });
        });

        it('works without options', async () => {
            await client.sendQuoteRequest('BTC', 'USDT');
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/getQuote', {
                fromAsset: 'BTC',
                toAsset: 'USDT',
            });
        });

        it('throws when a required parameter is missing', async () => {
            await expect(client.sendQuoteRequest('', 'USDT')).rejects.toThrow('Missing Parameters');
            await expect(client.sendQuoteRequest('BTC', '')).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });

    describe('acceptQuote', () => {
        it('sends a POST with the quoteId', async () => {
            const res = await client.acceptQuote('q1', { recvWindow: 1000 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/acceptQuote', {
                recvWindow: 1000,
                quoteId: 'q1',
            });
            expect(res).toEqual({
                method: 'POST',
                url: '/sapi/v1/convert/acceptQuote?{"recvWindow":1000,"quoteId":"q1"}',
            });
        });

        it('works without options', async () => {
            await client.acceptQuote('q1');
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/acceptQuote', { quoteId: 'q1' });
        });

        it('throws when quoteId is missing', async () => {
            await expect(client.acceptQuote('')).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });

    describe('placeLimitOrder', () => {
        it('sends a POST with all params', async () => {
            const res = await client.placeLimitOrder('BNB', 'USDT', 1, ConvertSide.BUY, ConvertExpiredType.One_Day, { baseAmount: 2 } as any);
            const expected = {
                baseAmount: 2,
                baseAsset: 'BNB',
                quoteAsset: 'USDT',
                limitPrice: 1,
                side: ConvertSide.BUY,
                expiredType: ConvertExpiredType.One_Day,
            };
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/placeOrder', expected);
            expect(res).toEqual({
                method: 'POST',
                url: `/sapi/v1/convert/limit/placeOrder?${JSON.stringify(expected)}`,
            });
        });

        it('works without options', async () => {
            await client.placeLimitOrder('BNB', 'USDT', 1, ConvertSide.SELL, ConvertExpiredType.One_Day);
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/placeOrder', {
                baseAsset: 'BNB',
                quoteAsset: 'USDT',
                limitPrice: 1,
                side: ConvertSide.SELL,
                expiredType: ConvertExpiredType.One_Day,
            });
        });

        it('throws when a required parameter is missing', async () => {
            await expect(
                client.placeLimitOrder('', 'USDT', 1, ConvertSide.BUY, ConvertExpiredType.One_Day)
            ).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });

    describe('cancelLimitOrder', () => {
        it('sends a POST with orderId', async () => {
            const res = await client.cancelLimitOrder(42, { recvWindow: 1000 });
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/cancelOrder', {
                recvWindow: 1000,
                orderId: 42,
            });
            expect(res).toEqual({
                method: 'POST',
                url: '/sapi/v1/convert/limit/cancelOrder?{"recvWindow":1000,"orderId":42}',
            });
        });

        it('works without options', async () => {
            await client.cancelLimitOrder(42);
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/limit/cancelOrder', { orderId: 42 });
        });

        it('throws when orderId is missing', async () => {
            await expect(client.cancelLimitOrder(undefined as any)).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });

    describe('getConvertTradeHistory', () => {
        it('sends a GET with start and end time', async () => {
            const res = await client.getConvertTradeHistory(1, 2, { limit: 10 } as any);
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/tradeFlow', {
                limit: 10,
                startTime: 1,
                endTime: 2,
            });
            expect(res).toEqual({
                method: 'GET',
                url: '/sapi/v1/convert/tradeFlow?{"limit":10,"startTime":1,"endTime":2}',
            });
        });

        it('works without options', async () => {
            await client.getConvertTradeHistory(1, 2);
            expect(client.prepareSignedPath).toHaveBeenCalledWith('/sapi/v1/convert/tradeFlow', {
                startTime: 1,
                endTime: 2,
            });
        });

        it('throws when a required parameter is missing', async () => {
            await expect(client.getConvertTradeHistory(undefined as any, 2)).rejects.toThrow('Missing Parameters');
            await expect(client.getConvertTradeHistory(1, undefined as any)).rejects.toThrow('Missing Parameters');
            expect(client.makeRequest).not.toHaveBeenCalled();
        });
    });
});
