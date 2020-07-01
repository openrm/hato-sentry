#!make

.PHONY: deps test coverage lint lint-fix types

NPM_BIN = ./node_modules/.bin
export NODE_ENV ?= test

node_modules: package.json
	@npm install

deps: node_modules

test:
	@$(NPM_BIN)/mocha "*.spec.js" --exit

coverage:
	@$(NPM_BIN)/nyc -x "*.spec.js" --reporter=lcov --reporter=text-lcov --reporter=text $(MAKE) -s test

lint:
	@$(NPM_BIN)/eslint index.js index.spec.js

lint-fix:
	@$(NPM_BIN)/eslint index.js index.spec.js --fix

types:
	@$(NPM_BIN)/tsc -p .
