# Contributing to InLive JavaScript SDK

## Local Setup

Ensure you have already installed [git](https://git-scm.com/), and [npm](https://nodejs.org/en/) in your local machine.

1. Clone this repository to your local machine
2. Navigate to the SDK directory and install the dependencies by using [npm install](https://docs.npmjs.com/cli/v8/commands/npm-install) command
```bash
npm install
```
3. Run the development mode with this command. This will automatically bundle the SDK on every file changes.
```bash
npm run dev
```
4. To run a production build, you can run with this command
```bash
npm run build
```

## Testing

### Unit Test
To categorize the SDK modules with their corresponding test file easily, we always put the test file in the same directory as the tested module. Every test file name is written on this format `[modulename].test.js`

To run the unit test once, you can use this command
```bash
npm run test
```

To run the unit test on watch mode, you can use this command
```
npm run test:watch
```

## Link to other Projects Locally
### Option 1

To link the SDK in the local machine and use it in another project you can use [npm-link](https://docs.npmjs.com/cli/v8/commands/npm-link) feature.

1. Navigate to the SDK directory and run this command

```bash
npm link
```

2. Navigate to the project which you want link the SDK with and run this command

```bash
npm link @inlivedev/inlive-js-sdk
```

3. Note that if the project already has installed an existing SDK from the NPM, you need to change the local SDK `name` field in the `package.json` file in order to link the local SDK to the project. Then, you can run the command above with the exact value of the new `name` field.

### Option 2
The alternative way is by installing the SDK to another local project locally without downloading it from the NPM registry. This approach is similar with the npm-link.

1. Use `npm install` command that points to the SDK local path.

```
npm install @inlivedev/inlive-js-sdk-local@file:../path/to/the/inlive-js-sdk/directory
```

2. The command above will register the `@inlivedev/inlive-js-sdk-local` dependency in the `package.json` that points to the local path of the SDK. The name of the dependency is up to you to decide.

```json
{
  "dependencies": {
    "@inlivedev/inlive-js-sdk-local": "file:../path/to/the/inlive-js-sdk/directory",
  }
}
```

1. And then, you can import the SDK just like usual

```js
import { } from '@inlivedev/inlive-js-sdk-local'
```

By using this approach, you don't need to change the `name` field in the actual SDK `package.json` file.
