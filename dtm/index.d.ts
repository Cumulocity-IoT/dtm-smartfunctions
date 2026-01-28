import * as ts from 'typescript';

type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? T[P] extends Function ? T[P] : DeepReadonly<T[P]> : T[P];
};

declare const OnMessageFnName = "onMessage";
interface DataPrepContext {
    readonly runtime: 'cumulocity-dtm';
    readonly params?: {
        [key: string]: any;
    };
    readonly console?: {
        log: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
        debug: (...args: any[]) => void;
        verbose: (...args: any[]) => void;
    };
}
type DtmLinkedSeries = {
    fragment: string;
    series: string;
    label?: string;
    [key: string]: string;
} & DtmLinkedSeriesSource;
type DtmLinkedSeriesSource = {
    source?: {
        id: string;
        fragment: string;
        series: string;
    };
};
type DtmAssetLink = {
    fragment: string;
    series: string;
    asset: {
        id: string;
        fragment: string;
        series: string;
        label?: string;
        [key: string]: string;
    };
};
type DtmContext = DataPrepContext & DeepReadonly<{
    linkedAsset: DtmAssetLink;
    linkedSeries: DtmLinkedSeries;
}>;
type CumulocityType = 'measurement' | 'event' | 'alarm' | 'operation' | 'managedObject';
interface CumulocityObject {
    payload: object;
    cumulocityType: CumulocityType;
    externalSource?: ExternalId[];
    destination?: 'cumulocity' | 'offloading' | 'streaming-analytics';
}
interface ExternalId {
    externalId: string;
    type: string;
}
interface Measurement extends CumulocityObject {
    cumulocityType: CumulocityType;
    payload: {
        type: string;
        time: Date | string;
        source?: MeasurementSource;
        [fragment: string]: {
            [series: string]: MeasurementValue;
        } | any;
    };
}
interface MeasurementSource {
    id: string;
}
interface MeasurementValue {
    value: number;
    unit?: string;
    [key: string]: any;
}
declare function isMeasurement(obj: any | undefined | null): obj is Measurement;

type DtmSmartFunction = {
    identifier: string;
    version?: string;
    source: {
        type: 'url' | 'bundle';
        path: string;
    };
    description?: string;
    tags?: string[];
    params?: {
        [key: string]: any;
    };
    enabled: boolean;
    smartFunctionFile?: string;
    input: InputObject<'measurement', DtmMeasurementInput>;
    sourceCode?: string;
};
type InputObject<T = 'measurement', C = DtmMeasurementInput> = {
    type: T;
    context?: C;
};
type DtmMeasurementInput = {
    linkedAsset?: boolean;
    linkedSeries?: boolean;
};

interface ConsoleLog {
    level: 'log' | 'warn' | 'error' | 'debug' | 'verbose' | 'info';
    args: any[];
    timestamp?: number;
}
interface SmartFunctionConsole {
    log(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    debug(...args: any[]): void;
    verbose(...args: any[]): void;
    info(...args: any[]): void;
}
interface ExecutionEngineOptions {
    timeout?: number;
    memoryLimitMb?: number;
    stackSizeMb?: number;
    captureConsole?: boolean;
    console?: SmartFunctionConsole;
}
interface ExecutionResult<O = any> {
    result: O;
    logs?: ConsoleLog[];
    executionTimeMs?: number;
}

interface SmartFunctionsRunnerOptions extends ExecutionEngineOptions {
    sourceFile: string;
    baseDir?: string;
    compilerOptions?: ts.CompilerOptions;
}
declare class SmartFunctionsRunner {
    private engine;
    private transpiledCode;
    private options;
    constructor(options: SmartFunctionsRunnerOptions);
    private loadAndTranspile;
    private createEngine;
    initialize(): Promise<void>;
    execute<T = any, O = any>(functionName: string, input: T, context?: any): Promise<O>;
    executeWithLogs<T = any, O = any>(functionName: string, input: T, context?: any): Promise<ExecutionResult<O>>;
    getTranspiledCode(): string;
    dispose(): void;
}

type DtmSmartFunctionExternal = {
    name: string;
    disabled?: boolean;
};
type DtmSmartFunctionManifest = DtmSmartFunctionExternal & Required<Pick<DtmSmartFunction, 'smartFunctionFile' | 'input'>> & Omit<DtmSmartFunction, 'identifier' | 'smartFunctionFile' | 'input' | 'sourceCode' | 'source' | 'enabled'>;

export { OnMessageFnName, SmartFunctionsRunner, isMeasurement };
export type { CumulocityObject, CumulocityType, DtmAssetLink, DtmContext, DtmLinkedSeries, DtmSmartFunctionManifest, ExternalId, Measurement, MeasurementSource, MeasurementValue, SmartFunctionsRunnerOptions };
