module Sequenx
{
    export interface Sequence extends ISequenceTask, IDisposable
    {
        // { do
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
        // }
        // { skip
        skipToMarker(marker: any): void;
        skipToEnd(): void;
        skip(predicate: (item: ISequenceTask) => Boolean): void;
        skipTo(predicate: (item: ISequenceTask) => boolean): void;
        // }
        onCompleted(cb: () => void);
    }

    export class Sequence implements Sequence
    {
        private _log: ILog;
        private _pendingExecution: IDisposable = Disposable.empty;
        protected _tasks: Array<ISequenceTask> = new Array<ISequenceTask>();

        private _isStarted: boolean = false;
        private _isDisposed: boolean = false;
        private _isCompleted: boolean = false;
        private _isExecuting: boolean = false;
        protected _cbComplete: () => void;

        /**
         * @param nameOrLog specified Log to use or the log name.
         * @param autoStart if true start sequence async  
         */
        constructor(nameOrLog?: string | ILog, private autoStart = false)
        {
            if (!nameOrLog)
                this._log = new Log("");
            else if (typeof nameOrLog === "string")
                this._log = new Log(nameOrLog);
            else if (nameOrLog)
                this._log = nameOrLog;
            if (autoStart)
                setTimeout(this.start.bind(this), 0);
        }

        /**
         * @returns sequence name used for log or null if don't have log
         */
        get name(): string
        {
            return this._log.name;
        }

        /**
         * create a new Log child
         * @return ILog or null if no log 
         */
        public createChildLog(name: string): ILog
        {
            return this._log.createChild(name);
        }

        /**
         * Add a new item into the sequence
         * @param the sequence item to add
         */
        public add(task: ISequenceTask): void
        {
            if (!task.start)
            {
                this._log.error("Trying to add something other than Sequenx.Item, use do if you use a function(lapse)");
                return;
            }
            if (this._isDisposed)
                throw new Error("Trying to add action to a disposed sequence.");

            this._tasks.push(task);
        }

        /**
         * Start the sequence
         * @param onComplete callback called when sequence is complete
         */
        public start(onComplete?: () => void)
        {
            if (this._isStarted || this._isDisposed || this.autoStart)
                return;

            if (this._isCompleted && onComplete)
                onComplete();

            this._isStarted = true;
            this._cbComplete = onComplete || this._cbComplete;
            this.scheduleNext();
        }

        /**
         * Add a complete callback (useful when used with autoStart)
         * 
         * @param cb callback function
         * @returns self for chaining
         */
        public onCompleted(cb: () => void): Sequence
        {
            this._cbComplete = cb;
            return this;
        }

        /**
         * Releases all resources of this object.
         */
        public dispose(): void
        {
            if (this._isDisposed)
                return;

            if (!this._isCompleted && this._log)
                this._log.warning("Cancelling (" + this._tasks.length + " items)");

            this.onSequenceComplete();
        }

        protected scheduleNext(): void
        {
            this._pendingExecution.dispose();
            this.executeNext();
        }

        protected onLastItemCompleted()
        {
            this.onSequenceComplete();
        }

        private executeNext()
        {
            if (this._isExecuting || this._isCompleted || this._isDisposed)
                return;

            // Nothing left to execute?
            if (this._tasks.length === 0)
            {
                this.onLastItemCompleted();
                return;
            }

            const item = this._tasks.shift();

            // Execute item
            try
            {
                this._isExecuting = true;
                item.start(() =>
                {
                    this._isExecuting = false;
                    this.scheduleNext();
                });
            }
            catch (error)
            {
                this._isExecuting = false;
                //this.dispose();
                throw error;
            }
        }

        private onSequenceComplete()
        {
            if (this._isCompleted)
                return;

            this._tasks.length = 0;
            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();
            this._cbComplete && this._cbComplete();
        }

        // { do

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
        public do(action: (done?: () => void) => void, message?: string): Sequence
        {
            this.add(new CallbackTask(action, message));
            return this;
        }

        /**
        * Add a task to dispose to the sequence
        * @param disposable IDisposable to dispose
        * @param message optional log message
        *
        * @returns self for chaining
        */
        public doDispose(disposable: IDisposable, message?: string): Sequence
        {
            this.do(() => disposable.dispose(), message ? message : "Dispose");
            return this;
        }

        /**
         * Add a delay between task execution into the sequence
         * @param duration delay in millisecond
         * @param message optional log message
         * 
         * @returns self for chaining
         */
        public doWait(duration: number, message?: string): Sequence
        {
            this.do((done) => setTimeout(done, duration), message ? message : "Wait " + (duration / 1000) + "s");
            return this;
        }

        /**
         * Wait util the returned disposable was dispose
         * @param message optional log message
         * 
         * @returns Disposable to dispose for continue 
         */
        public doWaitForDispose(message?: string): IDisposable
        {
            let disposable = new Disposable();
            this.do((done) => { disposable.action = done; },
                message ? message : "WaitForDispose");
            return disposable;
        }

        /**
         * Add a mark to sequence to use with {@link Sequence#skipToMarker}
         * @returns self for chaining
         */
        public doMark(marker: any): Sequence
        {
            this.add(new MarkTask(marker));
            return this;
        }

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
        public doParallel(action: (parallel: Parallel) => void, message?: string): Sequence
        {
            const parallel = new Parallel();
            parallel.message = message ? message : "Parallel";
            action(parallel);
            this.add(parallel);
            return this;
        }

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
        public doSequence(action: (sequence: Sequence) => void, message?: string): Sequence
        {
            message = message ? message : "Sequence";
            const sequence = new Sequence(message);
            action(sequence);
            this.add(sequence);
            return this;
        }

        // }
        // { skip

        /**
         * Skip task and go to the marker see {@link Sequence#doMark}
         */
        public skipToMarker(marker: any, cancelCurrent: boolean = false): void
        {
            this.skipTo(x => x instanceof MarkTask && x.marker === marker);
        }

        public skipToEnd(): void
        {
            this.skip(x => true);
        }

        public skip(predicate: (item: ISequenceTask) => boolean): void
        {
            // Skip items until reaching a non-matching one
            while (this._tasks.length > 0 && predicate(this._tasks[ 0 ]))
                this._tasks.splice(0, 1);
        }

        public skipTo(predicate: (item: ISequenceTask) => boolean): void
        {
            let index = -1;
            for (let i = 0; i < this._tasks.length; i++)
            {
                if (predicate(this._tasks[ i ]))
                {
                    index = i;
                    break;
                }
            }

            if (index !== -1)
            {
                this._tasks = this._tasks.slice(index);
            }
        }

        // }
    }
}
