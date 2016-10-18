module Sequenx
{
    export interface IDisposable
    {
        dispose(): void;
    }

    export class Disposable implements IDisposable
    {

        static empty: Disposable = new Disposable();
        static create(action: () => void): Disposable
        {
            return new Disposable(action);
        }
        protected _isDisposed: boolean = false;

        constructor(public action?: () => void) { }

        get isDisposed()
        {
            return this._isDisposed;
        }

        dispose()
        {
            !this._isDisposed && this.action && this.action();
            this._isDisposed = true;
        }
    }

    // TODO to review
    export class RefCountDisposable extends Disposable
    {
        private _count: number = 0;
        private _isPrimaryDisposed: boolean;

        constructor(private disposable: Disposable)
        {
            super();
        }


        dispose(): void
        {
            if (!this._isDisposed)
            {
                this._isPrimaryDisposed = true;
                if (this._count <= 0)
                {
                    this._isDisposed = true;
                    this.disposable.dispose();
                }
            }
        }

        getDisposable(): IDisposable
        {
            if (this._isDisposed)
                return Disposable.empty;

            this._count++;
            return Disposable.create(() =>
            {
                this._count--;
                if (this._isPrimaryDisposed && this._count <= 0)
                    this.disposable.dispose();
            });
        }
    }
}