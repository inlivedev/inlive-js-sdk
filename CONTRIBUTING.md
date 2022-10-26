# Contributing to InLive JavaScript SDK

## Local Setup

Ensure you have already installed [git](https://git-scm.com/), and [npm](https://nodejs.org/en/) in your local machine.

1. Clone this repository to your local machine
2. Navigate to the SDK directory and install the dependencies by using [npm install](https://docs.npmjs.com/cli/v8/commands/npm-install) command
```
npm install
```
3. You can start the local development for the SDK. No build or compile step required.

## Testing

### Unit Test
To categorize the SDK modules with their corresponding test file easily, we always put the test file in the same directory as the tested module. Every test file name is written on this format `[modulename].test.js`

To run the unit test once, you can use this command
```
npm run test
```

To run the unit test on watch mode, you can use this command
```
npm run test:watch
```

## Link to other Projects Locally
To link the SDK in the local machine and use it in another project you can use [npm-link](https://docs.npmjs.com/cli/v8/commands/npm-link) feature.

1. Navigate to the SDK directory and run this command

```
npm link
```

2. Navigate to the project which you want link the SDK with and run this command

```
npm link @inlivedev/inlive-js-sdk
```

3. Note that if the project already has installed an existing SDK from the NPM, you need to change the local SDK `name` field in the `package.json` file in order to link the local SDK to the project. Then, you can run the command above with the exact value of the new `name` field.
