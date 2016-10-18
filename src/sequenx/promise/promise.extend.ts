module Sequenx
{
    export interface Sequence
    {
        doPromise(action: () => Promise<any>): Sequence;
        startPromise(): Promise<any>;
    }

    Sequence.prototype.doPromise = function (action: () => Promise<any>)
    {
        this.do(done => action().then(v => done()));
        return this;
    };

    Sequence.prototype.startPromise = function ()
    {
        return new Promise(resolve => this.start(resolve));
    };

}

interface Promise<T> extends Sequenx.ISequenceTask
{
    start(cb?: () => void);
}


Promise.prototype.start = function (cb?: () => void)
{
    this.then(cb);
}