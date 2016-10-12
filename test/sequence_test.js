var companion = require('companion');
var sinon = require('sinon');
var expect = require("chai").expect;
var assert = require("chai").assert;
var Sequenx = require('../js/sequenx.js');

// Mock
var customLog = {
    createChild: () => { },
    info: () => { },
    warning: () => { },
    error: () => { },
    name: "",
    dispose: () => { }
}

const DELAY = 50;

// Test
describe("Sequence", function() {

    before(function() {
        Sequenx.Log.isEnabled = false;
    })

    it("should be able to create a Sequence instance with name and start", function() {
        var seq = new Sequenx.Sequence("seq");
        seq.start();
        expect(seq).instanceof(Sequenx.Sequence);
    });

    it("should be able to create a Sequence instance no name and start", function() {
        var seq = new Sequenx.Sequence();
        seq.start();
        expect(seq).instanceof(Sequenx.Sequence);
    });

    it("should be able to create a Sequence instance with custom log and start", function() {
        var seq = new Sequenx.Sequence(customLog);
        seq.start();
        expect(seq).instanceof(Sequenx.Sequence);
    });

    it("should be able to do a simple action", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = sinon.spy(() => { });
        seq.do(spy);
        seq.start(() => {
            expect(spy.calledOnce, "action not executed").to.be.true
            done();
        });
    });

    it("should not be able to run sequence twice", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = sinon.spy((done) => setTimeout(done, DELAY));
        seq.do(spy);
        seq.start(() => {
            expect(spy.calledOnce, "start multiple time").to.be.true
            done();
        });
        seq.start(() => { assert.fail(null, null, "start multiple time") });
    });

    it("should be able to start a sequence with 1 fail action", function() {
        var seq = new Sequenx.Sequence(customLog);
        seq.do(l => { throw "error"; });

        try {
            seq.start();
            throw "test fail";
        }
        catch (e) {
            expect(e).to.equal("error");
        }
    });


    it("should don't call complete since done was call", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        seq.do((done) => { });
        seq.start(() => {
            assert.fail(null, null, "complete should not be call");
        });
        setTimeout(done, 500);
    });

    it("should be able to start a sequence with 2 action in order", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq
            .do(() => spy += "A")
            .do(() => spy += "B")
            .start(() => {
                expect(spy.length, "action not executed").to.equal(2);
                expect(spy, "action not executed in order").to.equal("AB");
                done();
            });
    });

    it("should be able to start a sequence async", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq
            .do(done => {
                spy += "A";
                setTimeout(done, DELAY);
            })
            .do(lapse => {
                spy += "C";
                setTimeout(done, DELAY);
            })
            .start(() => {
                expect(spy, "action was not async").not.to.equal("ACB");
                expect(spy, "action not executed in order").to.equal("ABC");
                done();
            });
        spy += "B";
    });


    it("should be able to dispose sequence before complete (dispose)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq
            .do(done => {
                spy += "A";
                setTimeout(done, DELAY);
            })
            .do(done => {
                spy += "B";
                setTimeout(done, DELAY);
            })
        seq.start(() => {
            expect(spy, "action not skip").to.equal("A");
            done();
        });
        seq.dispose();
    });

    it("should be able to dispose sequence before complete (dispose)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq
            .do(done => {
                spy += "A";
                setTimeout(done, DELAY);
            })
        seq.start(() => {
            expect(spy, "action not skip").to.equal("A");
            done();
        });
        seq.dispose();
    });

    it("should be able skip action and go to end (skipToEnd)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq
            .do(done => {
                spy += "A";
                setTimeout(done, DELAY);
                seq.skipToEnd(); //skip other action;
            })
            .do(done => {
                spy += "B";
                setTimeout(done, DELAY);
            })
            .start(() => {
                expect(spy, "action not skip").to.equal("A");
                done();
            });
    });

    it("should be able to create and skip to the mark (doMark, skipToMarker)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(done => {
            spy += "A";
            setTimeout(done, DELAY);
        });
        seq.do(done => {
            spy += "B";
            setTimeout(done, DELAY);
        });
        seq.doMark("mark");
        seq.do(done => {
            spy += "C";
            setTimeout(done, DELAY);
        });
        seq.start(() => {
            expect(spy, "action not skip").to.equal("AC");
            done();
        });
        seq.skipToMarker("mark");
    });


    it("should be able to add delay between action (doWait)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(() => spy += "A");
        seq.doWait(DELAY);
        seq.do(() => spy += "C");
        seq.start(() => {
            expect(spy, "action was not async").not.to.equal("ACB");
            expect(spy, "action not executed in order").to.equal("ABC");
            done();
        });
        spy += "B";
    });

    it("should be able to wait to dispose a object (doWaitForDispose)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(() => spy += "A");
        var disposable = seq.doWaitForDispose();
        seq.do(() => spy += "C");
        seq.start(() => {
            expect(spy, "action was not async").not.to.equal("ACB");
            expect(spy, "action not executed in order").to.equal("ABC");
            done();
        });
        spy += "B";
        disposable.dispose();
    });

    it("should be able to add a simple dispose action (doParallel)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.doParallel(parallel => {
            parallel.do(done => setTimeout(() => { spy += "A"; done(); }, 50));
            parallel.do(done => setTimeout(() => { spy += "C"; done(); }, 150));
            parallel.do(done => setTimeout(() => { spy += "B"; done(); }, 100));
        });
        seq.start(() => {
            expect(spy, "seq is not parallel").to.equal("ABC");
            done();
        });
    });


    it("should be able to add a simple dispose action (doDispose)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";

        var obj = {
            dispose: () => { }
        }
        var spy = sinon.spy(obj, "dispose");

        seq.doDispose(obj);

        seq.start(() => {
            expect(obj.dispose.calledOnce).to.be.true;
            done();
        });
    });


    it("should be able to create a sub Sequence (doSequence)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.doSequence(seq2 => {
            seq2.do(done => setTimeout(() => { spy += "A"; done(); }), 50);
            seq2.do(done => setTimeout(() => { spy += "C"; done(); }), 150);
            seq2.do(done => setTimeout(() => { spy += "B"; done(); }, 100));
        })
        seq.start(() => {
            expect(spy, "seq is not parallel").to.equal("ACB");
            done();
        });
    });

    it("should be able dispose sequence and skip action (dispose)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(done => {
            spy += "A";
            setTimeout(done, DELAY);
            seq.dispose(); //skip other action;
        });
        seq.do(done => {
            spy += "B";
            setTimeout(done, DELAY);
        });
        seq.start(() => {
            expect(spy, "action not skip").to.equal("A");
            done();
        });
    });

    describe("Log test", function() {
        it("should be able to retrieve log name", function() {
            var seq = new Sequenx.Sequence("seq");
            expect(seq.name).to.equal("seq");
        });

        it("should be log error if try add other then Sequenx.Item", function() {
            var seq = new Sequenx.Sequence(customLog);
            sinon.spy(customLog, "error");
            seq.add("error");
            expect(customLog.error.calledOnce).to.be.true;
            expect(customLog.error.getCall(0).args[0]).to.be.equal("Trying to add something other than Sequenx.Item, use do if you use a function(lapse)");
            customLog.error.restore();
        });
    });

});