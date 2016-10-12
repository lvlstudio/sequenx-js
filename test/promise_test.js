var companion = require('companion');
var sinon = require('sinon');
var expect = require("chai").expect;
var assert = require("chai").assert;
var Sequenx = require('../js/sequenx.js');

var customLog = {
    getChild: () => { },
    info: () => { },
    warning: () => { },
    error: () => { },
    name: "",
    dispose: () => { }
}


// Test
describe("Sequence Promise", function() {
    it("should be able to pass promise to sequence (doPromise)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        seq.add(new Promise(resolve => resolve()));
        seq.start(done);
    });

    it("should be able to get promise from function and add it to sequence (doPromise)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        seq.doPromise(() => new Promise(resolve => resolve()));
        seq.start(done);
    });

    it("should be able to start sequence and get Promise as return (startPromise)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        seq.startPromise().then(v => done());
    });
});