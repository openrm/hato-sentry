# hato-sentry

Report errors happening in hato using an existing Sentry module

## install

```js
npm i hato-sentry
```

## usage

Init your hato client instance as usual, including the plugin in the plugins list:


```js

const { Client } = require("hato");
const SentryPlugin = require("hato-sentry");

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: '__DSN__',
  // ...
});

const client = new Client('__AMQP_CONN_STRING__', {
    plugins: [
        new SentryPlugin({ Sentry })
    ]
});


```