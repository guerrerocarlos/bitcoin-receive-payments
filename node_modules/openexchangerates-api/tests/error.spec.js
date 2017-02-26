/**
 * Created by manifold on 20.12.2014.
 */
var RatesApiError = require("./../lib/error");

describe("RatesApiError", function () {
    it('should be available as constructor', function () {
        expect(function () {
            var err = new RatesApiError('error desc', {data: 'bar'});
        }).not.toThrow();
    });
});