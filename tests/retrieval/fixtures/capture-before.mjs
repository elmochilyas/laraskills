import { writeFileSync } from 'node:fs';
import { retrieveAndFormat } from '../../../src/retrieval/index.mjs';

const result = retrieveAndFormat('Build a CRUD REST API for products with policies and pagination', {
  mode: 'standard',
  format: 'json',
});
writeFileSync(new URL('regression-before.json', import.meta.url), result, 'utf-8');
console.log('Captured before-state to regression-before.json');
