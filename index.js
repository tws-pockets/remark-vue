"use strict";

module.exports = remarkVue;

var toHAST = require("mdast-util-to-hast");
var sanitize = require("hast-util-sanitize");
var toH = require("hast-to-hyperscript");
var tableCellStyle = require("@mapbox/hast-util-table-cell-style");

var globalVue;

try {
  globalVue = require("vue");
} catch (err) {}

var own = {}.hasOwnProperty;

var TABLE_ELEMENTS = ["table", "thead", "tbody", "tfoot", "tr"];

/**
 * Attach a vue compiler.
 *
 * @param {Unified} processor - Instance.
 * @param {Object?} [options]
 * @param {Object?} [options.sanitize]
 *   - Sanitation schema.
 * @param {Object?} [options.remarkVueComponents]
 *   - Components.
 * @param {string?} [options.prefix]
 *   - Key prefix.
 * @param {Function?} [options.Vue]
 *   - Vue constructor.
 */
function remarkVue(options) {
  var settings = options || {};
  var Vue = settings.Vue || globalVue;
  var clean = settings.sanitize !== false;
  var scheme =
    clean && typeof settings.sanitize !== "boolean" ? settings.sanitize : null;
  var toHastOptions = settings.toHast || {};
  var components = settings.remarkVueComponents || {};

  this.Compiler = compile;

  /**
   * Wrapper around `createElement` to pass
   * components in.
   *
   * @param {string} name - Element name.
   * @param {Object} props - Attributes.
   *
   * @return {VueElement} - Vue element.
   */
  function hFactory(createElement) {
    return function h(name, props, children) {
      var component = own.call(components, name) ? components[name] : name;

      /*
       * Currently, a warning is triggered by react for
       * *any* white-space in tables.  So we remove the
       * pretty lines for now:
       * https://github.com/facebook/react/pull/7081
       */
      if (children && TABLE_ELEMENTS.indexOf(component) !== -1) {
        children = children.filter(function(child) {
          return child !== "\n";
        });
      }

      return createElement(component, props, children);
    };
  }

  /**
   * Compile MDAST to Vue.
   *
   * @param {Node} node - MDAST node.
   * @return {VueElement} - Vue element.
   */
  function compile(node) {
    var hast = {
      type: "root",
      properties: {},
      children: toHAST(node, toHastOptions).children
    };

    if (clean) {
      hast = sanitize(hast, scheme);
    }

    hast = tableCellStyle(hast);

    var vm = new Vue({
      render: function(c) {
        return c("div", {}, [toH(hFactory(c), hast, settings.prefix)]);
      }
    });

    return vm;
  }
}
