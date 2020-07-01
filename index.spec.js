const sinon = require('sinon');
const assert = require('assert');

const { Client } = require('hato');
const { Encoding, Retry, RPC } = require('hato/plugins');

const Sentry = require('@sentry/node');

const plugin = require('.');

const createTrigger = (times = 1) => {
    let c = 0, inc, completed = new Promise(
        (resolve) => inc = () => ++c >= times && resolve());
    return { inc, completed };
};

describe('Sentry plugin', function() {
    let client = null;
    const sandbox = sinon.createSandbox();

    afterEach(() => {
        sandbox.restore();
        return client && client.close();
    });

    it('should reject if Sentry access point is not provided', () => {
        assert.throws(
            () => new Client('amqp://guest:guest@127.0.0.1:5672', {
                plugins: [new plugin({ Sentry: null })]
            }),
            assert.AssertionError
        );
    });

    it('should report any error to Sentry', async function() {
        client = new Client('amqp://guest:guest@127.0.0.1:5672', {
            plugins: [
                new Encoding('json'),
                new plugin({ Sentry })
            ]
        });

        await client.start();

        const spyScope = sandbox.spy(Sentry, 'withScope');
        const spyReport = sandbox.spy(Sentry, 'captureException');

        const { inc, completed } = createTrigger();

        await client.subscribe('it.always.fails', () => {
            inc();
            throw new Error('My route somehow have uncaught exception :(');
        });

        await client.publish('it.always.fails', { hello: 'world' });

        await completed;

        assert(spyScope.calledOnce);
        assert(spyReport.calledOnce);
    });

    it('should report any error to Sentry (retry)', async function() {
        const retries = 3;

        client = new Client('amqp://guest:guest@127.0.0.1:5672', {
            plugins: [
                new Retry({ min: 5, retries, strategy: 'constant' }),
                new RPC(),
                new Encoding('json'),
                new plugin({ Sentry })
            ]
        });

        await client.start();

        const spyScope = sandbox.spy(Sentry, 'withScope');
        const spyReport = sandbox.spy(Sentry, 'captureException');

        const { inc, completed } = createTrigger(retries + 1);

        await client.subscribe('it.always.fails', () => {
            inc();
            throw new Error('My route somehow have uncaught exception :(');
        });

        await client.rpc('it.always.fails', { hello: 'world' }).catch(() => {});

        await completed;

        assert(spyScope.calledOnce);
        assert(spyReport.calledOnce);
    });
});
