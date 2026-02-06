# Cumulocity DTM Smart Functions

This repository is meant as a workspace to develop, test, and package smart functions for Cumulocity Digital Twin Manager (DTM). It contains a default implementation for an `onMessage` smart function that transforms device measurements into asset measurements based on linked series configuration on the asset.

The `dtm:onmessage:dataonassets` smart function only supports measurements (no alarms, events, or other data types). It is configured using the `src/onmessage.fn.yaml` file and implemented in `src/onmessage.fn.ts`. In addition, unit tests are provided in `src/onmessage.spec.ts` to validate the function behavior.

For running tests, the `dtm/SmartFunctionsRunner` utility is provided to execute smart functions in an isolated sandbox environment, simulating the DTM runtime. The `SmartFunctionsRunner` does not support all production limitations, such as CPU and memory constraints, but it ensures that the function code runs in a sandboxed context without access to the host environment and with limited global objects.
 
## Installation and Setup

The project requires [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) to be installed for building, testing, and packaging the smart functions.

Install dependencies:

```bash
npm install
```

See [Packaging](#packaging) section for building and packaging the smart functions for deployment to Cumulocity.

## Project Structure

The relevant project files and directories are organized as follows:

```
src/
  *.fn.ts         # Smart function implementation
  *.fn.yaml       # Smart function configuration
  *.spec.ts       # Unit tests
dtm/              # DTM types and test utilities 
cumulocity.json   # Application metadata for deployment
```

All other files are related to build, packaging, and development tooling.

## Smart Functions

### onMessage Function

The `onMessage` function processes incoming Cumulocity measurements and transforms them based on linked asset or series configuration. You can create a single transformed measurement or multiple measurements for different destinations (cumulocity, offloading, streaming analytics). To skip processing, return `null`. If there is a critical error, throw an exception.

**Signature:**
```typescript
export const onMessage: OnMessageFn<Measurement> = (obj, context) => {
  // function implementation
};
```

Use `OnMessageFn` type from `../dtm` for type safety and to ensure you are using the correct function signature. `OnMessageFn` requires you to alwas return an array or `null` to skip processing. 

**Input:**
- `obj` - Measurement object with `payload`, `cumulocityType`, and `destination`
- `context` - DTM context containing `linkedAsset`, `linkedSeries`, and `console`

**Output:**
- Array of transformed measurements or `null`
- Supports routing to different destinations (cumulocity, offloading, streaming-analytics)

## Testing and Debugging

### Running Tests

Run all tests:
```bash
npm test
```

### Test Structure

Tests use the `SmartFunctionsRunner` from the dtm package to execute functions in an isolated sandbox environment:

```typescript
const runner = new SmartFunctionsRunner({
  sourceFile: "onmeasurement.fn.ts",
  baseDir: path.resolve(__dirname),
  captureConsole: true,
});

await runner.initialize();
const result = await runner.execute("onMessage", measurement, context);
```

Note, the test runner can read typescript and javascript files. Typescript files are transpiled to commonjs to run in the sandbox. The file is not executed in the host environment, so any dependencies must be bundled or included in the source file. Also, global objects like `process`, `require`, or `fs` are not available in the sandbox. 

With `src/onmessage.spec.ts`, you can find example tests for the `onMessage` function. This includes tests for valid transformations, skipping measurements, and error handling as well as console output capturing.

### Debugging

Console output is captured during test execution:

```typescript
const { result, logs } = await runner.executeWithLogs(
  "onMessage",
  measurement,
  context
);

// logs contains all console.log, console.debug, etc. calls
```

**Important:** Smart functions run in a sandboxed environment. Use `import type` for type-only imports from `../dtm` to avoid runtime dependency issues:

```typescript
import type { DtmContext, Measurement } from "../dtm";
```

Only imports from `../dtm` can be imported at runtime. Avoid importing other modules or packages unless they are bundled into the source file.

When using visual studio code, you can set breakpoints in the test files. However, breakpoints in the smart function source files may not be hit due to the transpilation and sandboxing process directly. Instead add
`debugger;` statements in the smart function code to trigger breakpoints during test execution.

When debugging, only the commonsjs transpiled function can be debugged. Source maps are not supported in the sandbox environment.

## Packaging

### Build

Compile TypeScript to JavaScript:
```bash
npm run build
```

### Package for Deployment

Create deployment package with all necessary files:
```bash
npm run package
```

This command:
1. Compiles TypeScript (`npm run build`)
2. Copies `cumulocity.json` to dist
3. Copies `.fn.yaml` configuration files to dist
4. Copies `.fn.ts` source files to dist
5. Creates `dtm-fns.zip` in project root

The resulting ZIP file can be uploaded as an application to Cumulocity. Currently, the package name must be `dtm-fns` as only this application is recognized by DTM.

Customize `cumulocity.json` to set application name, version, and description. In the `smartFunctions` array, list all `.fn.yaml` configuration files to include in the package.

### Clean Build Artifacts

```bash
npm run clean
```

## Useful Links

📘 [Cumulocity Documentation](https://cumulocity.com/guides/)

💡 [Tech Community Forum](https://tech.forums.softwareag.com/tags/c/forum/1/Cumulocity-IoT)

## Disclaimer

These tools are provided as-is and without warranty or support. They do not constitute part of the Cumulocity GmbH product suite. Users are free to use, fork and modify them, subject to the license agreement. While Cumulocity GmbH welcomes contributions, we cannot guarantee to include every contribution in the master project.