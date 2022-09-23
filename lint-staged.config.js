export default {
  '!(*test).js': [
    () => 'npm run typecheck',
    'npm run lint',
    'npm run prettier',
  ],
  '*test.js': ['npm run lint', 'npm run prettier'],
}
