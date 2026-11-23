/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect } from '@jest/globals';
import { mixinConvert } from '../../../src/modules/restful/convert/convert';
import { ConvertExpiredType, ConvertSide } from '../../../src/modules/enum';

class FakeBase {
    prepareSignedPath(path: string, params: any): string {
        return `${path}?${JSON.stringify(params)}`;
    }

    async makeRequest(method: string, url: string): Promise<any> {
        return { method, url };
    }
}

const ConvertClient = mixinConvert(FakeBase as any);

describe('mixinConvert', () => {
    const client: any = new (ConvertClient as any)();

    describe('listAllConvertPairs', () => {
        it('uses empty params without options', async () => {
            const res = await client.listAllConvertPairs();
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/exchangeInfo?{}' });
        });

        it('passes options through', async () => {
            const res = await client.listAllConvertPairs({ fromAsset: 'BTC' });
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/exchangeInfo?{"fromAsset":"BTC"}' });
        });
    });

    describe('getOrderQuantityPrecisionPerAsset', () => {
        it('uses empty params without options', async () => {
            const res = await client.getOrderQuantityPrecisionPerAsset();
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/assetInfo?{}' });
        });

        it('passes options through', async () => {
            const res = await client.getOrderQuantityPrecisionPerAsset({ recvWindow: 5000 });
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/assetInfo?{"recvWindow":5000}' });
        });
    });

    describe('sendQuoteRequest', () => {
        it('posts required params without options', async () => {
            const res = await client.sendQuoteRequest('BTC', 'USDT');
            expect(res).toEqual({
                method: 'POST',
                url: '/sapi/v1/convert/getQuote?{"fromAsset":"BTC","toAsset":"USDT"}',
            });
        });

        it('merges options with required params', async () => {
            const res = await client.sendQuoteRequest('BTC', 'USDT', { fromAmount: 2 });
            expect(res).toEqual({
                method: 'POST',
                url: '/sapi/v1/convert/getQuote?{"fromAmount":2,"fromAsset":"BTC","toAsset":"USDT"}',
            });
        });

        it('throws when a required param is empty', async () => {
            await expect(client.sendQuoteRequest('', 'USDT')).rejects.toThrow('Missing Parameters');
            await expect(client.sendQuoteRequest('BTC', '')).rejects.toThrow('Missing Parameters');
        });
    });

    describe('acceptQuote', () => {
        it('posts quoteId without options', async () => {
            const res = await client.acceptQuote('q1');
            expect(res).toEqual({ method: 'POST', url: '/sapi/v1/convert/acceptQuote?{"quoteId":"q1"}' });
        });

        it('merges options', async () => {
            const res = await client.acceptQuote('q1', { recvWindow: 1000 });
            expect(res).toEqual({
                method: 'POST',
                url: '/sapi/v1/convert/acceptQuote?{"recvWindow":1000,"quoteId":"q1"}',
            });
        });

        it('throws when quoteId is empty', async () => {
            await expect(client.acceptQuote('')).rejects.toThrow('Missing Parameters');
        });
    });

    describe('orderStatus', () => {
        it('uses empty params without options', async () => {
            const res = await client.orderStatus();
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/orderStatus?{}' });
        });

        it('passes options through', async () => {
            const res = await client.orderStatus({ orderId: '123' });
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/orderStatus?{"orderId":"123"}' });
        });
    });

    describe('placeLimitOrder', () => {
        const expectedParams =
            '"baseAsset":"BNB","quoteAsset":"USDT","limitPrice":1,"side":"BUY","expiredType":"1_D"';

        it('posts required params without options', async () => {
            const res = await client.placeLimitOrder('BNB', 'USDT', 1, ConvertSide.BUY, ConvertExpiredType.One_Day);
            expect(res).toEqual({
                method: 'POST',
                url: `/sapi/v1/convert/limit/placeOrder?{${expectedParams}}`,
            });
        });

        it('merges options', async () => {
            const res = await client.placeLimitOrder('BNB', 'USDT', 1, ConvertSide.BUY, ConvertExpiredType.One_Day, { baseAmount: 5 });
            expect(res).toEqual({
                method: 'POST',
                url: `/sapi/v1/convert/limit/placeOrder?{"baseAmount":5,${expectedParams}}`,
            });
        });

        it('throws when a required param is missing', async () => {
            await expect(
                client.placeLimitOrder('', 'USDT', 1, ConvertSide.BUY, ConvertExpiredType.One_Day)
            ).rejects.toThrow('Missing Parameters');
            await expect(
                client.placeLimitOrder('BNB', 'USDT', undefined, ConvertSide.BUY, ConvertExpiredType.One_Day)
            ).rejects.toThrow('Missing Parameters');
        });
    });

    describe('cancelLimitOrder', () => {
        it('posts orderId without options', async () => {
            const res = await client.cancelLimitOrder(42);
            expect(res).toEqual({ method: 'POST', url: '/sapi/v1/convert/limit/cancelOrder?{"orderId":42}' });
        });

        it('merges options', async () => {
            const res = await client.cancelLimitOrder(42, { recvWindow: 3000 });
            expect(res).toEqual({
                method: 'POST',
                url: '/sapi/v1/convert/limit/cancelOrder?{"recvWindow":3000,"orderId":42}',
            });
        });

        it('throws when orderId is empty', async () => {
            await expect(client.cancelLimitOrder(undefined)).rejects.toThrow('Missing Parameters');
        });
    });

    describe('queryLimitOpenOrders', () => {
        it('uses empty params without options', async () => {
            const res = await client.queryLimitOpenOrders();
            expect(res).toEqual({ method: 'GET', url: '/sapi/v1/convert/limit/queryOpenOrders?{}' });
        });

        it('passes options through', async () => {
            const res = await client.queryLimitOpenOrders({ recvWindow: 500 });
            expect(res).toEqual({
                method: 'GET',
                url: '/sapi/v1/convert/limit/queryOpenOrders?{"recvWindow":500}',
            });
        });
    });

    describe('getConvertTradeHistory', () => {
        it('gets history without options', async () => {
            const res = await client.getConvertTradeHistory(1000, 2000);
            expect(res).toEqual({
                method: 'GET',
                url: '/sapi/v1/convert/tradeFlow?{"startTime":1000,"endTime":2000}',
            });
        });

        it('merges options', async () => {
            const res = await client.getConvertTradeHistory(1000, 2000, { limit: 10 });
            expect(res).toEqual({
                method: 'GET',
                url: '/sapi/v1/convert/tradeFlow?{"limit":10,"startTime":1000,"endTime":2000}',
            });
        });

        it('throws when a time is empty', async () => {
            await expect(client.getConvertTradeHistory(undefined, 2000)).rejects.toThrow('Missing Parameters');
            await expect(client.getConvertTradeHistory(1000, undefined)).rejects.toThrow('Missing Parameters');
        });
    });
});
