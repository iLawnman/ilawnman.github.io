function createUnityInstance(canvas, config, onProgress) {
  onProgress = onProgress || function () {};

  var Module = {
    canvas: canvas,
    webglContextAttributes: {
      preserveDrawingBuffer: false,
    },
#if USE_DATA_CACHING
    cacheControl: function (url) {
      return url == Module.dataUrl ? "must-revalidate" : "no-store";
    },
#endif // USE_DATA_CACHING
#if !USE_WASM
    TOTAL_MEMORY: {{{ TOTAL_MEMORY }}},
#endif // !USE_WASM
    streamingAssetsUrl: "StreamingAssets",
    downloadProgress: {},
    deinitializers: [],
    intervals: {},
    setInterval: function (func, ms) {
      var id = window.setInterval(func, ms);
      this.intervals[id] = true;
      return id;
    },
    clearInterval: function(id) {
      delete this.intervals[id];
      window.clearInterval(id);
    },
    preRun: [],
    postRun: [],
    print: function (message) {
      console.log(message);
    },
    printErr: function (message) {
      console.error(message);
    },
    locateFile: function (url) {
      return (
#if USE_WASM && !DECOMPRESSION_FALLBACK
        url == "build.wasm" ? this.codeUrl :
#endif // USE_WASM && !DECOMPRESSION_FALLBACK
#if USE_THREADS
#if DECOMPRESSION_FALLBACK
        url == "pthread-main.js" ? this.frameworkBlobUrl :
#else // DECOMPRESSION_FALLBACK
        url == "pthread-main.js" ? this.frameworkUrl :
#endif // DECOMPRESSION_FALLBACK
#endif // USE_THREADS
        url
      );
    },
#if USE_THREADS
    // The contents of "pthread-main.js" is embedded in the framework, which is used as a worker source.
    // Therefore Module.mainScriptUrlOrBlob is no longer needed and is set to a dummy blob for compatibility reasons.
    mainScriptUrlOrBlob: new Blob([" "], { type: "application/javascript" }),
#endif // USE_THREADS
    disabledCanvasEvents: [
      "contextmenu",
      "dragstart",
    ],
  };

  for (var parameter in config)
    Module[parameter] = config[parameter];

  Module.streamingAssetsUrl = new URL(Module.streamingAssetsUrl, document.URL).href;

  Module.disabledCanvasEvents.forEach(function (disabledCanvasEvent) {
    canvas.addEventListener(disabledCanvasEvent, function (e) { e.preventDefault(); });
  });

  var unityInstance = {
    Module: Module,
    SetFullscreen: function () {
      if (Module.SetFullscreen)
        return Module.SetFullscreen.apply(Module, arguments);
      Module.print("Failed to set Fullscreen mode: Player not loaded yet.");
    },
    SendMessage: function () {
      if (Module.SendMessage)
        return Module.SendMessage.apply(Module, arguments);
      Module.print("Failed to execute SendMessage: Player not loaded yet.");
    },
    Quit: function () {
      return new Promise(function (resolve, reject) {
        Module.shouldQuit = true;
        Module.onQuit = resolve;
      });
    },
  };

  // The Unity WebGL generated content depends on SystemInfo, therefore it should not be changed. If any modification is necessary, do it at your own risk.
  Module.SystemInfo = (function () {
    var unknown = "-";
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browser = navigator.appName;
    var version = navigator.appVersion;
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;
    if ((verOffset = nAgt.indexOf("Opera")) != -1) {
      browser = "Opera";
      version = nAgt.substring(verOffset + 6);
      if ((verOffset = nAgt.indexOf("Version")) != -1) {
        version = nAgt.substring(verOffset + 8);
      }
    } else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
      browser = "Microsoft Internet Explorer";
      version = nAgt.substring(verOffset + 5);
    } else if ((verOffset = nAgt.indexOf("Edge")) != -1) {
      browser = "Edge";
      version = nAgt.substring(verOffset + 5);
    } else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
      browser = "Chrome";
      version = nAgt.substring(verOffset + 7);
    } else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
      browser = "Safari";
      version = nAgt.substring(verOffset + 7);
      if ((verOffset = nAgt.indexOf("Version")) != -1) {
        version = nAgt.substring(verOffset + 8);
      }
    } else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
      browser = "Firefox";
      version = nAgt.substring(verOffset + 8);
    } else if (nAgt.indexOf("Trident/") != -1) {
      browser = "Microsoft Internet Explorer";
      version = nAgt.substring(nAgt.indexOf("rv:") + 3);
    } else if ((nameOffset = nAgt.lastIndexOf(" ") + 1) < (verOffset = nAgt.lastIndexOf("/"))) {
      browser = nAgt.substring(nameOffset, verOffset);
      version = nAgt.substring(verOffset + 1);
      if (browser.toLowerCase() == browser.toUpperCase()) {
        browser = navigator.appName;
      }
    }
    if ((ix = version.indexOf(";")) != -1)
      version = version.substring(0, ix);
    if ((ix = version.indexOf(" ")) != -1)
      version = version.substring(0, ix);
    if ((ix = version.indexOf(")")) != -1)
      version = version.substring(0, ix);
    majorVersion = parseInt("" + version, 10);
    if (isNaN(majorVersion)) {
      version = "" + parseFloat(navigator.appVersion);
      majorVersion = parseInt(navigator.appVersion, 10);
    }
    else version = "" + parseFloat(version);
    var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);
    var os = unknown;
    var clientStrings = [
      {s: "Windows 3.11", r: /Win16/},
      {s: "Windows 95", r: /(Windows 95|Win95|Windows_95)/},
      {s: "Windows ME", r: /(Win 9x 4.90|Windows ME)/},
      {s: "Windows 98", r: /(Windows 98|Win98)/},
      {s: "Windows CE", r: /Windows CE/},
      {s: "Windows 2000", r: /(Windows NT 5.0|Windows 2000)/},
      {s: "Windows XP", r: /(Windows NT 5.1|Windows XP)/},
      {s: "Windows Server 2003", r: /Windows NT 5.2/},
      {s: "Windows Vista", r: /Windows NT 6.0/},
      {s: "Windows 7", r: /(Windows 7|Windows NT 6.1)/},
      {s: "Windows 8.1", r: /(Windows 8.1|Windows NT 6.3)/},
      {s: "Windows 8", r: /(Windows 8|Windows NT 6.2)/},
      {s: "Windows 10", r: /(Windows 10|Windows NT 10.0)/},
      {s: "Windows NT 4.0", r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
      {s: "Windows ME", r: /Windows ME/},
      {s: "Android", r: /Android/},
      {s: "Open BSD", r: /OpenBSD/},
      {s: "Sun OS", r: /SunOS/},
      {s: "Linux", r: /(Linux|X11)/},
      {s: "iOS", r: /(iPhone|iPad|iPod)/},
      {s: "Mac OS X", r: /Mac OS X/},
      {s: "Mac OS", r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
      {s: "QNX", r: /QNX/},
      {s: "UNIX", r: /UNIX/}, 
      {s: "BeOS", r: /BeOS/},
      {s: "OS/2", r: /OS\/2/},
      {s: "Search Bot", r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
    ];
    for (var id in clientStrings) {
      var cs = clientStrings[id];
      if (cs.r.test(nAgt)) {
        os = cs.s;
        break;
      }
    }
    var osVersion = unknown;
    if (/Windows/.test(os)) {
      osVersion = /Windows (.*)/.exec(os)[1];
      os = "Windows";
    }
    switch (os) {
    case "Mac OS X":
      osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
      break;
    case "Android":
      osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
      break;
    case "iOS":
      osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
      osVersion = osVersion[1] + "." + osVersion[2] + "." + (osVersion[3] | 0);
      break;
    }
    return {
      width: screen.width ? screen.width : 0,
      height: screen.height ? screen.height : 0,
      browser: browser,
      browserVersion: version,
      mobile: mobile,
      os: os,
      osVersion: osVersion,
      gpu: (function() {
        var canvas = document.createElement("canvas");
        var gl = canvas.getContext("experimental-webgl");
        if(gl) {
          var renderedInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if(renderedInfo) {
            return gl.getParameter(renderedInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
        return unknown;
      })(),
      language: window.navigator.userLanguage || window.navigator.language,
      hasWebGL: (function() {
        if (!window.WebGLRenderingContext) {
          return 0;
        }
        var canvas = document.createElement("canvas");
        var gl = canvas.getContext("webgl2");
        if (!gl) {
          gl = canvas.getContext("experimental-webgl2");
          if (!gl) {
            gl = canvas.getContext("webgl");
            if (!gl) {
              gl = canvas.getContext("experimental-webgl");
              if (!gl) {
                return 0;
              }
            }
            return 1;
          }
          return 2;
        }
        return 2;
      })(),
      hasCursorLock: (function() {
        var e = document.createElement("canvas");
        if (e["requestPointerLock"] || e["mozRequestPointerLock"] || e["webkitRequestPointerLock"] || e["msRequestPointerLock"]) return 1; else return 0;
      })(),
      hasFullscreen: (function() {
        var e = document.createElement("canvas");
        if (e["requestFullScreen"] || e["mozRequestFullScreen"] || e["msRequestFullscreen"] || e["webkitRequestFullScreen"]) {
          if (browser.indexOf("Safari") == -1 || version >= 10.1) return 1;
        }
        return 0;
      })(),
      hasThreads: typeof SharedArrayBuffer !== 'undefined',
      hasWasm: typeof WebAssembly == "object" && typeof WebAssembly.validate == "function" && typeof WebAssembly.compile == "function",
      hasWasmThreads: (function(){
        if (typeof WebAssembly != "object") return false;
        if (typeof SharedArrayBuffer === 'undefined') return false;

        var wasmMemory = new WebAssembly.Memory({"initial": 1, "maximum": 1, "shared": true});
        var isSharedArrayBuffer = wasmMemory.buffer instanceof SharedArrayBuffer;
        delete wasmMemory;
        return isSharedArrayBuffer;
      })(),
    };
  })();

  function errorHandler(message, filename, lineno) {
    if (Module.startupErrorHandler) {
      Module.startupErrorHandler(message, filename, lineno);
      return;
    }
    if (Module.errorHandler && Module.errorHandler(message, filename, lineno))
      return;
    console.log("Invoking error handler due to\n" + message);
    if (typeof dump == "function")
      dump("Invoking error handler due to\n" + message);
    // Firefox has a bug where it's IndexedDB implementation will throw UnknownErrors, which are harmless, and should not be shown.
    if (message.indexOf("UnknownError") != -1)
      return;
    // Ignore error when application terminated with return code 0
    if (message.indexOf("Program terminated with exit(0)") != -1)
      return;
    if (errorHandler.didShowErrorMessage)
      return;
    var message = "An error occurred running the Unity content on this page. See your browser JavaScript console for more info. The error was:\n" + message;
    if (message.indexOf("DISABLE_EXCEPTION_CATCHING") != -1) {
      message = "An exception has occurred, but exception handling has been disabled in this build. If you are the developer of this content, enable exceptions in your project WebGL player settings to be able to catch the exception or see the stack trace.";
    } else if (message.indexOf("Cannot enlarge memory arrays") != -1) {
      message = "Out of memory. If you are the developer of this content, try allocating more memory to your WebGL build in the WebGL player settings.";
    } else if (message.indexOf("Invalid array buffer length") != -1  || message.indexOf("Invalid typed array length") != -1 || message.indexOf("out of memory") != -1 || message.indexOf("could not allocate memory") != -1) {
      message = "The browser could not allocate enough memory for the WebGL content. If you are the developer of this content, try allocating less memory to your WebGL build in the WebGL player settings.";
    }
    alert(message);
    errorHandler.didShowErrorMessage = true;
  }

#if SYMBOLS_FILENAME
  function demangleMessage(message, symbols) {
#if USE_WASM
    var symbolExp = "(wasm-function\\[)(\\d+)(\\])";
#else // USE_WASM
    var symbolExp = "(\\n|\\n    at |\\n    at Array\\.)([a-zA-Z0-9_$]+)(@| \\()";
#endif // USE_WASM
    var symbolRegExp = new RegExp(symbolExp);
    return message.replace(new RegExp(symbolExp, "g"), function (symbol) {
      var match = symbol.match(symbolRegExp);
#if USE_WASM
      return match[1] + (symbols[match[2]] ? symbols[match[2]] + "@" : "") + match[2] + match[3];
#else // USE_WASM
      return match[1] + match[2] + (symbols[match[2]] ? "[" + symbols[match[2]] + "]" : "") + match[3];
#endif // USE_WASM
    });
  }

  function demanglingErrorHandler(message, filename, lineno) {
    if (Module.symbols) {
      errorHandler(demangleMessage(message, Module.symbols), filename, lineno);
    } else if (!Module.symbolsUrl) {
      errorHandler(message, filename, lineno);
    } else {
      downloadBinary("symbolsUrl").then(function (data) {
        var json = "";
        for (var i = 0; i < data.length; i++)
          json += String.fromCharCode(data[i]);
        Module.symbols = JSON.parse(json);
        errorHandler(demangleMessage(message, Module.symbols), filename, lineno);
      }).catch(function (error) {
        errorHandler(message, filename, lineno);
      });
    }
  }

#endif // SYMBOLS_FILENAME
  function errorListener(e) {
    var error = e.type == "unhandledrejection" && typeof e.reason == "object" ? e.reason : typeof e.error == "object" ? e.error : null;
    var message = error ? error.toString() : typeof e.message == "string" ? e.message : typeof e.reason == "string" ? e.reason : "";
    if (error && typeof error.stack == "string")
      message += "\n" + error.stack.substring(!error.stack.lastIndexOf(message, 0) ? message.length : 0).replace(/(^\n*|\n*$)/g, "");
    if (!message || !Module.stackTraceRegExp || !Module.stackTraceRegExp.test(message))
      return;
    var filename =
      e instanceof ErrorEvent ? e.filename :
      error && typeof error.fileName == "string" ? error.fileName :
      error && typeof error.sourceURL == "string" ? error.sourceURL :
      "";
    var lineno =
      e instanceof ErrorEvent ? e.lineno :
      error && typeof error.lineNumber == "number" ? error.lineNumber :
      error && typeof error.line == "number" ? error.line :
      0;
#if SYMBOLS_FILENAME
    demanglingErrorHandler(message, filename, lineno);
#else // SYMBOLS_FILENAME
    errorHandler(message, filename, lineno);
#endif // SYMBOLS_FILENAME
  }

  Module.abortHandler = function (message) {
#if SYMBOLS_FILENAME
    demanglingErrorHandler(message, "", 0);
#else // SYMBOLS_FILENAME
    errorHandler(message, "", 0);
#endif // SYMBOLS_FILENAME
    return true;
  };

  window.addEventListener("error", errorListener);
  window.addEventListener("unhandledrejection", errorListener);
  Error.stackTraceLimit = Math.max(Error.stackTraceLimit || 0, 50);

  function progressUpdate(id, e) {
    if (id == "symbolsUrl")
      return;
    var progress = Module.downloadProgress[id];
    if (!progress)
      progress = Module.downloadProgress[id] = {
        started: false,
        finished: false,
        lengthComputable: false,
        total: 0,
        loaded: 0,
      };
    if (typeof e == "object" && (e.type == "progress" || e.type == "load")) {
      if (!progress.started) {
        progress.started = true;
        progress.lengthComputable = e.lengthComputable;
        progress.total = e.total;
      }
      progress.loaded = e.loaded;
      if (e.type == "load")
        progress.finished = true;
    }
    var loaded = 0, total = 0, started = 0, computable = 0, unfinishedNonComputable = 0;
    for (var id in Module.downloadProgress) {
      var progress = Module.downloadProgress[id];
      if (!progress.started)
        return 0;
      started++;
      if (progress.lengthComputable) {
        loaded += progress.loaded;
        total += progress.total;
        computable++;
      } else if (!progress.finished) {
        unfinishedNonComputable++;
      }
    }
    var totalProgress = started ? (started - unfinishedNonComputable - (total ? computable * (total - loaded) / total : 0)) / started : 0;
    onProgress(0.9 * totalProgress);
  }

#if USE_DATA_CACHING
  {{{ read("XMLHttpRequest.js") }}}
#endif // USE_DATA_CACHING

#if DECOMPRESSION_FALLBACK
  var decompressors = {
#if DECOMPRESSION_FALLBACK == "Gzip"
    gzip: {
      require: {{{ read("Gzip.js") }}},
      decompress: function (data) {
        if (!this.exports)
          this.exports = this.require("inflate.js");
        try { return this.exports.inflate(data) } catch (e) {};
      },
      hasUnityMarker: function (data) {
        var commentOffset = 10, expectedComment = "UnityWeb Compressed Content (gzip)";
        if (commentOffset > data.length || data[0] != 0x1F || data[1] != 0x8B)
          return false;
        var flags = data[3];
        if (flags & 0x04) {
          if (commentOffset + 2 > data.length)
            return false;
          commentOffset += 2 + data[commentOffset] + (data[commentOffset + 1] << 8);
          if (commentOffset > data.length)
            return false;
        }
        if (flags & 0x08) {
          while (commentOffset < data.length && data[commentOffset])
            commentOffset++;
          if (commentOffset + 1 > data.length)
            return false;
          commentOffset++;
        }
        return (flags & 0x10) && String.fromCharCode.apply(null, data.subarray(commentOffset, commentOffset + expectedComment.length + 1)) == expectedComment + "\0";
      },
    },
#endif // DECOMPRESSION_FALLBACK == "Gzip"
#if DECOMPRESSION_FALLBACK == "Brotli"
    br: {
      require: {{{ read("Brotli.js") }}},
      decompress: function (data) {
        if (!this.exports)
          this.exports = this.require("decompress.js");
        try { return this.exports(data) } catch (e) {};
      },
      hasUnityMarker: function (data) {
        var expectedComment = "UnityWeb Compressed Content (brotli)";
        if (!data.length)
          return false;
        var WBITS_length = (data[0] & 0x01) ? (data[0] & 0x0E) ? 4 : 7 : 1,
            WBITS = data[0] & ((1 << WBITS_length) - 1),
            MSKIPBYTES = 1 + ((Math.log(expectedComment.length - 1) / Math.log(2)) >> 3);
            commentOffset = (WBITS_length + 1 + 2 + 1 + 2 + (MSKIPBYTES << 3) + 7) >> 3;
        if (WBITS == 0x11 || commentOffset > data.length)
          return false;
        var expectedCommentPrefix = WBITS + (((3 << 1) + (MSKIPBYTES << 4) + ((expectedComment.length - 1) << 6)) << WBITS_length);
        for (var i = 0; i < commentOffset; i++, expectedCommentPrefix >>>= 8) {
          if (data[i] != (expectedCommentPrefix & 0xFF))
            return false;
        }
        return String.fromCharCode.apply(null, data.subarray(commentOffset, commentOffset + expectedComment.length)) == expectedComment;
      },
    },
#endif // DECOMPRESSION_FALLBACK == "Brotli"
  };

  function decompress(compressed, url, callback) {
    for (var contentEncoding in decompressors) {
      if (decompressors[contentEncoding].hasUnityMarker(compressed)) {
        if (url)
          console.log("You can reduce startup time if you configure your web server to add \"Content-Encoding: " + contentEncoding + "\" response header when serving \"" + url + "\" file.");
        var decompressor = decompressors[contentEncoding];
        if (!decompressor.worker) {
          var workerUrl = URL.createObjectURL(new Blob(["this.require = ", decompressor.require.toString(), "; this.decompress = ", decompressor.decompress.toString(), "; this.onmessage = ", function (e) {
            var data = { id: e.data.id, decompressed: this.decompress(e.data.compressed) };
            postMessage(data, data.decompressed ? [data.decompressed.buffer] : []);
          }.toString(), "; postMessage({ ready: true });"], { type: "application/javascript" }));
          decompressor.worker = new Worker(workerUrl);
          decompressor.worker.onmessage = function (e) {
            if (e.data.ready) {
              URL.revokeObjectURL(workerUrl);
              return;
            }
            this.callbacks[e.data.id](e.data.decompressed);
            delete this.callbacks[e.data.id];
          };
          decompressor.worker.callbacks = {};
          decompressor.worker.nextCallbackId = 0;
        }
        var id = decompressor.worker.nextCallbackId++;
        decompressor.worker.callbacks[id] = callback;
        decompressor.worker.postMessage({id: id, compressed: compressed}, [compressed.buffer]);
        return;
      }
    }
    callback(compressed);
  }
#endif // DECOMPRESSION_FALLBACK

  function downloadBinary(urlId) {
    return new Promise(function (resolve, reject) {
      progressUpdate(urlId);
#if USE_DATA_CACHING
      var xhr = Module.companyName && Module.productName ? new Module.XMLHttpRequest({
        companyName: Module.companyName,
        productName: Module.productName,
        cacheControl: Module.cacheControl(Module[urlId]),
      }) : new XMLHttpRequest();
#else // USE_DATA_CACHING
      var xhr = new XMLHttpRequest();
#endif // USE_DATA_CACHING
      xhr.open("GET", Module[urlId]);
      xhr.responseType = "arraybuffer";
      xhr.addEventListener("progress", function (e) {
        progressUpdate(urlId, e);
      });
      xhr.addEventListener("load", function(e) {
        progressUpdate(urlId, e);
#if DECOMPRESSION_FALLBACK
        decompress(new Uint8Array(xhr.response), Module[urlId], resolve);
#else // DECOMPRESSION_FALLBACK
        resolve(new Uint8Array(xhr.response));
#endif // DECOMPRESSION_FALLBACK
      });
      xhr.send();
    });
  }

  function downloadFramework() {
#if DECOMPRESSION_FALLBACK
    return downloadBinary("frameworkUrl").then(function (code) {
      var blobUrl = URL.createObjectURL(new Blob([code], { type: "application/javascript" }));
#if USE_THREADS
      Module.frameworkBlobUrl = blobUrl;
#endif // USE_THREADS
#endif // DECOMPRESSION_FALLBACK
      return new Promise(function (resolve, reject) {
        var script = document.createElement("script");
#if DECOMPRESSION_FALLBACK
        script.src = blobUrl;
#else // DECOMPRESSION_FALLBACK
        script.src = Module.frameworkUrl;
#endif // DECOMPRESSION_FALLBACK
        script.onload = function () {
          delete script.onload;
#if DECOMPRESSION_FALLBACK && !USE_THREADS
          URL.revokeObjectURL(blobUrl);
#endif // DECOMPRESSION_FALLBACK && !USE_THREADS
          resolve(unityFramework);
        }
        document.body.appendChild(script);
        Module.deinitializers.push(function() {
          document.body.removeChild(script);
        });
      });
#if DECOMPRESSION_FALLBACK
    });
#endif // DECOMPRESSION_FALLBACK
  }

#if !USE_WASM
  function downloadAsm() {
#if DECOMPRESSION_FALLBACK
    return downloadBinary("codeUrl").then(function (code) {
      var blobUrl = URL.createObjectURL(new Blob([code], { type: "application/javascript" }));
#endif // DECOMPRESSION_FALLBACK
      return new Promise(function (resolve, reject) {
        var script = document.createElement("script");
#if DECOMPRESSION_FALLBACK
        script.src = blobUrl;
#else // DECOMPRESSION_FALLBACK
        script.src = Module.codeUrl;
#endif // DECOMPRESSION_FALLBACK
#if USE_THREADS
        Module.asmJsUrlOrBlob = script.src;
#endif // USE_THREADS
        script.onload = function () {
          delete script.onload;
#if DECOMPRESSION_FALLBACK && !USE_THREADS
          URL.revokeObjectURL(blobUrl);
#endif // DECOMPRESSION_FALLBACK && !USE_THREADS
          resolve();
        }
        document.body.appendChild(script);
        Module.deinitializers.push(function() {
          document.body.removeChild(script);
        });
      });
#if DECOMPRESSION_FALLBACK
    });
#endif // DECOMPRESSION_FALLBACK
  }

#endif // !USE_WASM
  function loadBuild() {
#if USE_WASM
#if DECOMPRESSION_FALLBACK
    Promise.all([
      downloadFramework(),
      downloadBinary("codeUrl"),
    ]).then(function (results) {
      Module.wasmBinary = results[1];
      results[0](Module);
    });

#else // DECOMPRESSION_FALLBACK
    downloadFramework().then(function (unityFramework) {
      unityFramework(Module);
    });

#endif // DECOMPRESSION_FALLBACK
#else // USE_WASM
    Promise.all([
      downloadFramework(),
      downloadAsm(),
    ]).then(function (results) {
      results[0](Module);
    });

#endif // USE_WASM
#if MEMORY_FILENAME
    Module.memoryInitializerRequest = {
      addEventListener: function (type, listener) {
        if (type == "load")
          Module.memoryInitializerRequest.useRequest = listener;
      },
    };
    downloadBinary("memoryUrl").then(function (data) {
      Module.memoryInitializerRequest.status = 200;
      Module.memoryInitializerRequest.response = data;
      if (Module.memoryInitializerRequest.useRequest)
        Module.memoryInitializerRequest.useRequest();
    });

#endif // MEMORY_FILENAME
    var dataPromise = downloadBinary("dataUrl");
    Module.preRun.push(function () {
      Module.addRunDependency("dataUrl");
      dataPromise.then(function (data) {
        var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        var pos = 0;
        var prefix = "UnityWebData1.0\0";
        if (!String.fromCharCode.apply(null, data.subarray(pos, pos + prefix.length)) == prefix)
          throw "unknown data format";
        pos += prefix.length;
        var headerSize = view.getUint32(pos, true); pos += 4;
        while (pos < headerSize) {
          var offset = view.getUint32(pos, true); pos += 4;
          var size = view.getUint32(pos, true); pos += 4;
          var pathLength = view.getUint32(pos, true); pos += 4;
          var path = String.fromCharCode.apply(null, data.subarray(pos, pos + pathLength)); pos += pathLength;
          for (var folder = 0, folderNext = path.indexOf("/", folder) + 1 ; folderNext > 0; folder = folderNext, folderNext = path.indexOf("/", folder) + 1)
            Module.FS_createPath(path.substring(0, folder), path.substring(folder, folderNext - 1), true, true);
          Module.FS_createDataFile(path, null, data.subarray(offset, offset + size), true, true, true);
        }
        Module.removeRunDependency("dataUrl");
      });
    });
  }

  return new Promise(function (resolve, reject) {
    if (!Module.SystemInfo.hasWebGL) {
      reject("Your browser does not support WebGL.");
  #if !USE_WEBGL_1_0
    } else if (Module.SystemInfo.hasWebGL == 1) {
      reject("Your browser does not support graphics API \"WebGL 2.0\" which is required for this content.");
  #endif // !USE_WEBGL_1_0
  #if USE_WASM
    } else if (!Module.SystemInfo.hasWasm) {
      reject("Your browser does not support WebAssembly.");
  #endif // USE_WASM
  #if USE_THREADS
    } else if (!Module.SystemInfo.hasThreads) {
      reject("Your browser does not support multithreading.");
  #endif // USE_THREADS
    } else {
  #if USE_WEBGL_2_0
      if (Module.SystemInfo.hasWebGL == 1)
        Module.print("Warning: Your browser does not support \"WebGL 2.0\" Graphics API, switching to \"WebGL 1.0\"");
  #endif // USE_WEBGL_2_0
      Module.startupErrorHandler = reject;
      onProgress(0);
      Module.postRun.push(function () {
        onProgress(1);
        delete Module.startupErrorHandler;
        resolve(unityInstance);
      });
      loadBuild();
    }
  });
}
