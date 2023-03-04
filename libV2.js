// Part of the code is optimized with the help of ChatGPT
(() => {
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
          console.warn("Tools.deepCopy: Object contains circular reference or other unserializable property.");
        }
        return obj;
      }
    }
  }
})()
  (() => {
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
          thisArg: null
        };
        const handler = {
          func,
          options: Object.assign(defaultOptions, options)
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
            handler.options.abortSignal.removeEventListener("abort", handler.abort);
          }
        }
        if (this.handlers.length === 0) {
          this.pause();
        }
      }

      start() {
        this.running = true;
        this.requestId = requestAnimationFrame(timestamp => this.animate(timestamp));
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
            const intervalCount = Math.floor(progress * options.duration / options.interval);
            const lastIntervalTime = intervalCount * options.interval;
            const nextIntervalTime = (intervalCount + 1) * options.interval;
            if (deltaTime >= nextIntervalTime) {
              func.call(options.thisArg, (nextIntervalTime - lastIntervalTime) / options.duration, deltaTime);
            }
          }
        }

        for (const handler of handlersToBeDeleted) {
          this.delFunc(handler);
        }

        if (this.handlers.length > 0) {
          this.requestId = requestAnimationFrame(timestamp => this.animate(timestamp));
        } else {
          this.pause();
        }
      }
    }
  })()
