var companion = require('companion');
var sinon = require('sinon');
var expect = require("chai").expect;
var assert = require("chai").assert;
var Sequenx = require('../js/sequenx.js');

// Mock
var customLog = {
    getChild: () => { },
    info: () => { },
    warning: () => { },
    error: () => { },
    name: "",
    dispose: () => { }
}

describe("Parallel", function() {
    it("should be able to instantiate a empty Parallel and start it", function(done) {
        var parallel = new Sequenx.Parallel(customLog);
        parallel.start(done);
    });

    it("should be able to add a simple dispose action (doParallel)", function(done) {
        var parallel = new Sequenx.Parallel(customLog);
        var spy = "";
        parallel.do(done => setTimeout(() => { spy += "A"; done(); }, 50));
        parallel.do(done => setTimeout(() => { spy += "C"; done(); }, 150));
        parallel.do(done => setTimeout(() => { spy += "B"; done(); }, 100));
        parallel.start(() => {
            expect(spy, "seq is not parallel").to.equal("ABC");
            done();
        });
    });

    it("should be not able to skipToEnd", function() {
        var parallel = new Sequenx.Parallel(customLog);
        try {
            parallel.skipToEnd()
        }
        catch (e) {
            expect(e.message).to.equal("skip not implemented for Parallel");
        }
    });

    it("should be not able to skipToMarker", function() {
        var parallel = new Sequenx.Parallel(customLog);
        try {
            parallel.skipToMarker();
        }
        catch (e) {
            expect(e.message).to.equal("skipTo not implemented for Parallel");
        }
    });
});