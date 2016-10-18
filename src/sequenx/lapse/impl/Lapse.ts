/// <reference path="../ILapse.ts"/>

module Sequenx
{
    export class Lapse implements ILapse, ISequenceTask
    {
        private _log: ILog;
        private _isStarted: boolean;
        private _isDisposed: boolean;
        private _isCompleted: boolean;
        private _refCountDisposable: RefCountDisposable;
        private _completed: () => void;

        get name(): string
        {
            return this._log.name;
        }

        constructor(nameOrLog?: string | ILog, private autoStart = false)
        {
            if (!nameOrLog)
                this._log = new Log("");
            else if (typeof nameOrLog === "string")
                this._log = new Log(nameOrLog);
            else
                this._log = nameOrLog as ILog;
            this._refCountDisposable = new RefCountDisposable(Disposable.create(() => this.lapseCompleted()));
            if (autoStart)
                setTimeout(() => this.start(), 0);
        }

        public createChildLog(name: string): ILog
        {
            return this._log.createChild(name);
        }

        /**
         * Add a reference counter to lapse. Lapse is completed only if all sustain is disposed
         * @param name optional log message
         */
        public sustain(name?: string): IDisposable
        {
            if (this._isCompleted || this._isDisposed)
                return Disposable.empty;

            if (name && Log.isEnabled)
                this._log.info("Sustain " + name);

            return this._refCountDisposable.getDisposable();
        }

        /**
         * Complete callback (useful when used with autoStart)
         * 
         * @param cb callback function
         * @returns self for chaining
         */
        public onCompleted(cb: () => void)
        {
            this._completed = cb;
        }

        /**
         * Start to watch for all sustain is disposed
         * @param onComplete callback called when sequence is completed
         */
        public start(cb?: () => void): void
        {
            if (this._isStarted || this._isCompleted || this._isDisposed)
                return;

            this._isStarted = true;
            this._completed = cb || this._completed;
            this._refCountDisposable.dispose();
        }

        /**
         * Releases all resources of this object.
         */
        public dispose(): void
        {
            if (this._isDisposed)
                return;

            if (!this._isCompleted)
                this._log.info("Cancelling");

            this.lapseCompleted();
        }

        private lapseCompleted(): void
        {
            if (this._isCompleted)
                return;
            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();

            this._completed && this._completed();
        }

        //ILapseExtensions

        /**
         * Sustain lapse until sequence complete see {@link Sequence}
         * @param action 
         * @param message optional log message
         */
        public sequence(action: (seq: Sequence) => void, message?: string): Sequence
        {
            const sustain = this.sustain();
            const name = message ? message : 'Sequence';
            const log = this.createChildLog(name);
            const seq = new Sequence(log);
            action(seq);
            seq.start(() => sustain.dispose());

            return seq;
        }

        /**
         * Sustain lapse until child is disposed
         * @param action 
         * @param message optional log message
         */
        public child(action: (lapse: ILapse) => void, message?: string): void
        {
            const sustain = this.sustain();
            const name = message ? message : 'Child';
            const log = this.createChildLog(name);
            const child = new Lapse(log);
            action(child);
            child.start(() => sustain.dispose());
        }
    }
}
