import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Test süresini 30 saniyeye çıkar
jest.setTimeout(30000);

// Test kütüphanesini yapılandır
configure({
  testIdAttribute: 'data-testid',
  // Diğer yapılandırmalar...
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
