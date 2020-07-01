const assert = require('assert');

const Plugin = require('hato/plugins/base');
const { constants: { Scopes: { API } } } = require('hato');

module.exports = class extends Plugin {

    constructor(options = {}) {
        assert(options.Sentry, '[hato:sentry] `Sentry` option property must be defined');

        super('sentry');

        this.Sentry = options.Sentry;
    }

    init() {
        this.scopes[API] = this.reportError();
    }

    reportError() {
        const plugin = this;

        return (constructor) => class extends constructor {

            consume(queue, fn, options) {
                return super.consume(queue, fn, options)
                    .on('error', (err, msg) => {
                        plugin.Sentry.withScope((scope) => {
                            try {
                                scope.setTag('exchange', msg.fields.exchange);
                                scope.setTag('routing_key', msg.fields.routingKey);

                                const content = Buffer.isBuffer(msg.content) ?
                                    msg.content.toString() : msg.content;
                                scope.setContext('message', { ...msg, content });
                            } finally {
                                plugin.Sentry.captureException(err);
                            }
                        });
                    });
            }

        };
    }

};
