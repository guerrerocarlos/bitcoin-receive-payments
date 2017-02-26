var nock = require('nock');
var RatesApi = require("./../lib/index");

describe("RatesApi", function () {
    var client;
    //nock.recorder.rec();
    function createClient() {
        return new RatesApi({
            apiBase: 'openexchangerates.org/api',
            appId: 'APP_ID'
        });
    }

    beforeEach(function () {
        nock.disableNetConnect();
        client = createClient();
    });

    it("should expose RatesApi(options)", function () {
        expect(function () {
            createClient();
        }).not.toThrow();
    });

    it('should query for currencies', function () {
        var currencies;
        var isResolved = false;
        var api = nock('https://openexchangerates.org/api//')
            .get('currencies.json')
            .replyWithFile(200, __dirname + '/test_data/currencies.json');
        runs(function () {
            client.currencies(function handleCurrencies(err, data) {
                currencies = data;
                isResolved = true;
            });
        });
        waitsFor(function () {
            return isResolved;
        }, "The currencies should be resolved", 100);

        runs(function () {
            expect(api.isDone()).toBeTruthy();
            expect(currencies.USD).toEqual('United States Dollar');
        });
    });

    it('should query for latest USD rate', function () {
        var latestRate;
        var isResolved = false;
        var api = nock('https://openexchangerates.org/api//')
            .get('latest.json?base=USD&app_id=APP_ID')
            .replyWithFile(200, __dirname + '/test_data/latest.json');
        runs(function () {
            expect(function () {
                client.latest({base: 'USD'}, function handleLatest(err, data) {
                    latestRate = data;
                    isResolved = true;
                });
            }).not.toThrow();
        });
        waitsFor(function () {
            return isResolved;
        }, "Latest USD rate should be resolved", 100);

        runs(function () {
            expect(api.isDone()).toBeTruthy();
            expect(latestRate.base).toEqual('USD');
            expect(latestRate.rates.EUR).toBeGreaterThan(0);
        });
    });

    it('should query for historical rates for 21 feb 2014', function () {
        var historical;
        var isResolved = false;
        var api = nock('https://openexchangerates.org/api//')
            .get('historical/2014-02-21.json?app_id=APP_ID')
            .replyWithFile(200, __dirname + '/test_data/historical-2014-01-21.json');
        runs(function () {
            expect(function () {
                client.historical(new Date(2014, 1, 21), function handleHistorical(err, data) {
                    historical = data;
                    isResolved = true;
                });
            }).not.toThrow();
        });
        waitsFor(function () {
            return isResolved;
        }, "Historical rate should be resolved", 100);

        runs(function () {
            expect(api.isDone()).toBeTruthy();
            expect(historical.rates.USD).toBeGreaterThan(0);
            expect(historical.rates.EUR).toBeGreaterThan(0);
            expect(historical.rates.RUB).toBeGreaterThan(0);
        });
    });

    it('should query for historical USD,AUD,CAD rate series', function () {
        var start = new Date(2012, 1, 1);
        var end = new Date(2012, 1, 2);
        var options = {symbols: 'USD,AUD,CAD'};
        var series;
        var isResolved = false;
        var api = nock('https://openexchangerates.org/api//')
            .get('time-series.json?symbols=USD%2CAUD%2CCAD&start=2012-02-01&end=2012-02-02&app_id=APP_ID')
            .replyWithFile(200, __dirname + '/test_data/time-series.json');
        runs(function () {
            expect(function () {
                client.timeSeries(start, end, options, function handleTimeSeries(err, data) {
                    series = data;
                    isResolved = true;
                });
            }).not.toThrow();
        });
        waitsFor(function () {
            return isResolved;
        }, "historical rates should be resolved", 100);

        runs(function () {
            expect(api.isDone()).toBeTruthy();
            expect(series.rates['2012-01-01'].USD).toBeGreaterThan(1);
            expect(series.rates['2012-01-02'].USD).toBeGreaterThan(1);
        });

    });

    it('should convert EUR to USD', function () {
        var converted;
        var isResolved = false;
        var api = nock('https://openexchangerates.org/api//')
            //.log(console.log)
            .get('convert/100/EUR/USD?app_id=APP_ID')
            .replyWithFile(200, __dirname + '/test_data/conversion.json');
        runs(function () {
            expect(function () {
                client.convert(100, 'EUR', 'USD', function handleResult(err, data) {
                    converted = data;
                    isResolved = true;
                });
            }).not.toThrow();
        });
        waitsFor(function () {
            return isResolved;
        }, "The conversion should be resolved", 100);

        runs(function () {
            expect(api.isDone()).toBeTruthy();
            expect(converted.response).toBeGreaterThan(200);
        });
    });
});