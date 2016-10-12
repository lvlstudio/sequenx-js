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

// Test
describe("Lapse", function() {

    before(function() {
        Sequenx.Log.isEnabled = false;
    })

    it("should be able to create a lapse instance", function() {
        var lapse = new Sequenx.Lapse("lapse");
        expect(lapse).instanceof(Sequenx.Lapse);
    });

    it("should be able to create with custom log", function() {
        var lapse = new Sequenx.Lapse(customLog);
        expect(lapse).instanceof(Sequenx.Lapse);
    });

    it("should be able start empty lapse", function() {
        var lapse = new Sequenx.Lapse(customLog);
        lapse.start();
    });

    it("should be able to start empty Lapse and receive complete", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        lapse.start(done);
    });

    it("should be able to sustain Lapse and dispose it after start", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain("sub lapse");
        lapse.start(done);
        subLapse.dispose();
    });

    it("should not complete if never start", function() {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain("sub lapse");
        lapse.start(() => assert.fail("should be never call complete"));
    });

    it("should be able to sustain Lapse and dispose it before start", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain("sub lapse");
        subLapse.dispose();
        lapse.start(done);
    });

    it("should be able to sustain Lapse 2 time and receive complete after dispose 2 lapse", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain("sub lapse");
        var sub2Lapse = lapse.sustain("sub2 lapse");
        var lasDisposed;
        lapse.start(function() {
            expect(lasDisposed).to.equal(true);
            done();
        });

        subLapse.dispose();
        lasDisposed = true;
        sub2Lapse.dispose();
    });

    it("should be able to create a sequence from lapse (sequence)", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        lapse.sequence(seq => {
            expect(seq).instanceof(Sequenx.Sequence);
            done();
        });
        lapse.start();
    });

    it("should be able to create a child lapse (child)", function(done) {
        var lapse = new Sequenx.Lapse("main");
        lapse.child(l => {
            expect(l).instanceof(Sequenx.Lapse);
        });
        lapse.start(done);
    });

    describe("Log test", function() {
        it("should be able to retrieve log name", function() {
            var lapse = new Sequenx.Lapse("lapse");
            expect(lapse.name).to.equal("lapse");
        });

        it("should be able log Lapse on substain", function() {
            Sequenx.Log.isEnabled = true;
            sinon.spy(customLog, "info");

            var clog = console.log;
            console.log = () => { }
            var log = new Sequenx.Log();
            var lapse = new Sequenx.Lapse(customLog);
            lapse.sustain("sustain");
            lapse.dispose();
            lapse.start();
            console.log = clog;

            expect(customLog.info.callCount, "info not called").to.equal(2)
            expect(customLog.info.getCall(0).args[0]).to.be.equal("Sustain sustain");
            expect(customLog.info.getCall(1).args[0]).to.be.equal("Cancelling");
            customLog.info = () => { };
        });
    });

    describe("Sequence extension", function() {

        it("should be able to create a sequence from lapse and wait sequence complete", function(done) {
            var lapse = new Sequenx.Lapse(customLog);
            var spy = "";
            lapse.sequence(seq => {
                expect(seq).instanceof(Sequenx.Sequence);
                seq.do(done => {
                    spy += "A";
                    setTimeout(() => done(), 50);
                });
            });
            lapse.start(function() {
                expect(spy).to.equal("AB");
                done();
            });
            spy += "B";
        });

        it("should be able to create a sequence from lapse and wait sequence complete", function(done) {
            var seq = new Sequenx.Sequence(customLog);
            seq.doLapse(lapse => {
                var d = lapse.sustain()
                expect(lapse).instanceof(Sequenx.Lapse);
                setTimeout(() => d.dispose(), 50);
            });
            seq.start(() => done());
        });

    });
});