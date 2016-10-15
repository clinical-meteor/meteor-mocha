var ConsoleReporter, MochaRunner, XUnitReporter,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

MochaRunner = require("../lib/MochaRunner");

ConsoleReporter = require("./ConsoleReporter");

XUnitReporter = (function(superClass) {
  extend(XUnitReporter, superClass);

  XUnitReporter.VERSION = "0.1.0";

  XUnitReporter.prototype.xUnitPrefix = "##_meteor_magic##xunit: ";

  function XUnitReporter(clientRunner, serverRunner, options) {
    this.clientRunner = clientRunner;
    this.serverRunner = serverRunner;
    this.options = options;
    this.clientTests = [];
    this.serverTests = [];
    MochaRunner.on("end all", (function(_this) {
      return function() {
        return _this.printTestSuite();
      };
    })(this));
    XUnitReporter.__super__.constructor.call(this, this.clientRunner, this.serverRunner, this.options);
  }


  /*
    Overwrite from ConsoleReporter
   */

  XUnitReporter.prototype.registerRunnerEvents = function(where) {
    XUnitReporter.__super__.registerRunnerEvents.call(this, where);
    this[where + "Runner"].on('pending', (function(_this) {
      return function(test) {
        return _this[where + "Tests"].push(test);
      };
    })(this));
    this[where + "Runner"].on('pass', (function(_this) {
      return function(test) {
        return _this[where + "Tests"].push(test);
      };
    })(this));
    return this[where + "Runner"].on('fail', (function(_this) {
      return function(test) {
        return _this[where + "Tests"].push(test);
      };
    })(this));
  };

  XUnitReporter.prototype.printTestSuite = function() {
    var testSuite;
    testSuite = {
      name: 'Mocha Tests',
      tests: this.stats.total,
      failures: this.stats.failures,
      errors: this.stats.failures,
      timestamp: (new Date).toUTCString(),
      time: this.stats.duration / 1000 || 0,
      skipped: this.stats.pending
    };
    this.write(this.createTag('testsuite', testSuite, false));
    this.clientTests.forEach((function(_this) {
      return function(test) {
        return _this.printTestCase(test, "Client");
      };
    })(this));
    this.serverTests.forEach((function(_this) {
      return function(test) {
        return _this.printTestCase(test, "Server");
      };
    })(this));
    return this.write('</testsuite>');
  };


  /**
   * HTML tag helper.
  #
   * @param name
   * @param attrs
   * @param close
   * @param content
   * @return {string}
   */

  XUnitReporter.prototype.createTag = function(name, attrs, close, content) {
    var end, key, pairs, tag;
    if (attrs == null) {
      attrs = {};
    }
    end = close ? '/>' : '>';
    pairs = [];
    tag = void 0;
    for (key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        pairs.push(key + '="' + this.escape(attrs[key]) + '"');
      }
    }
    tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;
    if (content) {
      tag += content + '</' + name + end;
    }
    return tag;
  };


  /**
   * Return cdata escaped CDATA `str`.
   */

  XUnitReporter.prototype.cdata = function(str) {
    return '<![CDATA[' + this.escape(str) + ']]>';
  };


  /**
   * Override done to close the stream (if it's a file).
  #
   * @param failures
   * @param {Function} fn
   */

  XUnitReporter.prototype.done = function(failures, fn) {
    return fn(failures);
  };


  /**
   * Write out the given line.
  #
   * @param {string} line
   */

  XUnitReporter.prototype.write = function(line) {
    return console.log(this.xUnitPrefix + line);
  };


  /**
   * Output tag for the given `test.`
  #
   * @param {Test} test
   */

  XUnitReporter.prototype.printTestCase = function(test, where) {
    var attrs, err, stack;
    attrs = {
      classname: where + " " + (test.parent.fullTitle()),
      name: test.title,
      time: test.duration / 1000 || 0
    };
    if (test.state === 'failed') {
      err = test.err;
      stack = this.escapeStack(err.stack);
      this.write(this.createTag('testcase', attrs, false, this.createTag('failure', {}, false, this.cdata(this.escape(err.message) + '\n' + stack))));
    } else if (test.pending) {
      this.write(this.createTag('testcase', attrs, false, this.createTag('skipped', {}, true)));
    } else {
      this.write(this.createTag('testcase', attrs, true));
    }
  };


  /**
   * Escape special characters in the given string of html.
  #
   * @api private
   * @param  {string} html
   * @return {string}
   */

  XUnitReporter.prototype.escape = function(html) {
    return String(html).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };


  /**
   * For each line add the @xUnitPrefix and escape special characters in the given string of html.
  #
   * @api private
   * @param  {string} stack
   * @return {string}
   */

  XUnitReporter.prototype.escapeStack = function(stack) {
    if (stack == null) {
      stack = "";
    }
    return stack.split("\n").map((function(_this) {
      return function(s) {
        return _this.xUnitPrefix + _this.escape(s);
      };
    })(this)).join("\n");
  };

  return XUnitReporter;

})(ConsoleReporter);

module.exports = XUnitReporter;

// ---
// generated by coffee-script 1.9.2
