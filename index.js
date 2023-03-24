"use strict";
import  {toHast} from "mdast-util-to-hast"
import  {sanitize} from "hast-util-sanitize"
import  toH from "hast-to-hyperscript"
import  tableCellStyle from "@mapbox/hast-util-table-cell-style"




var TABLE_ELEMENTS = ["table", "thead", "tbody", "tfoot", "tr"];
let settings = {
  sanitize : false,
  prefix : "",
  components : {},
  vueSettings : {}, 
  toHastOptions : {},

}
/**
 * Attach a vue compiler.
 *
 * @param {Unified} processor - Instance.
 * @param {Object?} [options]
 * @param {Object?} [options.sanitize]
 *   - Sanitation schema.
 * @param {Object?} [options.components]
 *   - Key Value List of tagnames and components. 
 * @param {string?} [options.prefix]
 *   - Key prefix.
 * @param {Function?} [options.Vue]
 *   - Vue constructor.
 *  @param {Function?} [options.vueSettings]
 *   - Settings for vue, gets added on new Vue(...)
 *  @param {Function?} [options.toHastOptions]
 *   - Vue constructor.
 */
function remarkVue(options) {
  settings = {
    ...settings,
    ...options,
  }
  // console.debug("Vue Renderer with ", settings)
  const {Vue, toHastOptions, components} = settings;
  var clean = settings.sanitize !== false;
  var scheme =
    clean && typeof settings.sanitize !== "boolean" ? settings.sanitize : null;

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
      var component =  components[name] || name;
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
      // console.log('COMP:' , props, components[name],name)
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
      children: toHast(node, toHastOptions).children
    };

    if (clean) {
      hast = sanitize(hast, scheme);
    }

    hast = tableCellStyle(hast);
    // console.log(settings.vueSettings)
    var vm = new Vue({
      ...settings.vueSettings,
      render: function(c) {
        return toH(hFactory(c), hast, settings.prefix);
      }
    });

    return vm;
  }
}

export default remarkVue;