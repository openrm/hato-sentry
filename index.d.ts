import hato from 'hato';
import Sentry from '@sentry/node';

export as namespace hatoSentry;

type Options = { Sentry: typeof Sentry };
declare const Plugin: hato.Plugins.Plugin<Options>;

export = Plugin;
