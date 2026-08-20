import { readFile, writeFile } from 'node:fs/promises';

const input = new URL('./tokens.json', import.meta.url);
const output = new URL('../src/tokens/generated.css', import.meta.url);
const tokens = JSON.parse(await readFile(input, 'utf8'));

const flatten = (value, path = []) =>
  value && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) =>
        child && typeof child === 'object' && 'value' in child
          ? [[`--${[...path, key].join('-')}`, child.value]]
          : flatten(child, [...path, key]),
      )
    : [];

const variables = flatten(tokens)
  .map(([name, value]) => `  ${name}: ${value};`)
  .join('\n');

await writeFile(output, `:root {\n${variables}\n}\n`, 'utf8');
