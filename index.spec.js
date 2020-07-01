const sinon = require('sinon');
const assert = require('assert');

const { Client } = require('hato');
const { Encoding, Retry, RPC } = require('hato/plugins');

const Sentry = require('@sentry/node');

const plugin = require('./index');

describe('Sentry', function() {
    let client = null;
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
        return client.close();
    });

    it('Should report any error to Sentry', async function() {
        client = new Client('amqp://guest:guest@127.0.0.1:5672', {
            plugins: [
                new Encoding('json'),
                new plugin({ Sentry })
            ]
        });

        await client.start();

        const spyScope = sandbox.spy(Sentry, 'withScope');
        const spyReport = sandbox.spy(Sentry, 'captureException');


        await client.subscribe('it.always.fails', () => {
            throw new Error('My route somehow have uncaught exception :(');
        });


        await client.publish('it.always.fails', { hello: 'world' });

        await new Promise((resolve) => {
            setTimeout(resolve, 500);
        });

        assert(spyScope.calledOnce);
        assert(spyReport.calledOnce);
    });

    it('Should report any error to Sentry (retry)', async function() {
        this.timeout(4000);

        client = new Client('amqp://guest:guest@127.0.0.1:5672', {
            plugins: [
                new Retry(),
                new RPC(),
                new Encoding('json'),
                new plugin({ Sentry })
            ]
        });

        await client.start();

        const spyScope = sandbox.spy(Sentry, 'withScope');
        const spyReport = sandbox.spy(Sentry, 'captureException');

        await client.subscribe('it.always.fails', () => {
            throw new Error('My route somehow have uncaught exception :(');
        });


        await client.rpc('it.always.fails', { hello: 'world' }).catch(() => {});

        await new Promise((resolve) => {
            setTimeout(resolve, 500);
        });

        assert(spyScope.calledOnce);
        assert(spyReport.calledOnce);
    });
});
