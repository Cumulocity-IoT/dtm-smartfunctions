import * as ts from 'typescript';

declare const OnMessageFnName = "onMessage";
type OnMessageFn<T = CumulocityObject> = (obj: T, context: DtmContext) => T[] | null;
interface DataPrepContext {
    readonly runtime: 'cumulocity-dtm';
    readonly params?: {
        [key: string]: any;
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
type DtmContext = DataPrepContext & {
    linkedAssetId?: string;
    linkedAsset?: DtmAssetLink[];
    linkedSeries?: DtmLinkedSeries[];
};
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

interface SmartFunctionConsole extends ILogger {
}

type LogLevel = 'error' | 'warn' | 'log' | 'debug' | 'verbose';
interface ILogger {
    log: (...args: any[]) => void;
    debug?: (...args: any[]) => void;
    warn?: (...args: any[]) => void;
    error?: (...args: any[]) => void;
    verbose?: (...args: any[]) => void;
}
interface ConsoleLog {
    level: LogLevel;
    args: any[];
    timestamp?: number;
}

interface ExecutionEngineOptions {
    timeout?: number;
    memoryLimitMb?: number;
    stackSizeMb?: number;
    captureConsole?: boolean;
    console?: SmartFunctionConsole;
    logger?: ILogger;
}

interface SmartFunctionsRunnerOptions extends ExecutionEngineOptions {
    sourceFile: string;
    baseDir?: string;
    compilerOptions?: ts.CompilerOptions;
    params?: DtmContext['params'];
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
    getConsoleLogs(): ConsoleLog[];
    getTranspiledCode(): string;
    dispose(): void;
}

type DtmSmartFunctionExternal = {
    name: string;
    disabled?: boolean;
};
type DtmSmartFunctionManifest = DtmSmartFunctionExternal & Required<Pick<DtmSmartFunction, 'smartFunctionFile' | 'input'>> & Omit<DtmSmartFunction, 'identifier' | 'smartFunctionFile' | 'input' | 'sourceCode' | 'source' | 'enabled'>;

export { OnMessageFnName, SmartFunctionsRunner, isMeasurement };
export type { CumulocityObject, CumulocityType, DtmAssetLink, DtmContext, DtmLinkedSeries, DtmSmartFunctionManifest, ExternalId, Measurement, MeasurementSource, MeasurementValue, OnMessageFn, SmartFunctionsRunnerOptions };
