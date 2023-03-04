(() => {
  class Tools {
    static testType(obj, expectedOutput) {
      let toStringOutput = Object.prototype.toString
        .call(obj)
        .match(/(?<=\[object ).*(?=\])/)[0];
      return toStringOutput === expectedOutput;
    }

    static getProto(obj, depth = 1) {
      for (let i = 0; i < depth; i++) {
        if (obj === null) break;
        obj = Object.getPrototypeOf(obj);
      }
      return obj;
    }
    static repeatArray(arr, times) {
      if (!Tools.testType(arr, "Array"))
        throw new TypeError(
          "Tools.repeatArray: invalid argument type: expected Array, got " +
          typeof arr
        );
      let tmp = [];
      tmp[times - 2] = undefined;
      return Array.prototype.concat.apply(arr, tmp.fill(arr));
    }
    static logObj(obj) {
      try {
        return structuredClone(obj);
      } catch (error) {
        if (error instanceof DOMException) return obj;
      }
    }
  }
  window.Tools = Tools;
})();
(() => {
  "use strict";
  class Wheel {
    constructor(itemList, delay = 5000) {
      console.debug("Wheel.constructor: Wheel initialize.");
      this.itemList = itemList;
      this.labelDOM = document.createElement("div");
      this.dom = document.createElement("div");
      this.delay = delay;
      this.outputIndex = 3;
      this.status = -1;
      // -1: stop
      // Infinity: targeting
      // >=0: running
      this._onEnd = [];
      window.addEventListener("mousewheel", this.syncDelta, {
        passive: true,
      });
    }

    start() {
      if (!this.stopped) {
        console.debug(
          "Wheel.start: wheel hasn't stopped yet, start request rejected"
        );
        return false;
      }
      console.debug("Wheel.start: start.");
      this.dom.classList.add("rolling");
      this.status = Infinity;
      this.turn();
      return true;
    }

    turn(altThis = this) {
      if (altThis.status === 0) {
        altThis.end();
        return --altThis.status;
      }
      let time;
      if (altThis.status == Infinity)
        if (
          !altThis.target ||
          altThis.targetIndexs.indexOf(altThis.outputIndex) !== -1
        ) {
          console.debug("Wheel.turn: targeting success.");
          altThis.status = altThis.timeTable.length;
          time = altThis.timeTable[--altThis.status];
        } else time = altThis.timeTable[altThis.timeTable.length - 1];
      else time = altThis.timeTable[--altThis.status];
      let style = `--time:${time}ms;`;
      console.debug("Wheel.turn: status:", Tools.logObj(altThis.status));
      setTimeout(altThis.turn, time, altThis);
      let tmp = time / 2 - 100;
      if (altThis.status === 0) {
        style += `--time-fun: cubic-bezier(0, 0, 0.2, 1);--delta: ${Math.random() * 22.5 - 11.25
          }deg;`;
        tmp /= 3;
      }
      setTimeout(
        (altThis) => {
          altThis.labelDOM.innerText = altThis.output;
        },
        tmp,
        altThis
      );
      // DOM operation is slow, so we need to put them in the end of functions;
      altThis.dom.appendChild(altThis.dom.firstElementChild);
      /*
      altThis.dom.children[2].classList.remove("selected");
      altThis.dom.output.classList.add("selected");
      */
      altThis.outputIndex++;
      altThis.dom.style = style;
    }
    end() {
      if (this.dom.output.innerText !== this.target)
        console.warn(
          `Wheel.end: targeting failed! target:${this.target} output:${this.dom.output.innerText}`
        );
      else
        console.debug(
          `Wheel.end: check success. target:${this.target} output:${this.dom.output.innerText}`
        );
      this.syncList();
      this.dom.classList.remove("rolling");
      //this.dom.output.classList.remove("selected");
      this.dom.style = this.dom.style.cssText.replace(
        "--time-fun: cubic-bezier(0, 0, 0.2, 1);",
        ""
      );
      this._target = null;
      for (let i = 0; i < this._onEnd.length; i++) this._onEnd[i]();
    }
    syncList() {
      console.debug("Wheel.syncList: start.");
      this._itemList = Array.from(this.dom.children).map(
        (e) => e.innerText
      ); // remember to prevent triggering DOM update
      console.debug(
        "Wheel.syncList: updating itemList (setter bypassed):",
        this.itemList
      );
      this.outputIndex = 3;
    }
    initializeDOM(outer) {
      outer.innerHTML = "";
      this.itemList.forEach((item, index) => {
        console.debug("Wheel.initializeDOM: initializing item", item);
        let obj = new DOMParser().parseFromString(
          `<div class="item">${item}</div>`,
          "text/html"
        ).body.children[0];
        obj.addEventListener("mousedown", (e) => {
          Main.clickLock = true;
          if (!e.target.parentElement.jsObj.stopped) {
            console.debug(
              "Wheel [item mousedown handler]: wheel hasn't stopped yet, overview request rejected"
            );
            return false;
          }
          this.controller = new AbortController();
          const signal = this.controller.signal;
          console.debug(
            "Wheel [item mousedown handler]: enabled dragging"
          );
          window.addEventListener("mousemove", this.syncDelta, {
            signal: signal,
          });
          if (e.target.parentElement.classList.contains("overview")) {
            console.debug(
              "Wheel [item mousedown handler]: duplicate overview request rejected"
            );
            return false;
          }
          e.target.parentElement.scrollTop = 0;
          e.target.parentElement.classList.add("overview");
          Main.help.innerText = Main.msgDict.help.overview;
          window.addEventListener("mouseup", () => {
            console.debug(
              "Wheel [item mousedown handler]: disabled dragging"
            );
            Main.wheel.controller.abort();
          });
        });
        if (this.itemList.indexOf(item) !== index)
          obj.classList.add("repeat");
        outer.appendChild(obj);
      });
    }
    syncDOM(chooseList) {
      Array.from(this.dom.children).forEach((obj) => {
        if (chooseList.indexOf(obj.innerText) === -1)
          obj.classList.add("disabled");
      });
    }
    syncDelta(e) {
      let tmp;
      if (e.deltaY) Main.wheel.dom.scrollTop += e.deltaY;
      else Main.wheel.dom.scrollTop -= e.movementY;
      // TODO: standardize this
    }
    get onEnd() {
      console.warn(
        `Wheel.onEnd: get "Wheel.onEnd" won't return any value.`
      );
      return null;
    }
    set onEnd(callback) {
      this._onEnd.push(callback);
    }
    get dom() {
      return this._dom;
    }
    set dom(dom) {
      console.debug("Wheel setter: initializing DOM:", Tools.logObj(dom));
      if (!Tools.testType(Tools.getProto(dom, 2), "HTMLElement"))
        throw new TypeError(
          "Wheel setter: invalid argument type: expected HTMLElement, got " +
          typeof dom
        );
      this.initializeDOM(dom);
      dom.classList.add("wheelOuter");
      dom.jsObj = this;
      if (!dom.output)
        Object.defineProperty(dom, "output", {
          get: () => {
            if (this.dom) return this.dom.children[3];
            else return this.children[3];
          },
          set: (output) => {
            if (this.dom) this.target = output;
            else this.jsObj.target = output;
            console.warn(
              `Wheel setter: Don't edit "Wheel.dom.output", use "Wheel.target" instead.`
            );
          },
        });
      this._dom = dom;
      this.labelDOM.innerText = "???";
    }
    get itemList() {
      return this._itemList;
    }
    set itemList(list) {
      if (!Tools.testType(list, "Array"))
        throw new TypeError(
          "Wheel.itemList: invalid argument type: expected Array, got " +
          typeof list
        );
      list = list.map((e) => e.toString()).filter((e) => e !== "");

      if (list.length < 7)
        list = Tools.repeatArray(list, Math.ceil(7.0 / list.length));
      console.debug(
        "Wheel setter: updating itemList (with setter):",
        Tools.logObj(list)
      );
      this._itemList = list;
      this._target = null;
      if (this.dom) this.initializeDOM(this.dom);
    }

    get delay() {
      return this._delay;
    }

    set delay(delay) {
      console.debug(
        "Wheel setter: initializing timetable, delay =",
        Tools.logObj(delay)
      );
      if (!Tools.testType(delay, "Number"))
        throw new TypeError(
          "Wheel.delay: invalid argument type: expected Number, got " +
          typeof delay
        );
      this._delay = delay;

      this.timeTable = [delay / 2.0];
      delay /= 2.0;
      while (this.timeTable.at[this.timeTable.length - 1] > 10) {
        const time = delay / 4.0;
        delay -= time;
        this.timeTable.push(time);
      }
      for (let i = 0; i < 3; i++)
        this.timeTable.push(this.timeTable[this.timeTable.length - 1]);
    }

    get labelDOM() {
      return this._labelDOM;
    }
    set labelDOM(label) {
      if (!Tools.testType(Tools.getProto(label, 2), "HTMLElement"))
        throw new TypeError(
          "Wheel setter: invalid argument type: expected HTMLElement, got " +
          typeof label
        );
      this._labelDOM = label;
    }

    get output() {
      return this.itemList[this.outputIndex];
    }
    set output(output) {
      this.target = output;
      console.warn(
        `Wheel setter: Don't edit "Wheel.output", use "Wheel.target" instead.`
      );
    }

    get outputIndex() {
      this._outputIndex %= this.itemList.length;
      return this._outputIndex;
    }
    set outputIndex(index) {
      this._outputIndex = index;
    }

    get target() {
      return this._target;
    }
    set target(target) {
      target += "";
      let targetIndexs = [];
      this.itemList.forEach((e, i) => {
        if (e === target) {
          let tmp = i - this.timeTable.length;
          while (tmp < 0) tmp += this.itemList.length;
          targetIndexs.push(tmp);
        }
      });
      if (targetIndexs.length === 0)
        throw new RangeError(
          "Wheel setter: target should be a member of itemList"
        );
      else
        console.debug(
          `Wheel setter: syncing target index. target:${target}, index:`,
          Tools.logObj(targetIndexs)
        );
      this.targetIndexs = targetIndexs;
      this._target = target;
    }

    get stopped() {
      return this.status === -1;
    }
    set stopped(data) {
      console.warn(
        `Wheel setter: Don't use implicit call to stop wheel object, use "Wheel.stop" instead.`
      );
    }
  }
  window.Wheel = Wheel;
})();
(() => {
  class Chooser {
    constructor(itemList) {
      console.debug("Chooser.constructor: initialize");
      this.chooseList = null;
      this.itemList = itemList;
      this._onReset = [];
    }

    choose() {
      console.warn(`Chooser getter: consider using getter "Chooser.next"?`);
      return this.next;
    }
    reset(auto = true) {
      console.debug(`Chooser.reset: start`);
      this.chooseList = this.itemList.slice(0);
      if (auto)
        for (let i = 0; i < this._onReset.length; i++) this._onReset[i]();
      localStorage.removeItem("chooseList");
    }

    get onReset() {
      console.warn(
        `Chooser.onReset: get "Chooser.onReset" won't return any value.`
      );
      return null;
    }
    set onReset(callback) {
      this._onReset.push(callback);
    }
    get itemList() {
      return this._itemList;
    }
    set itemList(list) {
      console.debug(`Chooser setter: itemList initialize.`, Tools.logObj(list));
      if (!Tools.testType(list, "Array"))
        throw new TypeError(
          "Chooser.itemList: invalid argument type: expected Array, got " +
          typeof list
        );
      if (this.chooseList !== null)
        if (this.chooseList.length >= 0) {
          console.warn(
            `Chooser setter: Data loss! "Chooser.chooseList" is not empty and will be overwritten, set "Chooser.chooseList" to null before setting new itemList to prevent this warning.`
          );
          localStorage.removeItem("chooseList");
        }
      this.chooseList = list.slice(0);
      this._itemList = list.slice(0);
    }

    get next() {
      if (this.chooseList.length === 0) this.reset();
      const index = Math.floor(Math.random() * this.chooseList.length);
      const out = this.chooseList[index];
      this.chooseList.splice(index, 1);
      console.debug("Chooser getter: output:", Tools.logObj(out));
      if (!out)
        console.warn("Chooser getter: output doesn't seem right! output:", out);
      return out;
    }
    set next(next) {
      throw new Error("Chooser setter: Nope.");
    }
  }
  window.Chooser = Chooser;
})();
(() => {
  class Animate {
    constructor() {
      this.funList = [];
      this.working = false;
    }
    add(fun, interval, thisArg = window) {
      const tmp =
        this.funList.push({
          fun: fun,
          interval: interval,
          nextTrigger: performance.now() + interval,
          thisArg: thisArg,
        }) - 1;
      if (!this.working) {
        window.requestAnimationFrame(this.ani);
        this.working = true;
      }
      return tmp;
    }
    del(id) {
      const tmp = delete this.funList[id];
      return tmp;
    }
    async ani(t) {
      if (!window.Animate.working) return;
      try {
        let flag = false;
        for (let i = 0; i < window.Animate.funList.length; i++)
          if (window.Animate.funList[i]) {
            window.Animate.handle(t, window.Animate.funList[i], i);
            flag = true;
          }
        if (!flag) {
          window.Animate.working = false;
          return;
        }
      } catch (e) {
        if (!e instanceof TypeError) throw e; // TODO:
      }
      window.requestAnimationFrame(window.Animate.ani);
    }
    async handle(t, item, id) {
      if (t > item.nextTrigger)
        if (item.fun.call(item.thisArg, t))
          item.nextTrigger += item.interval;
        else window.Animate.del(id);
    }
  }
  window.Animate = new Animate(); // An App should have only one Animate instance
})();
