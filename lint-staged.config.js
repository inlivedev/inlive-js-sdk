export default {
  '!(*test).js': ['tsc-files --noEmit', 'npm run lint', 'npm run prettier'],
  '*test.js': ['npm run lint', 'npm run prettier'],
}
