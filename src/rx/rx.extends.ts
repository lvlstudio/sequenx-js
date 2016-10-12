/// <reference path="../sequencing/core/impl/Sequence.ts" />

declare const module;
declare const require;
if (typeof module !== 'undefined' && module.exports)
    this["Rx"] = require("rx-lite");

module Sequenx
{

    export interface Sequence
    {
        doWaitForCompleted<T>(observable: Rx.Observable<T>, message?: string): Sequence;
        doWaitForNext<T>(observable: Rx.Observable<T>, message?: string): void;
    }

    Sequence.prototype.doWaitForCompleted = function (observable: Rx.Observable<any>, message?: string)
    {
        this.do(done => observable.subscribeOnCompleted(done), message ? message : "WaitForCompleted");
        return this;
    }

    Sequence.prototype.doWaitForNext = function (observable: Rx.Observable<any>, message?: string)
    {
        this.do(done => observable.subscribeOnNext(done), message ? message : "WaitForNext");
        return this;
    };
}