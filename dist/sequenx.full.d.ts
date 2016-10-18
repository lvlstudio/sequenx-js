declare module Sequenx {
    interface Sequence extends ISequenceTask, IDisposable {
        /**
         * Add a callback task to the sequence
         * @param action function to execute. By adding a callback (usually named done) the Sequence will wait wait for this function to be called to complete the task.
         * @param message Optional log message
         * @returns self for chaining
         *
         * @example
         * sequence.do(() => action()) //execute and complete (synchronous )
         * sequence.do((done) => setTimeout(done, 1000)) //execute and complete after 1sec (asynchronous)
         */
        do(action: (done?: () => void) => void, message?: string): Sequence;
        doDispose(disposable: IDisposable, message?: string): Sequence;
        doWait(duration: number, message?: string): Sequence;
        doWaitForDispose(message?: string): IDisposable;
        doMark(marker: any): Sequence;
        skipToMarker(marker: any): void;
        skipToEnd(): void;
        skip(predicate: (item: ISequenceTask) => Boolean): void;
        skipTo(predicate: (item: ISequenceTask) => boolean): void;
        onCompleted(cb: () => void): any;
    }
    class Sequence implements Sequence {
        private autoStart;
        private _log;
        private _pendingExecution;
        protected _tasks: Array<ISequenceTask>;
        private _isStarted;
        private _isDisposed;
        private _isCompleted;
        private _isExecuting;
        protected _cbComplete: () => void;
        /**
         * @param nameOrLog specified Log to use or the log name.
         * @param autoStart if true start sequence async
         */
        constructor(nameOrLog?: string | ILog, autoStart?: boolean);
        /**
         * @returns sequence name used for log or null if don't have log
         */
        readonly name: string;
        /**
         * create a new Log child
         * @return ILog or null if no log
         */
        createChildLog(name: string): ILog;
        /**
         * Add a new item into the sequence
         * @param the sequence item to add
         */
        add(task: ISequenceTask): void;
        /**
         * Start the sequence
         * @param onComplete callback called when sequence is complete
         */
        start(onComplete?: () => void): void;
        /**
         * Releases all resources of this object.
         */
        dispose(): void;
        protected scheduleNext(): void;
        protected onLastItemCompleted(): void;
        private executeNext();
        private onSequenceComplete();
        /**
         * Create a new Parallel sequence. see {@link Parallel} for more information
         * @param action function
         * @param message optional log message
         *
         * @returns self for chaining
         *
         * @example
         * //wait util all sub task complete before complete task.
         * sequence.doParallel((parallel)=>{
         *    parallel.do((done) => setTimeout(done, 1000)) // executed in parallel
         *    parallel.do((done) => setTimeout(done, 100)) // executed in parallel
         * })
         */
        doParallel(action: (parallel: Parallel) => void, message?: string): Sequence;
        /**
         * Create a sub Sequence
         * @param message optional log message
         * @returns self for chaining
         *
         * @example
         * //wait util all sub task complete before complete task.
         * sequence.doSequence((parallel)=>{
         *    parallel.do((done) => setTimeout(done, 1000)) //executed first
         *    parallel.do((done) => setTimeout(done, 100)) //executed next
         * })
         */
        doSequence(action: (sequence: Sequence) => void, message?: string): Sequence;
    }
}
declare const module: any;
declare const require: any;
declare module Sequenx {
    interface Sequence {
        doWaitForCompleted<T>(observable: Rx.Observable<T>, message?: string): Sequence;
        doWaitForNext<T>(observable: Rx.Observable<T>, message?: string): void;
    }
}
declare module Sequenx {
    interface ICompletable {
        onCompleted(action: () => void): any;
    }
}
declare module Sequenx {
    interface ISequenceTask {
        message?: string;
        start(onComplete?: () => void): any;
    }
}
declare module Sequenx {
    interface IDisposable {
        dispose(): void;
    }
    class Disposable implements IDisposable {
        action: () => void;
        static empty: Disposable;
        static create(action: () => void): Disposable;
        protected _isDisposed: boolean;
        constructor(action?: () => void);
        readonly isDisposed: boolean;
        dispose(): void;
    }
    class RefCountDisposable extends Disposable {
        private disposable;
        private _count;
        private _isPrimaryDisposed;
        constructor(disposable: Disposable);
        dispose(): void;
        getDisposable(): IDisposable;
    }
}
declare module Sequenx {
    interface ILapse extends IDisposable {
        sustain(name?: string): IDisposable;
        createChildLog(name: string): ILog;
        name: string;
        child(action: (lapse: ILapse) => void, message?: string): void;
        sequence(action: (seq: Sequence) => void, message?: string): Sequence;
    }
}
declare module Sequenx {
    interface ILog extends IDisposable {
        createChild(name: string): ILog;
        info(message: string, ...params: any[]): void;
        warning(message: string, ...params: any[]): void;
        error(message: string, ...params: any[]): void;
        name: string;
    }
}
declare module Sequenx {
    class Log implements ILog {
        private static PathSeparator;
        private static MessageSeparator;
        private static StartSuffix;
        private static EndSuffix;
        private static s_nextId;
        static isEnabled: boolean;
        private _parent;
        private _name;
        private _id;
        private _fullName;
        private _isDisposed;
        name: string;
        constructor(name: string, parent?: Log);
        toString(): string;
        dispose(): void;
        createChild(name: string): ILog;
        info(message: string, ...params: any[]): void;
        warning(message: string, ...params: any[]): void;
        error(message: string, ...params: any[]): void;
        readonly fullName: string;
        private getNameWithId();
        private format(message, params);
        private strFormat(str, ...params);
    }
}
declare module Sequenx {
    interface Sequence {
        doPromise(action: () => Promise<any>): Sequence;
        startPromise(): Promise<any>;
    }
}
interface Promise<T> extends Sequenx.ISequenceTask {
    start(cb?: () => void): any;
}
declare module Sequenx {
    class CallbackTask implements ISequenceTask {
        action: (done?: () => void) => void;
        message: string;
        constructor(action: (done?: () => void) => void, message?: string);
        start(cb: () => void): void;
        toString(): string;
    }
}
declare module Sequenx {
    class MarkTask implements ISequenceTask {
        marker: any;
        message: string;
        private _callback;
        constructor(marker: any, message?: string);
        start(cb: () => void): void;
        toString(): string;
    }
}
declare module Sequenx {
    interface Parallel {
    }
    class Parallel extends Sequence implements Parallel, ISequenceTask {
        message: string;
        constructor(nameOrLog?: string | ILog, autoStart?: boolean);
        scheduleNext(): void;
        skip(predicate: (item: ISequenceTask) => boolean): void;
        skipTo(predicate: (item: ISequenceTask) => boolean): void;
    }
}
declare module Sequenx {
    interface Sequence {
        doLapse(action: (lapse: Lapse) => void, message?: string): Sequence;
    }
}
declare module Sequenx {
    class Lapse implements ILapse, ISequenceTask {
        private autoStart;
        private _log;
        private _isStarted;
        private _isDisposed;
        private _isCompleted;
        private _refCountDisposable;
        private _completed;
        readonly name: string;
        constructor(nameOrLog?: string | ILog, autoStart?: boolean);
        createChildLog(name: string): ILog;
        sustain(name?: string): IDisposable;
        onCompleted(cb: () => void): void;
        start(cb?: () => void): void;
        dispose(): void;
        private lapseCompleted();
        sequence(action: (seq: Sequence) => void, message?: string): Sequence;
        child(action: (lapse: ILapse) => void, message?: string): void;
    }
}
