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
                            scope.setLevel('error');
                            try {
                                plugin.addData(scope, msg);
                            } finally {
                                plugin.Sentry.captureException(err);
                            }
                        });
                    });
            }

        };
    }

    addData(scope, msg) {
        const {
            fields,
            properties
        } = msg;

        scope.setTag('exchange', fields.exchange);
        scope.setTag('routing_key', fields.routingKey);
        scope.setTag('redelivered', fields.redelivered);
        scope.setTag('consumer_tag', fields.consumerTag);

        const content = Buffer.isBuffer(msg.content) ?
            msg.content.toString() : msg.content;

        scope.setContext('message', { fields, content, properties });
    }

};
