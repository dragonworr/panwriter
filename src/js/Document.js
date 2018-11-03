"use strict";

// Singleton Document,
// exists exactly once in each window renderer process.

var remote          = require('electron').remote
  , fs              = require('fs')
  , readDataDirFile = require('./Exporter').readDataDirFile
  ;

var md   = ""
  , html = ""
  , meta = {}
  , filePath = remote.getCurrentWindow().filePathToLoad
  ;

module.exports.setDoc = function(mdStr, htmlStr, metaObj) {
  md   = mdStr;
  html = htmlStr;
  meta = metaObj;
}

module.exports.getMd = function() {
  return md;
}

module.exports.getHtml = function() {
  return html;
}

module.exports.getMeta = function() {
  return meta;
}

var defaultStaticCss = ''
  , defaultCss = ''
  , docType = null
  ;
fs.readFile(remote.app.getAppPath() + '/static/default.css', 'utf8', (err, css) => {
  if (err) {
    console.warn(err.message)
  } else {
    defaultStaticCss = css;
  }
});
module.exports.getCss = async function() {
  if (meta.type !== docType) {
    // cache css
    docType = meta.type;
    try {
      defaultCss = await readDataDirFile(docType, '.css');
    } catch(e) {
      defaultCss = defaultStaticCss;
    }
  }
  return ( typeof meta.style === "string" )
           ? (defaultCss + meta.style)
           : defaultCss
           ;
}

module.exports.getPath = function() {
  return filePath;
}

module.exports.setPath = function(path) {
  filePath = path;
}
