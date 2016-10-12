var companion = require('companion');
var sinon = require('sinon');
var expect = require("chai").expect;
var assert = require("chai").assert;
var Sequenx = require('../js/sequenx.js');


// Test
describe("Disposable", function() {
    describe("refCountDisposable", function() {
        it("should be able to dispose RefCountDisposable", function(done) {
            var refCount = new Sequenx.RefCountDisposable(Sequenx.Disposable.create(done));
            refCount.dispose();
        });

        it("should be not dispose since all ref was disposed", function(done) {
            var count = 0;
            var refCount = new Sequenx.RefCountDisposable(Sequenx.Disposable.create(() => {
                expect(count).to.equal(3);
                done();
            }));
            count++;
            var d = refCount.getDisposable();
            count++;
            refCount.getDisposable().dispose();
            count++;
            refCount.dispose();
            d.dispose();
        });


        it("should be not dispose since RefCountDisposable was dispose", function() {
            var refCount = new Sequenx.RefCountDisposable(Sequenx.Disposable.create(() => {
                assert.fail();
            }));
            refCount.getDisposable().dispose();
        });
    });
});