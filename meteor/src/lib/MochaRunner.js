var EventEmitter, MeteorPublishReporter, Mocha, MochaRunner, Mongo, ObjectLogger, Suite, Test, _, log, utils,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require("underscore")._;

Test = require("mocha/lib/test");

Suite = require("mocha/lib/suite");

utils = require("mocha/lib/utils");

Mongo = require("meteor/mongo").Mongo;

Mocha = require("meteor/practicalmeteor:mocha-core").Mocha;

EventEmitter = require("events").EventEmitter;

ObjectLogger = require("meteor/practicalmeteor:loglevel").ObjectLogger;

MeteorPublishReporter = require("./../reporters/MeteorPublishReporter");

log = new ObjectLogger('MochaRunner', 'info');

MochaRunner = (function(superClass) {
  extend(MochaRunner, superClass);

  MochaRunner.instance = null;

  MochaRunner.get = function() {
    return MochaRunner.instance != null ? MochaRunner.instance : MochaRunner.instance = new MochaRunner();
  };

  MochaRunner.prototype.VERSION = "2.4.5_6";

  MochaRunner.prototype.serverRunEvents = null;

  MochaRunner.prototype.publishers = {};

  function MochaRunner() {
    this.onServerRunSubscriptionReady = bind(this.onServerRunSubscriptionReady, this);
    this.runServerTests = bind(this.runServerTests, this);
    try {
      log.enter('constructor');
      this.utils = utils;
      this.serverRunEvents = new Mongo.Collection('mochaServerRunEvents');
      if (Meteor.isServer) {
        Meteor.methods({
          "mocha/runServerTests": this.runServerTests.bind(this)
        });
        this.publish();
      }
    } finally {
      log["return"]();
    }
  }

  MochaRunner.prototype.publish = function() {
    var self;
    try {
      log.enter("publish");
      self = this;
      return Meteor.publish('mochaServerRunEvents', function(runId) {
        var base, ex;
        try {
          log.enter('publish.mochaServerRunEvents');
          check(runId, String);
          expect(this.ready).to.be.a('function');
          if ((base = self.publishers)[runId] == null) {
            base[runId] = this;
          }
          this.ready();
          return void 0;
        } catch (_error) {
          ex = _error;
          if (ex.stack != null) {
            log.error(ex.stack);
          }
          throw new Meteor.Error('unknown-error', (ex.message != null ? ex.message : void 0), (ex.stack != null ? ex.stack : void 0));
        } finally {
          log["return"]();
        }
      });
    } finally {
      log["return"]();
    }
  };

  MochaRunner.prototype.runServerTests = function(runId, grep) {
    var mochaRunner;
    try {
      log.enter("runServerTests", runId);
      check(runId, String);
      check(grep, Match.Optional(Match.OneOf(null, String)));
      expect(runId).to.be.a("string");
      expect(this.publishers[runId], "publisher").to.be.an("object");
      expect(Meteor.isServer).to.be["true"];
      mochaRunner = new Mocha();
      this._addTestsToMochaRunner(mocha.suite, mochaRunner.suite);
      mochaRunner.reporter(MeteorPublishReporter, {
        grep: this.escapeGrep(grep),
        publisher: this.publishers[runId]
      });
      log.info("Starting server side tests with run id " + runId);
      return mochaRunner.run(function(failures) {
        return log.warn('failures:', failures);
      });
    } finally {
      log["return"]();
    }
  };

  MochaRunner.prototype._addTestsToMochaRunner = function(fromSuite, toSuite) {
    var addHooks, i, j, len, len1, newSuite, ref, ref1, results, suite, test;
    try {
      log.enter("_addTestToMochaRunner");
      addHooks = function(hookName) {
        var hook, i, len, ref;
        ref = fromSuite["_" + hookName];
        for (i = 0, len = ref.length; i < len; i++) {
          hook = ref[i];
          toSuite[hookName](hook.title, hook.fn);
        }
        return log.debug("Hook " + hookName + " for '" + (fromSuite.fullTitle()) + "' added.");
      };
      addHooks("beforeAll");
      addHooks("afterAll");
      addHooks("beforeEach");
      addHooks("afterEach");
      ref = fromSuite.tests;
      for (i = 0, len = ref.length; i < len; i++) {
        test = ref[i];
        test = new Test(test.title, test.fn);
        toSuite.addTest(test);
        log.debug("Tests for '" + (fromSuite.fullTitle()) + "' added.");
      }
      ref1 = fromSuite.suites;
      results = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        suite = ref1[j];
        newSuite = Suite.create(toSuite, suite.title);
        newSuite.timeout(suite.timeout());
        log.debug("Suite " + (newSuite.fullTitle()) + "  added to '" + (fromSuite.fullTitle()) + "'.");
        results.push(this._addTestsToMochaRunner(suite, newSuite));
      }
      return results;
    } finally {
      log["return"]();
    }
  };

  MochaRunner.prototype.runEverywhere = function() {
    try {
      log.enter('runEverywhere');
      expect(Meteor.isClient).to.be["true"];
      this.runId = Random.id();
      return this.serverRunSubscriptionHandle = Meteor.subscribe('mochaServerRunEvents', this.runId, {
        onReady: _.bind(this.onServerRunSubscriptionReady, this),
        onError: _.bind(this.onServerRunSubscriptionError, this)
      });
    } finally {
      log["return"]();
    }
  };

  MochaRunner.prototype.setReporter = function(reporter1) {
    this.reporter = reporter1;
  };

  MochaRunner.prototype.escapeGrep = function(grep) {
    var matchOperatorsRe;
    if (grep == null) {
      grep = '';
    }
    try {
      log.enter("escapeGrep", grep);
      matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
      grep.replace(matchOperatorsRe, '\\$&');
      return new RegExp(grep);
    } finally {
      log["return"]();
    }
  };

  MochaRunner.prototype.onServerRunSubscriptionReady = function() {
    var ClientServerReporter, REPORTERS, query, ref, reporters;
    try {
      log.enter('onServerRunSubscriptionReady');
      ClientServerReporter = require("./../reporters/ClientServerReporter");
      ref = require("../reporters"), REPORTERS = ref.REPORTERS, reporters = ref.reporters;
      query = utils.parseQuery(location.search || '');
      Meteor.call("mocha/runServerTests", this.runId, query.grep, function(err) {
        log.debug("tests started");
        if (err) {
          return log.error(err);
        }
      });
      return Tracker.autorun((function(_this) {
        return function() {
          var event, reporter;
          event = _this.serverRunEvents.findOne({
            event: "run mocha"
          });
          if (((event != null ? event.data.reporter : void 0) != null) && _.contains(REPORTERS, event.data.reporter)) {
            reporter = reporters[event.data.reporter];
            _this.setReporter(reporter);
          }
          if ((event != null ? event.data.runOrder : void 0) === "serial") {
            return reporter = new ClientServerReporter(null, {
              runOrder: "serial"
            });
          } else if ((event != null ? event.data.runOrder : void 0) === "parallel") {
            mocha.reporter(ClientServerReporter);
            return mocha.run(function() {});
          }
        };
      })(this));
    } finally {
      log["return"]();
    }
  };

  MochaRunner.prototype.onServerRunSubscriptionError = function(meteorError) {
    try {
      log.enter('onServerRunSubscriptionError');
      return log.error(meteorError);
    } finally {
      log["return"]();
    }
  };

  return MochaRunner;

})(EventEmitter);

module.exports = MochaRunner.get();

// ---
// generated by coffee-script 1.9.2
