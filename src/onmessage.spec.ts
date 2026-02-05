import { SmartFunctionsRunner } from "../dtm";
import path from "path";

describe("onMessage Smart Function", () => {
  let runner: SmartFunctionsRunner;

  beforeAll(async () => {
    runner = new SmartFunctionsRunner({
      sourceFile: "onmessage.fn.ts",
      baseDir: path.resolve(__dirname),
      captureConsole: true,
      timeout: 1000000,
    });
    await runner.initialize();
  });

  afterAll(() => {
    // runner might be null if initialization failed
    // make sure failure does not mask test results
    if (runner) {
      runner.dispose();
    }
  });

  it("should process device measurement and create persistent measurement", async () => {
    const measurement = {
      payload: {
        id: "12345",
        type: "c8y_Temperature",
        time: "2026-01-26T10:00:00.000Z",
        self: "https://example.com/measurement/12345",
        source: { id: "device123" },
        c8y_Temperature: {
          T: { value: 25.5, unit: "°C" },
        },
      },
      cumulocityType: "measurement",
      destination: "cumulocity",
    };

    const context = {
      linkedAsset: [
        {
          asset: {
            id: "asset456",
            series: "T2",
            fragment: "c8y_Temperature2",
          },
          fragment: "c8y_Temperature",
          series: "T",
        },
      ],
    };

    const result = await runner.execute("onMessage", measurement, context);
    const logs = runner.getConsoleLogs();
    expect(result).toEqual([
      {
        payload: {
          source: { id: "asset456" },
          type: "c8y_Temperature",
          time: "2026-01-26T10:00:00.000Z",
          c8y_Temperature2: {
            T2: { value: 25.5, unit: "°C" },
          },
        },
        cumulocityType: "measurement",
        destination: "cumulocity",
      },
    ]);

    // Verify console logs were captured
    expect(logs).toBeDefined();
    const debugLogs = logs.filter((log) => log.level === "debug");
    expect(debugLogs.length).toBeGreaterThan(0);
    expect(
      debugLogs.some((log) =>
        log.args.some(
          (arg) =>
            typeof arg === "string" &&
            arg.includes("Created persistent measurement"),
        ),
      ),
    ).toBe(true);
  });

  it("should return null when linkedAsset is not provided", async () => {
    const measurement = {
      payload: {
        id: "99999",
        type: "GenericMeasurement",
        time: "2026-01-26T12:00:00.000Z",
        self: "https://example.com/measurement/99999",
        source: { id: "device555" },
      },
      cumulocityType: "measurement",
      destination: "cumulocity",
    };

    const context = {
      linkedAsset: null,
    };

    const result = await runner.execute("onMessage", measurement, context);
    expect(result).toBeNull();
  });

  it("should return null and log debug message when linkedAsset is missing required fields", async () => {
    const measurement = {
      payload: {
        id: "11111",
        type: "c8y_Temperature",
        time: "2026-01-27T10:00:00.000Z",
        self: "https://example.com/measurement/11111",
        source: { id: "device123" },
        c8y_Temperature: {
          T: { value: 30, unit: "°C" },
        },
      },
      cumulocityType: "measurement",
      destination: "cumulocity",
    };

    const context = {
      linkedAsset: [
        {
          asset: null,
          fragment: "c8y_Temperature",
          series: "T",
        },
      ],
    };

    const result = await runner.execute("onMessage", measurement, context);
    const logs = runner.getConsoleLogs();
    expect(result).toEqual([]);
    expect(logs).toBeDefined();

    // Verify debug log was captured
    const debugLogs = logs.filter((log) => log.level === "debug");
    expect(debugLogs.length).toBeGreaterThan(0);
    expect(
      debugLogs.some((log) =>
        log.args.some(
          (arg) =>
            typeof arg === "string" && arg.includes("Skipping measurement"),
        ),
      ),
    ).toBe(true);
  });

  it("should throw error when fragment is not found in measurement", async () => {
    const measurement = {
      payload: {
        id: "22222",
        type: "c8y_Temperature",
        time: "2026-01-27T11:00:00.000Z",
        self: "https://example.com/measurement/22222",
        source: { id: "device789" },
        c8y_Humidity: {
          H: { value: 60, unit: "%" },
        },
      },
      cumulocityType: "measurement",
      destination: "cumulocity",
    };

    const context = {
      linkedAsset: [
        {
          asset: {
            id: "asset999",
          },
          fragment: "c8y_Temperature",
          series: "T",
        },
      ],
    };

    await expect(
      runner.execute("onMessage", measurement, context),
    ).rejects.toThrow("Fragment c8y_Temperature or series T not found");
  });

  it("should throw error when series is not found in fragment", async () => {
    const measurement = {
      payload: {
        id: "33333",
        type: "c8y_Temperature",
        time: "2026-01-27T12:00:00.000Z",
        self: "https://example.com/measurement/33333",
        source: { id: "device456" },
        c8y_Temperature: {
          T: { value: 22, unit: "°C" },
        },
      },
      cumulocityType: "measurement",
      destination: "cumulocity",
    };

    const context = {
      linkedAsset: [
        {
          asset: {
            id: "asset777",
          },
          fragment: "c8y_Temperature",
          series: "NonExistentSeries",
        },
      ],
    };

    await expect(
      runner.execute("onMessage", measurement, context),
    ).rejects.toThrow(
      "Fragment c8y_Temperature or series NonExistentSeries not found",
    );
  });

  it("should preserve measurement time and type in output", async () => {
    const measurement = {
      payload: {
        id: "44444",
        type: "CustomMeasurementType",
        time: "2026-01-27T14:30:00.000Z",
        self: "https://example.com/measurement/44444",
        source: { id: "999" },
        c8y_Pressure: {
          P: { value: 1013.25, unit: "hPa" },
        },
      },
      cumulocityType: "measurement",
      destination: "cumulocity",
    };

    const context = {
      linkedAsset: [
        {
          asset: {
            id: "111",
            series: "P2",
            fragment: "c8y_Pressure2",
          },
          fragment: "c8y_Pressure",
          series: "P",
        },
      ],
    };

    const result = await runner.execute("onMessage", measurement, context);

    expect(result).toEqual([{
      payload: {
        source: { id: "111" },
        type: "CustomMeasurementType",
        time: "2026-01-27T14:30:00.000Z",
        c8y_Pressure2: {
          P2: { value: 1013.25, unit: "hPa" },
        },
      },
      cumulocityType: "measurement",
      destination: "cumulocity",
    }]);
  });
});
