const assert = require('assert');

const Plugin = require('hato/plugins/base');
const { Scopes: { API } } = require('hato/lib/constants');

module.exports = class extends Plugin {

    constructor(options = {}) {
        assert(options.Sentry, '[hato-sentry] "Sentry" option property must be defined');

        super('retry-sentry');

        this.options = options;
    }

    init() {
        this.scopes[API] = this.handlePubsub();
    }

    /** @return {(original: ConstructorOf<ContextChannel>) => ConstructorOf<ContextChannel>} */
    handlePubsub() {
        const plugin = this;

        return (constructor) => class extends constructor {

            consume(queue, fn, options) {
                return super.consume(queue, fn, options)
                    .on('error', (err, msg) => {
                        plugin.options.Sentry.withScope((scope) => {
                            scope.setExtras(msg.content);
                            plugin.options.Sentry.captureException(err);
                        });
                    });
            }

        };
    }

};
