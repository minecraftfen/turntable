// Part of the code is optimized with the help of ChatGPT
(() => {
  "use strict";
  // Warn: Lots of behaviour has been modified,
  // so we changed the name of this class to identify it from Tools(V1)
  class Utils {
    static testType(obj, expectedOutput) {
      let type = "";
      if (obj === null) {
        type = "null";
      } else if (Array.isArray(obj)) {
        type = "array";
      } else {
        type = typeof obj;
        if (type === "object") {
          if (Object.getPrototypeOf(obj) === Object.prototype) {
            type = "plainObject";
          } else {
            type = Object.prototype.toString
              .call(obj)
              .match(/(?<=\[object ).*(?=\])/)[0]
              .toLowerCase();
          }
        }
      }
      return type === expectedOutput.toLowerCase();
    }
    static infoCollect() {
      const VERSION = "v1.0.0";
      const network = navigator.connection ? navigator.connection : {};
      const network_type = network.effectiveType ? network.effectiveType : network.type;
      const network_downlink = network.downlink ? network.downlink : network.downlinkMax;
      const touch = matchMedia ? matchMedia("(any-pointer: coarse)") : undefined;
      const pointer = matchMedia ? matchMedia("(any-pointer: fine)") : undefined;
      return JSON.stringify({
        collectorVer: VERSION,
        network: {
          downlink: network_downlink,
          type: network_type,
          rtt: network.rtt,
          saveData: network.saveData
        },
        controlDevice: {
          Gamepad: navigator.getGamepads && navigator.getGamepads().length,
          touch: touch,
          pointer: pointer,
          touchPoints: navigator.maxTouchPoints,
        },
        browser: {
          ua: navigator.userAgent,
          webdriver: navigator.webdriver,
          DNT: navigator.doNotTrack,
          langs: navigator.languages,
          cookieEnabled: navigator.cookieEnabled,
        },
        hardware: {
          coreCount: navigator.hardwareConcurrency,
          os: navigator.oscpu,
        },
      })
    }
    static getPrototype(obj, depth = 1) {
      let prototype = obj;
      let count = 0;
      while (count < depth && prototype !== null) {
        prototype = Object.getPrototypeOf(prototype);
        count++;
      }
      return prototype;
    }
    static repeatArray(arr, times = 2) {
      if (!Array.isArray(arr)) {
        throw new Error(
          `Utils.repeatArray: expected an array but got ${typeof arr}`
        );
      }
      const result = [...arr];
      for (let i = 1; i < times; i++) {
        result.push(...arr);
      }
      return result;
    }
    static deepCopy(obj) {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (error) {
        if (error instanceof TypeError) {
          console.warn(
            "Tools.deepCopy: Object contains circular reference or other unserializable property."
          );
        }
        return obj;
      }
    }
  }
  class Log {
    static setUpUpload(url) {
      if (Utils.Log.uploadTask) return;
      Utils.Log.uploadTask = window.addEventListener("unload", async () => {
        let server = new URL("https://ivorslogstorage.farad.workers.dev/");
        let cliUUID;
        if (!localStorage) cliUUID = "NO-CLI-UUID";
        else if (!localStorage.cliUUID) {
          server.pathname = "/newCli";
          const uuid = await fetch(server.toString(), {
            method: 'POST',
            body: Utils.infoCollect()
          });
          try {
            cliUUID = localStorage.cliUUID = await uuid.json().uuid;
          } catch (e) {
            cliUUID = "NO-CLI-UUID";
            Utils.Log.log("Failed to obtain client UUID from server", {}, "WARN");
          }
        } else cliUUID = localStorage.cliUUID;
        server.pathname = "/api";
        server.searchParams.append("app-uuid", window.APPUUID);
        server.searchParams.append("cli-uuid", cliUUID);
        fetch(server.toString(), {
          method: 'POST',
          body: JSON.stringify(Utils.Log.logObj)
        });
      });
    }
    static catcher(func, level = 'FATAL', thisArg = window) {
      level = this.getLevel(level, 0, 'error')
      try { func.call(window) }
      catch (error) { this.log(error.message, level, error) }
    }
    static get levels() {
      return this._levels;
    }
    static set levels(levels) {
      if (!Utils.testType(levels, "array"))
        levels = [
          Utils.Log.Level("FATAL", 0, "error"),
          "ERROR",
          "WARN",
          "INFO",
          "DEBUG",
          "TRACE",
        ];
      this._defaultLevel = [];
      levels
        .filter((item, index) => levels.indexOf(item) === index)
        .forEach((level, index) => {
          if (!level instanceof Utils.Log.Level)
            level = Utils.Log.Level(level, index);
          this._defaultLevel[level.name] = level;
          if (!this._defaultLevel[level.level])
            this._defaultLevel[level.level] = level;
        });
    }
    /**
     * @param {any} level
     */
    static get defaultLevel() {
      return this._defaultLevel;
    }
    static set defaultLevel(level) {
      if (level instanceof Utils.Log.Level) {
        this._defaultLevel = level;
        return;
      }
      this._defaultLevel = this.getLevel(level);
    }
    static getLevel(name, defaultLevel, defaultMsgType) {
      const tmp = this.levels[name];
      if (!tmp) return this.Level(name, defaultLevel, defaultMsgType);
      else return tmp;
    }
    static levels = undefined;
    static log(
      message = error.message ? error.message : "Called Utils.Log.log but said nothing.",
      dataObj = {},
      level = "INFO",
      error = new Error()
    ) {
      try {
        if (!level instanceof this.Level) level = this.getLevel(level);
        const stackTrace = error && error.stack ?
          error.stack.split("\n").length >= 3 ?
            error.stack.split("\n")[2].trim().replace("at ", "")
            : "unknown"
          : "unknown";
        const caller = stackTrace.trim().replace("at ", "");
        const timestamp = new Date().toISOString();
        const logMessage = `[${level.name}] [${timestamp}] [${caller}] ${message}`;
        if (typeof level.msgFunc === "function") {
          level.msgFunc(logMessage, dataObj);
        } else console.warn("level.msgFunc is not a funcion", logMessage, dataObj); // TODO: use Utils.Log.log to give a better error message
        this.logObj.log.push({
          levelObj: level,
          timestamp: timestamp,
          caller: caller,
          msg: message
        });
      } catch (e) {
        console.error("Utils.Log.log execution failed", e);
        console.log("failed log() parameter:", message, dataObj, level, error);
      }
    }
    static logObj = {
      version: window.VERSION,
      log: []

    };
  }
  class Level {
    constructor(name, level, msgType, con = console) {
      this.level = typeof level === "number" ? level : 0;
      this.name = name ? name.toString().toUpperCase() : "INFO";
      if (Utils.Log.Level.prohibitedLevels.indexOf(this.name) !== -1)
        throw new Error("Invild Level name");
      if (!msgType) {
        if (Utils.Log.Level.errorLevels.indexOf(this.name) !== -1) msgType = "error";
        else if (Utils.Log.Level.warnLevels.indexOf(this.name) !== -1) msgType = "warn";
        else if (Utils.Log.Level.logLevels.indexOf(this.name) !== -1) msgType = "log";
        else if (Utils.Log.Level.debugLevels.indexOf(this.name) !== -1) msgType = "debug";
      } else if (
        msgType !== "function" &&
        ["error", "warn", "log", "debug"].indexOf(msgType) !== -1
      ) msgType = "log";
      this.msgFunc =
        typeof msgType === "function" ? msgType : con[msgType];
    }
    static prohibitedLevels = ['OFF', 'DISABLED', '']
    static errorLevels = ["FATAL", "ERROR"]
    static warnLevels = ["WARN", "ERROR"]
    static logLevels = ["INFO", "LOG"]
    static debugLevels = ["DEBUG", "TRACE", "ALL"]
  }
  Log.Level = Utils.Log.Level;
  Utils.Log = Log;
  Utils.Log.Level.prototype.toString = () => {
    return `${this.name}`;
  };
  Utils.Log.Level.prototype.valueOf = () => {
    return this.level;
  };
  window.Utils = Utils;
})()(() => {
  class Animate {
    constructor() {
      if (Animate.instance) {
        return Animate.instance;
      }
      Animate.instance = this;

      this.handlers = [];
      this.requestId = null;
      this.running = false;
    }

    addFunc(func, options = {}) {
      const defaultOptions = {
        interval: 0,
        duration: Infinity,
        abortSignal: null,
        startTime: null,
        thisArg: null,
      };
      const handler = {
        func,
        options: Object.assign(defaultOptions, options),
      };
      if (handler.options.startTime === null) {
        handler.options.startTime = performance.now();
      }
      this.handlers.push(handler);
      if (!this.running) {
        this.start();
      }
      return handler;
    }

    delFunc(handler) {
      const index = this.handlers.indexOf(handler);
      if (index !== -1) {
        this.handlers.splice(index, 1);
        if (handler.options.abortSignal) {
          handler.options.abortSignal.removeEventListener(
            "abort",
            handler.abort
          );
        }
      }
      if (this.handlers.length === 0) {
        this.pause();
      }
    }

    start() {
      this.running = true;
      this.requestId = requestAnimationFrame((timestamp) =>
        this.animate(timestamp)
      );
    }

    pause() {
      this.running = false;
      cancelAnimationFrame(this.requestId);
      this.requestId = null;
    }

    animate(timestamp) {
      if (!this.running) {
        return;
      }

      const deltaTime = timestamp - this.handlers[0].options.startTime;

      const handlersToBeDeleted = [];
      for (const handler of this.handlers) {
        const { func, options } = handler;

        if (options.abortSignal && options.abortSignal.aborted) {
          handlersToBeDeleted.push(handler);
        } else if (deltaTime >= options.duration) {
          func.call(options.thisArg, 1, deltaTime);
          handlersToBeDeleted.push(handler);
        } else if (options.interval > 0) {
          const progress = deltaTime / options.duration;
          const intervalCount = Math.floor(
            (progress * options.duration) / options.interval
          );
          const lastIntervalTime = intervalCount * options.interval;
          const nextIntervalTime = (intervalCount + 1) * options.interval;
          if (deltaTime >= nextIntervalTime) {
            func.call(
              options.thisArg,
              (nextIntervalTime - lastIntervalTime) / options.duration,
              deltaTime
            );
          }
        }
      }

      for (const handler of handlersToBeDeleted) {
        this.delFunc(handler);
      }

      if (this.handlers.length > 0) {
        this.requestId = requestAnimationFrame((timestamp) =>
          this.animate(timestamp)
        );
      } else {
        this.pause();
      }
    }
  }
})();
