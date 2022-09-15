import hato from 'hato';
import Sentry from '@sentry/node';

export as namespace SentryPlugin

type Sentry = typeof Sentry

declare class SentryPlugin extends hato.Plugin {
    constructor({ Sentry }: { Sentry: Sentry })
}

export = SentryPlugin;