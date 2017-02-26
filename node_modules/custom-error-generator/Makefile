lint:
	./node_modules/.bin/jshint ./error.js

test:
	@$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/mocha -u tdd \
		--require blanket
		--reporter spec

test-cov:
	@$(MAKE) lint
	@NODE_ENV=test ./node_modules/.bin/mocha -u tdd \
		--require blanket \
		--reporter travis-cov

test-codeclimate:
	@NODE_ENV=test ./node_modules/.bin/mocha -u tdd \
		--require blanket \
		--reporter mocha-lcov-reporter \
	| CODECLIMATE_REPO_TOKEN=adf6c7b92f4cf913d8c42e7add4f1d37352502cb782aab49e51ef1e577b114ac ./node_modules/.bin/codeclimate

test-coveralls:
	@NODE_ENV=test YOURPACKAGE_COVERAGE=1 ./node_modules/.bin/mocha -u tdd \
		--require blanket \
		--reporter mocha-lcov-reporter \
	| ./node_modules/coveralls/bin/coveralls.js

test-all: test test-cov test-coveralls

.PHONY: test
