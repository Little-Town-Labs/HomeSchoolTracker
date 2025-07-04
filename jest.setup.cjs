// Import Jest DOM extensions
require('@testing-library/jest-dom');

// Mock global objects that might not be available in the test environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock import.meta.env for Vite environment variables
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_SUPABASE_URL: 'mock-supabase-url',
      VITE_SUPABASE_ANON_KEY: 'mock-supabase-anon-key',
      // Add other environment variables used in your code here if needed
    },
  },
  writable: true, // Ensure it can be modified if needed later
});

// Mock matchMedia if it doesn't exist
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };
}

// Setup for React 18 createRoot
if (typeof document !== 'undefined') {
  // Save original createElement
  const originalCreateElement = document.createElement;
  
  // Mock createElement to ensure it returns a valid DOM element
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    // Ensure the element has all the properties React expects
    if (!element.style) {
      element.style = {};
    }
    
    // Ensure appendChild exists and works
    const originalAppendChild = element.appendChild;
    element.appendChild = function(child) {
      return originalAppendChild ? originalAppendChild.call(this, child) : null;
    };
    
    return element;
  };
  
  // Mock document.createRange for createContextualFragment
  if (!document.createRange) {
    document.createRange = () => ({
      setStart: () => {},
      setEnd: () => {},
      commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
      },
      createContextualFragment: (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.children[0];
      },
    });
  }
  
  // Ensure document.body exists
  if (!document.body) {
    const body = document.createElement('body');
    document.body = body;
  }
}

// Ensure a root element exists for React Testing Library
if (typeof document !== 'undefined' && !document.getElementById('root')) {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
}

// Mock for createRoot
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  }));
}

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
     args[0].includes('Warning: React.createElement') ||
     args[0].includes('Warning: An update to') ||
     args[0].includes('Warning: validateDOMNesting'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Suppress console warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: React does not recognize') ||
     args[0].includes('Warning: The tag'))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};
