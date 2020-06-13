declare type AsyncResolve = (value: any) => any;
declare type AsyncReject = (error: any) => any;
declare type AsyncFunction = (resolve: AsyncResolve, reject: AsyncReject) => void;
declare type AsyncEventType = 'resolve' | 'reject' | 'update';
declare type AsyncEvent = (value: any, BREAK: symbol) => any;
declare type AsyncEvents = Set<AsyncEvent>;
declare type AsyncEventList = {
    [key: string]: AsyncEvents;
};
declare type AsyncOptions = {
    request?: AsyncFunction;
    timeout?: number;
    loading?: boolean;
    loaded?: boolean;
    events?: AsyncEventList;
    default?: any | ((a: Async) => any);
    response?: any | ((a: Async) => any);
    error?: any | ((a: Async) => any);
    resolve?: AsyncResolve;
    reject?: AsyncReject;
};
declare const AsyncBreak: unique symbol;
declare class Async {
    protected readonly options: AsyncOptions;
    protected updated: boolean;
    protected timeout: number;
    constructor(options?: AsyncFunction | AsyncOptions);
    update(timeout?: number): this;
    protected call(): void;
    readonly resolve: (response?: any) => this;
    readonly reject: (error?: any) => this;
    get loading(): boolean;
    get loaded(): boolean;
    get default(): any;
    get response(): any;
    get error(): any;
    get value(): any;
    get events(): AsyncEventList;
    on(event: AsyncEventType | string, callback: AsyncEvent): this;
    once(event: AsyncEventType | string, callback: AsyncEvent): this;
    off(event: AsyncEventType | string, callback: AsyncEvent): this;
    trigger(event: AsyncEventType | string, details?: any): this;
    then(resolve: AsyncResolve, reject?: boolean | AsyncReject, reusable?: boolean): Async;
    catch(reject: AsyncReject, reusable?: boolean): Async;
    finally(fin: AsyncResolve | AsyncReject, reusable?: boolean): Async;
}
export default Async;
export { AsyncBreak, AsyncOptions, AsyncEventList, AsyncEvents, AsyncEvent, AsyncEventType, AsyncFunction, AsyncReject, AsyncResolve, };
