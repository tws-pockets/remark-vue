var renderer = require("vue-server-renderer").createRenderer({
  template: "<!--vue-ssr-outlet-->"
});

module.exports = require("vue");
module.exports.renderToString = renderer.renderToString;
