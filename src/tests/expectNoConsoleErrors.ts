import { expect, vi } from 'vitest';

export const expectNoConsoleErrors = (testBody: () => void): void => {
  const consoleError = vi.spyOn(console, 'error');
  let thrownError: unknown;
  let testBodyThrew = false;

  try {
    testBody();
  } catch (error) {
    thrownError = error;
    testBodyThrew = true;
  }

  const errorCount = consoleError.mock.calls.length;
  consoleError.mockRestore();

  if (testBodyThrew) {
    throw thrownError;
  }

  expect(errorCount).toBe(0);
};
