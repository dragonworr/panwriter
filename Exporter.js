"use strict";

const ipcRenderer = require('electron').ipcRenderer
    , remote      = require('electron').remote
    , path        = require('path')
    , spawn       = require('child_process').spawn
    , Document    = require('./Document')
    ;

var previousExportConfig;

ipcRenderer.on('fileExport', function() {
  const win = remote.getCurrentWindow()
      , spawnOpts = {}
      , inputPath = Document.getPath()
      ;
  var defaultPath;
  if (inputPath !== undefined) {
    spawnOpts.cwd = path.dirname(inputPath);
    defaultPath   = path.basename(inputPath, path.extname(inputPath))
  }

  const outputPath = remote.dialog.showSaveDialog(win, {
    defaultPath: defaultPath
  , buttonLabel: 'Export'
  , filters: exportFormats()
  });
  if (outputPath !== undefined){
    let exp = {
      outputPath: outputPath
    , spawnOpts: spawnOpts
    };
    fileExport(exp);
    previousExportConfig = exp;
  }
});

ipcRenderer.on('fileExportLikePrevious', function() {
  if (previousExportConfig) {
    fileExport(previousExportConfig);
  } else {
    alert('This document has not been exported yet, since it was opened.');
  }
});


// takes export settings object
function fileExport(exp) {
  const win  = remote.getCurrentWindow()
      , cmd  = 'pandoc'
      , args = getArgs(exp.outputPath)
      , cmdDebug = cmd + ' ' + args.join(' ')
      ;
  const pandoc = spawn(cmd, args, exp.spawnOpts);
  pandoc.stdin.write( Document.getMd() );
  pandoc.stdin.end();

  pandoc.on('error', function(err) {
    alert("Failed to execute command:\n" + cmdDebug + '\n\n' + err.message);
  });

  const errout = [];
  pandoc.stderr.on('data', function(data) {
    errout.push(data);
  });
  
  pandoc.on('close', function(exitCode) {
    const success = exitCode === 0
        , toMsg = "Called: " + cmdDebug
        ;
    remote.dialog.showMessageBox(win, {
      type:    success ? 'info' : 'error'
    , message: success ? 'Success!' : 'Failed to export'
    , detail:  [toMsg, ''].concat( errout.join('') ).join('\n')
    , buttons: ['OK']
    });
  });
};


// constructs commandline arguments from YAML metadata
// simplified version of what I did in https://github.com/mb21/panrun
function getArgs(outputPath) {
  const meta = Document.getMeta()
      , output = meta.output
      , args = []
      ;
  let toFormat = path.extname(outputPath)
  if (toFormat && toFormat[0] === '.') {
    toFormat = toFormat.substr(1);
  }

  if (toFormat === 'pdf') {
    toFormat = meta['pdf-format'] || 'latex'
  } else if (toFormat === 'tex') {
    toFormat = 'latex'
  }

  if (output && typeof output[toFormat] === 'object') {
    const out = output[toFormat];

    //make sure output goes to file user selected in GUI
    out.output = outputPath;

    // allow user to set `to: epub2`, `to: gfm`, `to: revealjs` etc.
    if (out.to === undefined) {
      out.to = toFormat;
    }

    if (out.standalone !== false) {
      // unless explicitly disabled, use `-s`
      out.standalone = true;
    }

    Object.keys(out).forEach(opt => {
      const val = out[opt];
      if ( Array.isArray(val) ) {
        val.forEach(v => {
          args.push('--' + opt);
          args.push(v);
        });
      } else if (typeof val === 'object') {
        Object.keys(val).forEach(k => {
          args.push('--' + opt);
          args.push(k + '=' + val[k]);
        });
      } else if (val !== false) {
        args.push('--' + opt);
        if (val && val !== true) {
          // pandoc boolean options don't take a value
          args.push( val.toString() );
        }
      }
    });

    return args;
  } else {
    return ['-s', '-o', outputPath];
  }
}

// we rely on the extension to detect target format
// see https://github.com/electron/electron/issues/15254
// list based on https://github.com/jgm/pandoc/blob/master/README.md
function exportFormats() {
  return [
    { name: 'HTML (html)',                    extensions: ['html'] }
  , { name: 'Word (docx)',                    extensions: ['docx'] }
  , { name: 'LaTeX (latex)',                  extensions: ['tex'] }
  , { name: 'PDF (latex | context | html | ms)', extensions: ['pdf'] }
  , { name: 'ConTeXt (context)',              extensions: ['context'] }
  , { name: 'InDesign ICML (icml)',           extensions: ['icml'] }
  , { name: 'PowerPoint (pptx)',              extensions: ['pptx'] }
  , { name: 'OpenOffice/LibreOffice (odt)',   extensions: ['odt'] }
  , { name: 'RTF (rtf)',                      extensions: ['rtf'] }
  , { name: 'EPUB (epub)',                    extensions: ['epub'] }
  , { name: 'DocBook XML (docbook)',          extensions: ['docbook'] }
  , { name: 'JATS XML (jats)',                extensions: ['jats'] }
  , { name: 'Text Encoding Initiative (tei)', extensions: ['tei'] }
  , { name: 'OPML (opml)',                    extensions: ['opml'] }
  , { name: 'FictionBook2 (fb2)',             extensions: ['fb2'] }
  , { name: 'groff (ms)',                     extensions: ['ms'] }
  , { name: 'GNU Texinfo (texinfo)',          extensions: ['texinfo'] }
  , { name: 'Textile (textile)',              extensions: ['textile'] }
  , { name: 'DokuWiki (dokuwiki)',            extensions: ['dokuwiki'] }
  , { name: 'MediaWiki (mediawiki)',          extensions: ['mediawiki'] }
  , { name: 'Muse (muse)',                    extensions: ['muse'] }
  , { name: 'ZimWiki (zimwiki)',              extensions: ['zimwiki'] }
  , { name: 'AsciiDoc (asciidoc)',            extensions: ['asciidoc'] }
  , { name: 'Emacs Org mode (org)',           extensions: ['org'] }
  , { name: 'reStructuredText (rst)',         extensions: ['rst'] }
  , { name: 'Markdown (md)',                  extensions: ['md'] }
  , { name: 'Plain text (txt)',               extensions: ['txt'] }
  , { name: 'Other format',                   extensions: ['*'] }
  ];
}
