var BaseReporter, MeteorPublishReporter, ObjectLogger, _, log,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require("underscore")._;

BaseReporter = require("./BaseReporter");

ObjectLogger = require("meteor/practicalmeteor:loglevel").ObjectLogger;

log = new ObjectLogger('MeteorPublishReporter', 'info');

MeteorPublishReporter = (function(superClass) {
  extend(MeteorPublishReporter, superClass);

  MeteorPublishReporter.publisher = null;

  function MeteorPublishReporter(runner, options) {
    this.errorJSON = bind(this.errorJSON, this);
    this.added = bind(this.added, this);
    var HTML_REPORTER, REPORTERS, mochaReporter, ref;
    try {
      log.enter('constructor', arguments);
      expect(options.reporterOptions, 'options.reporterOptions').to.be.an('object');
      runner.grep(options.reporterOptions.grep);
      MeteorPublishReporter.__super__.constructor.call(this, runner, options);
      this.publisher = options.reporterOptions.publisher;
      expect(this.publisher, '@publisher').to.be.an('object');
      expect(this.publisher.ready, '@publisher.ready').to.be.a('function');
      expect(this.publisher.added, '@publisher.added').to.be.a('function');
      expect(this.publisher.onStop, '@publisher.onStop').to.be.a('function');
      this.publisher.onStop((function(_this) {
        return function() {
          return _this.stopped = true;
        };
      })(this));
      this.stopped = false;
      this.sequence = 0;
      this.added = Meteor.bindEnvironment(this.added, null, this);
      ref = require("./index"), REPORTERS = ref.REPORTERS, HTML_REPORTER = ref.HTML_REPORTER;
      mochaReporter = process.env.MOCHA_REPORTER || HTML_REPORTER;
      if (mochaReporter && !_.contains(REPORTERS, mochaReporter)) {
        log.info("Can't find '" + mochaReporter + "' reporter. Using '" + HTML_REPORTER + "' instead.");
        mochaReporter = HTML_REPORTER;
      }
      this.added('run mocha', {
        reporter: mochaReporter,
        runOrder: process.env.MOCHA_RUN_ORDER || 'parallel'
      });
      this.runner.on('start', (function(_this) {
        return function() {
          try {
            log.enter('onStart', arguments);
            return _this.added('start', _this.stats);
          } finally {
            log["return"]();
          }
        };
      })(this));
      this.runner.on('suite', (function(_this) {
        return function(suite) {
          try {
            log.enter('onSuite', arguments);
            return _this.added('suite', _this.cleanSuite(suite));
          } finally {
            log["return"]();
          }
        };
      })(this));
      this.runner.on('suite end', (function(_this) {
        return function(suite) {
          try {
            log.enter('onSuiteEnd', arguments);
            return _this.added('suite end', _this.cleanSuite(suite));
          } finally {
            log["return"]();
          }
        };
      })(this));
      this.runner.on('test end', (function(_this) {
        return function(test) {
          try {
            log.enter('onTestEnd', arguments);
            return _this.added('test end', _this.cleanTest(test));
          } finally {
            log["return"]();
          }
        };
      })(this));
      this.runner.on('pass', (function(_this) {
        return function(test) {
          try {
            log.enter('onPass', arguments);
            return _this.added('pass', _this.cleanTest(test));
          } finally {
            log["return"]();
          }
        };
      })(this));
      this.runner.on('fail', (function(_this) {
        return function(test, error) {
          try {
            log.enter('onFail', arguments);
            return _this.added('fail', _this.cleanTest(test));
          } finally {
            log["return"]();
          }
        };
      })(this));
      this.runner.on('end', (function(_this) {
        return function() {
          try {
            log.enter('onEnd', arguments);
            return _this.added('end', _this.stats);
          } finally {
            log["return"]();
          }
        };
      })(this));
      this.runner.on('pending', (function(_this) {
        return function(test) {
          try {
            log.enter('onPending', arguments);
            log.debug("test", test);
            return _this.added('pending', _this.cleanTest(test));
          } finally {
            log["return"]();
          }
        };
      })(this));
    } finally {
      log["return"]();
    }
  }

  MeteorPublishReporter.prototype.added = function(event, data) {
    var doc, ex;
    try {
      log.enter('added', arguments);
      if (this.stopped === true) {
        return;
      }
      this.sequence++;
      doc = {
        _id: "" + this.sequence,
        event: event,
        data: data
      };
      return this.publisher.added('mochaServerRunEvents', doc._id, doc);
    } catch (_error) {
      ex = _error;
      log.error("Can't send report data to client.");
      log.error("Error:", ex.stack || ex.message);
      return log.error("Document:", doc);
    } finally {
      log["return"]();
    }
  };


  /**
   * Return a plain-object representation of `test`
   * free of cyclic properties etc.
  #
   * @param {Object} test
   * @return {Object}
   * @api private
   */

  MeteorPublishReporter.prototype.cleanTest = function(test) {
    var ex, properties, ref;
    try {
      log.enter("cleanTest", arguments);
      properties = ["title", "type", "state", "speed", "pending", "duration", "async", "sync", "_timeout", "_slow", "body"];
      return _.extend(_.pick(test, properties), {
        _fullTitle: test.fullTitle(),
        parent: this.cleanSuite(test.parent),
        fn: (ref = test.fn) != null ? ref.toString() : void 0,
        err: this.errorJSON(test.err),
        isServer: true
      });
    } catch (_error) {
      ex = _error;
      return log.error(ex);
    } finally {
      log["return"]();
    }
  };

  MeteorPublishReporter.prototype.cleanSuite = function(suite) {
    var ex;
    try {
      log.enter("cleanSuite", arguments);
      return _.extend(_.pick(suite, ["title", "root", "pending"]), {
        _fullTitle: suite.fullTitle(),
        isServer: true
      });
    } catch (_error) {
      ex = _error;
      return log.error(ex);
    } finally {
      log["return"]();
    }
  };


  /**
   * Transform `error` into a JSON object.
   * @param {Error} err
   * @return {Object}
   */

  MeteorPublishReporter.prototype.errorJSON = function(err) {
    if (!err) {
      return;
    }

    /*
      Only picking the defaults properties define by ECMAScript to avoid problems
      with custom error that may have properties that can't be stringify such as functions.
      See https://goo.gl/bsZh3B and https://goo.gl/AFp6KB
     */
    return _.pick(err, ["name", "message", "stack"]);
  };

  return MeteorPublishReporter;

})(BaseReporter);

module.exports = MeteorPublishReporter;

// ---
// generated by coffee-script 1.9.2
