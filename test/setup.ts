import { afterEach, beforeEach, vi } from 'vitest';
import { runtimeConfig } from '../src/config';
import { dismissTooltip } from '../src/index';
import { cleanup, settle } from './helpers';

const defaults = structuredClone(runtimeConfig);

// Tipsy's timing runs on a clock the tests move, so no result depends on how busy the machine is.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
});

afterEach(async () => {
  cleanup();
  dismissTooltip();
  await settle();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Object.assign(runtimeConfig, structuredClone(defaults), { getDelay: undefined });
});
