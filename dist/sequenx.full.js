var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Sequenx;
(function (Sequenx) {
    var Sequence = (function () {
        /**
         * @param nameOrLog specified Log to use or the log name.
         * @param autoStart if true start sequence async
         */
        function Sequence(nameOrLog, autoStart) {
            if (autoStart === void 0) { autoStart = false; }
            this.autoStart = autoStart;
            this._pendingExecution = Sequenx.Disposable.empty;
            this._tasks = new Array();
            this._isStarted = false;
            this._isDisposed = false;
            this._isCompleted = false;
            this._isExecuting = false;
            if (!nameOrLog)
                this._log = new Sequenx.Log("");
            else if (typeof nameOrLog === "string")
                this._log = new Sequenx.Log(nameOrLog);
            else if (nameOrLog)
                this._log = nameOrLog;
            if (autoStart)
                setTimeout(this.start.bind(this), 0);
        }
        Object.defineProperty(Sequence.prototype, "name", {
            /**
             * @returns sequence name used for log or null if don't have log
             */
            get: function () {
                return this._log.name;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * create a new Log child
         * @return ILog or null if no log
         */
        Sequence.prototype.createChildLog = function (name) {
            return this._log.createChild(name);
        };
        /**
         * Add a new item into the sequence
         * @param the sequence item to add
         */
        Sequence.prototype.add = function (task) {
            if (!task.start) {
                this._log.error("Trying to add something other than Sequenx.Item, use do if you use a function(lapse)");
                return;
            }
            if (this._isDisposed)
                throw new Error("Trying to add action to a disposed sequence.");
            this._tasks.push(task);
        };
        /**
         * Start the sequence
         * @param onComplete callback called when sequence is complete
         */
        Sequence.prototype.start = function (onComplete) {
            if (this._isStarted || this._isDisposed || this.autoStart)
                return;
            if (this._isCompleted && onComplete)
                onComplete();
            this._isStarted = true;
            this._cbComplete = onComplete || this._cbComplete;
            this.scheduleNext();
        };
        /**
         * Add a complete callback (useful when used with autoStart)
         *
         * @param cb callback function
         * @returns self for chaining
         */
        Sequence.prototype.onCompleted = function (cb) {
            this._cbComplete = cb;
            return this;
        };
        /**
         * Releases all resources of this object.
         */
        Sequence.prototype.dispose = function () {
            if (this._isDisposed)
                return;
            if (!this._isCompleted && this._log)
                this._log.warning("Cancelling (" + this._tasks.length + " items)");
            this.onSequenceComplete();
        };
        Sequence.prototype.scheduleNext = function () {
            this._pendingExecution.dispose();
            this.executeNext();
        };
        Sequence.prototype.onLastItemCompleted = function () {
            this.onSequenceComplete();
        };
        Sequence.prototype.executeNext = function () {
            var _this = this;
            if (this._isExecuting || this._isCompleted || this._isDisposed)
                return;
            // Nothing left to execute?
            if (this._tasks.length === 0) {
                this.onLastItemCompleted();
                return;
            }
            var item = this._tasks.shift();
            // Execute item
            try {
                this._isExecuting = true;
                item.start(function () {
                    _this._isExecuting = false;
                    _this.scheduleNext();
                });
            }
            catch (error) {
                this._isExecuting = false;
                //this.dispose();
                throw error;
            }
        };
        Sequence.prototype.onSequenceComplete = function () {
            if (this._isCompleted)
                return;
            this._tasks.length = 0;
            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();
            this._cbComplete && this._cbComplete();
        };
        // { do
        /**
         * Add a callback task to the sequence
         * @param action function to execute. By adding a callback (usually named done) the Sequence will wait wait for this function to be called to complete the task.
         * @param message Optional log message
         * @returns self for chaining
         *
         * @example
         * sequence.do(() => action()) //execute and complete (synchronous )
         * sequence.do((done) => setTimeout(done, 1000)) //execute and complete after 1sec (asynchronous)
         */
        Sequence.prototype.do = function (action, message) {
            this.add(new Sequenx.CallbackTask(action, message));
            return this;
        };
        /**
        * Add a task to dispose to the sequence
        * @param disposable IDisposable to dispose
        * @param message optional log message
        *
        * @returns self for chaining
        */
        Sequence.prototype.doDispose = function (disposable, message) {
            this.do(function () { return disposable.dispose(); }, message ? message : "Dispose");
            return this;
        };
        /**
         * Add a delay between task execution into the sequence
         * @param duration delay in millisecond
         * @param message optional log message
         *
         * @returns self for chaining
         */
        Sequence.prototype.doWait = function (duration, message) {
            this.do(function (done) { return setTimeout(done, duration); }, message ? message : "Wait " + (duration / 1000) + "s");
            return this;
        };
        /**
         * Wait util the returned disposable was dispose
         * @param message optional log message
         *
         * @returns Disposable to dispose for continue
         */
        Sequence.prototype.doWaitForDispose = function (message) {
            var disposable = new Sequenx.Disposable();
            this.do(function (done) { disposable.action = done; }, message ? message : "WaitForDispose");
            return disposable;
        };
        /**
         * Add a mark to sequence to use with {@link Sequence#skipToMarker}
         * @returns self for chaining
         */
        Sequence.prototype.doMark = function (marker) {
            this.add(new Sequenx.MarkTask(marker));
            return this;
        };
        /**
         * Create a new Parallel sequence. see {@link Parallel} for more information
         * @param action function
         * @param message optional log message
         *
         * @returns self for chaining
         *
         * @example
         * //wait util all sub task complete before complete task.
         * sequence.doParallel((parallel)=>{
         *    parallel.do((done) => setTimeout(done, 1000)) // executed in parallel
         *    parallel.do((done) => setTimeout(done, 100)) // executed in parallel
         * })
         */
        Sequence.prototype.doParallel = function (action, message) {
            var parallel = new Sequenx.Parallel();
            parallel.message = message ? message : "Parallel";
            action(parallel);
            this.add(parallel);
            return this;
        };
        /**
         * Create a sub Sequence
         * @param message optional log message
         * @returns self for chaining
         *
         * @example
         * //wait util all sub task complete before complete task.
         * sequence.doSequence((parallel)=>{
         *    parallel.do((done) => setTimeout(done, 1000)) //executed first
         *    parallel.do((done) => setTimeout(done, 100)) //executed next
         * })
         */
        Sequence.prototype.doSequence = function (action, message) {
            message = message ? message : "Sequence";
            var sequence = new Sequence(message);
            action(sequence);
            this.add(sequence);
            return this;
        };
        // }
        // { skip
        /**
         * Skip task and go to the marker see {@link Sequence#doMark}
         */
        Sequence.prototype.skipToMarker = function (marker, cancelCurrent) {
            if (cancelCurrent === void 0) { cancelCurrent = false; }
            this.skipTo(function (x) { return x instanceof Sequenx.MarkTask && x.marker === marker; });
        };
        Sequence.prototype.skipToEnd = function () {
            this.skip(function (x) { return true; });
        };
        Sequence.prototype.skip = function (predicate) {
            // Skip items until reaching a non-matching one
            while (this._tasks.length > 0 && predicate(this._tasks[0]))
                this._tasks.splice(0, 1);
        };
        Sequence.prototype.skipTo = function (predicate) {
            var index = -1;
            for (var i = 0; i < this._tasks.length; i++) {
                if (predicate(this._tasks[i])) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) {
                this._tasks = this._tasks.slice(index);
            }
        };
        return Sequence;
    }());
    Sequenx.Sequence = Sequence;
})(Sequenx || (Sequenx = {}));
/// <reference path="../sequenx/core/impl/Sequence.ts" />
if (typeof module !== 'undefined' && module.exports)
    this["Rx"] = require("rx-lite");
var Sequenx;
(function (Sequenx) {
    Sequenx.Sequence.prototype.doWaitForCompleted = function (observable, message) {
        this.do(function (done) { return observable.subscribeOnCompleted(done); }, message ? message : "WaitForCompleted");
        return this;
    };
    Sequenx.Sequence.prototype.doWaitForNext = function (observable, message) {
        this.do(function (done) { return observable.subscribeOnNext(done); }, message ? message : "WaitForNext");
        return this;
    };
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Disposable = (function () {
        function Disposable(action) {
            this.action = action;
            this._isDisposed = false;
        }
        Disposable.create = function (action) {
            return new Disposable(action);
        };
        Object.defineProperty(Disposable.prototype, "isDisposed", {
            get: function () {
                return this._isDisposed;
            },
            enumerable: true,
            configurable: true
        });
        Disposable.prototype.dispose = function () {
            !this._isDisposed && this.action && this.action();
            this._isDisposed = true;
        };
        Disposable.empty = new Disposable();
        return Disposable;
    }());
    Sequenx.Disposable = Disposable;
    // TODO to review
    var RefCountDisposable = (function (_super) {
        __extends(RefCountDisposable, _super);
        function RefCountDisposable(disposable) {
            _super.call(this);
            this.disposable = disposable;
            this._count = 0;
        }
        RefCountDisposable.prototype.dispose = function () {
            if (!this._isDisposed) {
                this._isPrimaryDisposed = true;
                if (this._count <= 0) {
                    this._isDisposed = true;
                    this.disposable.dispose();
                }
            }
        };
        RefCountDisposable.prototype.getDisposable = function () {
            var _this = this;
            if (this._isDisposed)
                return Disposable.empty;
            this._count++;
            return Disposable.create(function () {
                _this._count--;
                if (_this._isPrimaryDisposed && _this._count <= 0)
                    _this.disposable.dispose();
            });
        };
        return RefCountDisposable;
    }(Disposable));
    Sequenx.RefCountDisposable = RefCountDisposable;
})(Sequenx || (Sequenx = {}));
/// <reference path="./ILog.ts"/>
var Sequenx;
(function (Sequenx) {
    var Log = (function () {
        function Log(name, parent) {
            this._parent = parent;
            this._name = name != null ? name : "";
            this._id = Log.s_nextId++;
            if (Log.isEnabled)
                console.log(this.fullName + Log.StartSuffix);
        }
        Object.defineProperty(Log.prototype, "name", {
            get: function () {
                return this._name;
            },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        Log.prototype.toString = function () {
            return this.fullName;
        };
        Log.prototype.dispose = function () {
            if (this._isDisposed)
                return;
            if (Log.isEnabled)
                console.log(this.fullName + Log.EndSuffix);
            this._isDisposed = true;
        };
        Log.prototype.createChild = function (name) {
            return new Log(name, this);
        };
        Log.prototype.info = function (message) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            if (Log.isEnabled)
                console.log(this.format(message, params));
        };
        Log.prototype.warning = function (message) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            console.warn(this.format(message, params));
        };
        Log.prototype.error = function (message) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            console.error(this.format(message, params));
        };
        Object.defineProperty(Log.prototype, "fullName", {
            get: function () {
                if (this._fullName == null) {
                    if (this._parent != null)
                        this._fullName = this._parent.fullName + Log.PathSeparator + this.getNameWithId();
                    else
                        this._fullName = this.getNameWithId();
                }
                return this._fullName;
            },
            enumerable: true,
            configurable: true
        });
        Log.prototype.getNameWithId = function () {
            return "(" + this._id + ") " + this._name;
        };
        Log.prototype.format = function (message, params) {
            if (message && params != null && params.length > 0)
                message = this.strFormat(message, params);
            return this.fullName + Log.MessageSeparator + message;
        };
        Log.prototype.strFormat = function (str) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            var args = params;
            return str.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
        Log.PathSeparator = "     ";
        Log.MessageSeparator = "     ";
        Log.StartSuffix = " [START]";
        Log.EndSuffix = " [END]";
        Log.s_nextId = 1;
        Log.isEnabled = true;
        return Log;
    }());
    Sequenx.Log = Log;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    Sequenx.Sequence.prototype.doPromise = function (action) {
        this.do(function (done) { return action().then(function (v) { return done(); }); });
        return this;
    };
    Sequenx.Sequence.prototype.startPromise = function () {
        var _this = this;
        return new Promise(function (resolve) { return _this.start(resolve); });
    };
})(Sequenx || (Sequenx = {}));
Promise.prototype.start = function (cb) {
    this.then(cb);
};
var Sequenx;
(function (Sequenx) {
    var CallbackTask = (function () {
        function CallbackTask(action, message) {
            this.action = action;
            this.message = message;
        }
        CallbackTask.prototype.start = function (cb) {
            if (this.action.length > 0)
                this.action(cb);
            else {
                this.action();
                cb();
            }
        };
        CallbackTask.prototype.toString = function () {
            return "[Item] msg %s action %s", this.message, (this.action != null).toString();
        };
        return CallbackTask;
    }());
    Sequenx.CallbackTask = CallbackTask;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var MarkTask = (function () {
        function MarkTask(marker, message) {
            this.marker = marker;
            this.message = message;
        }
        MarkTask.prototype.start = function (cb) {
            cb();
        };
        MarkTask.prototype.toString = function () {
            return "[Item] msg %s mark %s", this.message, this.marker;
        };
        return MarkTask;
    }());
    Sequenx.MarkTask = MarkTask;
})(Sequenx || (Sequenx = {}));
/// <reference path="./Sequence.ts"/>
var Sequenx;
(function (Sequenx) {
    var Parallel = (function (_super) {
        __extends(Parallel, _super);
        function Parallel(nameOrLog, autoStart) {
            if (autoStart === void 0) { autoStart = false; }
            _super.call(this, nameOrLog, autoStart);
        }
        Parallel.prototype.scheduleNext = function () {
            var _this = this;
            var count = this._tasks.length;
            if (!count)
                return this._cbComplete && this._cbComplete();
            this._tasks.forEach(function (item) { return item
                .start(function () { return --count <= 0 && _this._cbComplete && _this._cbComplete(); }); });
            this._tasks = [];
        };
        Parallel.prototype.skip = function (predicate) {
            throw new Error("skip not implemented for Parallel");
        };
        Parallel.prototype.skipTo = function (predicate) {
            throw new Error("skipTo not implemented for Parallel");
        };
        return Parallel;
    }(Sequenx.Sequence));
    Sequenx.Parallel = Parallel;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    Sequenx.Sequence.prototype.doLapse = function (action, message) {
        if (message === void 0) { message = "Lapse"; }
        var lapse = new Sequenx.Lapse(this.createChildLog(message));
        this.do(function (done) {
            action(lapse);
            lapse.start(done);
        });
        return this;
    };
})(Sequenx || (Sequenx = {}));
/// <reference path="../ILapse.ts"/>
var Sequenx;
(function (Sequenx) {
    var Lapse = (function () {
        function Lapse(nameOrLog, autoStart) {
            var _this = this;
            if (autoStart === void 0) { autoStart = false; }
            this.autoStart = autoStart;
            if (!nameOrLog)
                this._log = new Sequenx.Log("");
            else if (typeof nameOrLog === "string")
                this._log = new Sequenx.Log(nameOrLog);
            else
                this._log = nameOrLog;
            this._refCountDisposable = new Sequenx.RefCountDisposable(Sequenx.Disposable.create(function () { return _this.lapseCompleted(); }));
            if (autoStart)
                setTimeout(function () { return _this.start(); }, 0);
        }
        Object.defineProperty(Lapse.prototype, "name", {
            get: function () {
                return this._log.name;
            },
            enumerable: true,
            configurable: true
        });
        Lapse.prototype.createChildLog = function (name) {
            return this._log.createChild(name);
        };
        Lapse.prototype.sustain = function (name) {
            if (this._isCompleted || this._isDisposed)
                return Sequenx.Disposable.empty;
            if (name && Sequenx.Log.isEnabled)
                this._log.info("Sustain " + name);
            return this._refCountDisposable.getDisposable();
        };
        Lapse.prototype.onCompleted = function (cb) {
            this._completed = cb;
        };
        Lapse.prototype.start = function (cb) {
            if (this._isStarted || this._isCompleted || this._isDisposed)
                return;
            this._isStarted = true;
            this._completed = cb || this._completed;
            this._refCountDisposable.dispose();
        };
        Lapse.prototype.dispose = function () {
            if (this._isDisposed)
                return;
            if (!this._isCompleted) {
                this._log.info("Cancelling");
            }
            this.lapseCompleted();
        };
        Lapse.prototype.lapseCompleted = function () {
            if (this._isCompleted)
                return;
            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();
            this._completed && this._completed();
        };
        //ILapseExtensions
        Lapse.prototype.sequence = function (action, message) {
            var sustain = this.sustain();
            var name = message ? message : 'Sequence';
            var log = this.createChildLog(name);
            var seq = new Sequenx.Sequence(log);
            action(seq);
            seq.start(function () { return sustain.dispose(); });
            return seq;
        };
        Lapse.prototype.child = function (action, message) {
            var sustain = this.sustain();
            var name = message ? message : 'Child';
            var log = this.createChildLog(name);
            var child = new Lapse(log);
            action(child);
            child.start(function () { return sustain.dispose(); });
        };
        return Lapse;
    }());
    Sequenx.Lapse = Lapse;
})(Sequenx || (Sequenx = {}));

if (typeof module !== 'undefined' && module.exports)
    module.exports= Sequenx