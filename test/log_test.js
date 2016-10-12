var companion = require('companion');
var sinon = require('sinon');
var expect = require("chai").expect;
var assert = require("chai").assert;
var Sequenx = require('../js/sequenx.js');


// Test
describe("Log", function() {


    beforeEach(function() {
        sinon.spy(console, "log");
        sinon.spy(console, "error");
        sinon.spy(console, "warn");
        Sequenx.Log.isEnabled=true;
    });

    afterEach(function() {
        console.log.restore();
        console.error.restore();
        console.warn.restore();
    });

    it("should be able log info", function() {
        var l = new Sequenx.Log("log");
        l.info("message");
        expect(console.log.called).to.be.true;
        expect(console.log.getCall(0).args[0]).to.be.equal("("+(Sequenx.Log.s_nextId-1)+") log"+Sequenx.Log.StartSuffix);
        expect(console.log.getCall(1).args[0]).to.be.equal("("+(Sequenx.Log.s_nextId-1)+") log     message");
    });

    it("should be able log warning", function() {
        var l = new Sequenx.Log("log");
        l.warning("message");
        expect(console.warn.calledOnce).to.be.true;
        expect(console.warn.getCall(0).args[0]).to.be.equal("("+(Sequenx.Log.s_nextId-1)+") log     message");
    });

    it("should be able log error", function() {
        var l = new Sequenx.Log("log");
        l.error("message");
        expect(console.error.calledOnce).to.be.true;
        expect(console.error.getCall(0).args[0]).to.be.equal("("+(Sequenx.Log.s_nextId-1)+") log     message");
    });

    it("should be return name when convert to string", function() {
        var l = new Sequenx.Log("log");
        expect(l.toString()).to.equal("("+(Sequenx.Log.s_nextId-1)+") log");
    });

    it("should be able log info with parameter", function() {
        var l = new Sequenx.Log("log");
        l.info("message {0}",2);
        expect(console.log.getCall(1).args[0]).to.be.equal("("+(Sequenx.Log.s_nextId-1)+") log     message 2");
    });

    it("should be able log error with parameter", function() {
        var l = new Sequenx.Log("log");
        l.error("message {0}",2);
        expect(console.error.getCall(0).args[0]).to.be.equal("("+(Sequenx.Log.s_nextId-1)+") log     message 2");
    });

    it("should be able log warning with parameter", function() {
        var l = new Sequenx.Log("log");
        l.warning("message {0}",2);
        expect(console.warn.getCall(0).args[0]).to.be.equal("("+(Sequenx.Log.s_nextId-1)+") log     message 2");
    });
});