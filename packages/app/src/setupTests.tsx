import React from 'react';
import { I18nextProvider } from 'react-i18next';
/* Polyfills for browser APIs in Node.js test environment */
import { TextDecoder, TextEncoder } from 'util';
import { ClickUIProvider } from '@clickhouse/click-ui';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { render } from '@testing-library/react';
import structuredClone from '@ungap/structured-clone';

import testI18n from './i18n/test-i18n';

import '@testing-library/jest-dom';
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

/* Mocks for mantine */
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;
// jsdom has no scrollIntoView, and Mantine's Combobox calls it on the active
// option when a dropdown opens — from a setTimeout, so the resulting TypeError
// surfaces as an unrelated async test failure.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}
Object.defineProperty(window, 'matchMedia', {
  value: () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
});

global.TestProviders = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={testI18n}>
    <MantineProvider>
      <ClickUIProvider theme="dark" persistTheme={false}>
        <Notifications />
        {children}
      </ClickUIProvider>
    </MantineProvider>
  </I18nextProvider>
);

global.renderWithMantine = (ui: React.ReactElement) => {
  return render(<TestProviders>{ui}</TestProviders>);
};

if (!globalThis.structuredClone) {
  // @ts-expect-error this is a correct polyfill
  globalThis.structuredClone = structuredClone;
}

declare global {
  function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render>;
  // `var`, not `const`, so the global assignment above passes type-check
  var TestProviders: React.FC<{ children: React.ReactNode }>;
}
