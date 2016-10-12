var companion = require('companion');
var sinon = require('sinon');
var expect = require("chai").expect;
var assert = require("chai").assert;
var Sequenx = require('../js/sequenx.js');
var Rx = require("rx-lite");

var customLog = {
    getChild: () => { },
    info: () => { },
    warning: () => { },
    error: () => { },
    name: "",
    dispose: () => { }
}


// Test
describe("Sequence Rx.Obsevable", function() {
    it("should be able to pass Rx.Observable to sequence and wait complete (doWaitForCompleted)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        seq.doWaitForCompleted(Rx.Observable.create(o => o.onCompleted(null)));
        seq.start(done);
    });

    it("should be able to pass Rx.Observable to sequence and wait next (doWaitForNext)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        seq.doWaitForNext(Rx.Observable.create(o => o.onNext(null)));
        seq.start(done);
    });
});