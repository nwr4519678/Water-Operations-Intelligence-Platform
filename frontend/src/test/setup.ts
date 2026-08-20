import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';
beforeEach(() => { localStorage.clear(); window.history.pushState({}, '', '/'); document.documentElement.removeAttribute('data-theme'); document.documentElement.dir = ''; });
