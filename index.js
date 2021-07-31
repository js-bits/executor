export { default } from './src/executor.js';
export { default as Receiver } from './src/receiver.js';

console.log(`executor import mode: ${typeof require === 'undefined' ? 'esm' : 'cjs'}`);
