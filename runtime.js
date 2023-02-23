"use strict";
class Main {
  // This is just a object filled with functions and data.
  // so there is no constructor, but static functions only.
  // BUT, initialize function still should be called first, as always been.
  static initialize(itemList, delay) {
    console.log(
      "\n%cIvor's Wheel\n%c%s\n%cMade With ♥ By Ivor%c\n\n",
      "color: #888; font-size: 2em;",
      "color: #666; font-size: 1.5em;",
      window.VERSION,
      "color: #000;font-size: 0.75em;padding:0.125em 0.75em;margin:0.5em;background-color: #fff;border-radius:0.125em;",
      ""
    );
    this.msgDict = {
      help: {
        init: "点击屏幕任意处以开始\n点击选项以浏览选项列表",
        recover: "点击屏幕任意处以开始\n已还原上次使用时的转盘状态",
        overview:
          "使用鼠标滚轮或拖动以翻阅列表\n点击列表外区域以退出浏览",
        run: "请等待转盘停止\n如转盘旋转耗时过长，可在设置页调整",
        end: "点击任意处以开始\n选项不会重复出现，可使用右键重置",
        reset: "已重置\n点击屏幕任意处以开始",
        autoReset: "点击屏幕任意处以开始\n所有选项均已出现，已自动重置",
      },
    };
    this.testItemList = [
      "刘一",
      "陈二",
      "张三",
      "李四",
      "王五",
      "赵六",
      "孙七",
      "周八",
      "吴九",
      "郑十",
    ];
    this.defaultDelay = 5000;
    if (itemList === undefined) itemList = this.testItemList;
    if (delay === undefined) delay = this.defaultDelay;

    this.chooser = new Chooser(itemList);
    this.chooser.onReset = () => Main.onReset();

    this.wheel = new Wheel(itemList, delay);
    this.wheel.onEnd = () => Main.onEnd();
    this.wheel.dom.id = "wheelOuter";
    this.wheel.labelDOM = document.getElementById("labelOuter");
    this.wheel.syncDOM(this.chooser.chooseList);

    this.help = document.getElementById("help");
    this.count = document.getElementById("count");
    this.help.innerText = this.msgDict.help.init;
    this.count.innerText = this.chooser.chooseList.length;

    this.locked = false;
    this.clickLock = false;

    document.body.insertBefore(this.wheel.dom, document.body.firstChild);
    window.addEventListener("mouseup", (e) => {
      switch (e.button) {
        case 0:
          if (this.clickLock) {
            console.debug(
              "Main [window mouseup handler]: request rejected by clickLock"
            );
            this.clickLock = false;
            return;
          }
          if (this.wheel.dom.classList.contains("overview")) {
            console.debug(
              "Main [window mouseup handler]: request rejected by exiting overview mode"
            );
            this.wheel.dom.classList.remove("overview");
            Main.wheel.dom.scrollTop = 0;
            Main.help.innerText = Main.msgDict.help.init;
          } else Main.start();
          break;
        case 2:
          Main.reset();
          break;
        case 1:
          console.debug("mouse wheel pressed");
          Main.start();
          break;

        default:
          console.debug("unknown button pressed");
      }
    });
    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  static start() {
    if (this.locked) return;
    if (!this.wheel.stopped) {
      console.debug(
        "Main.start: wheel hasn't stopped yet, start request rejected"
      );
      return false;
    }
    console.groupCollapsed();
    console.debug(
      "--------- | Main.start: start main process | ---------"
    );
    console.count("Number of times Main.start function has been successfully called:");
    Settings.buttons.open.classList.add("disabled");
    Settings.mainPage.classList.add("disabled");
    this.help.innerText = this.msgDict.help.run;
    this.wheel.target = this.chooser.next;
    return this.wheel.start();
  }

  static onReset() {
    console.debug("Main.onReset: auto reset.");
    this.resetUI();
    this.help.innerText = this.msgDict.help.autoReset;
  }

  static onEnd() {
    console.debug("Main.onEnd: end.");
    console.groupEnd();
    this.help.innerText = this.msgDict.help.end;
    if (this.chooser.chooseList.length === 0) this.reset(false);
    this.wheel.syncDOM(this.chooser.chooseList);
    this.count.innerText = this.chooser.chooseList.length;
    Settings.buttons.open.classList.remove("disabled");
    Settings.mainPage.classList.remove("disabled");
  }

  static reset(manual = true) {
    if (!this.wheel.stopped) {
      console.debug(
        "Main.reset: wheel hasn't stopped yet, reset request rejected"
      );
      return false;
    }
    console.debug(`Main.reset: ${manual ? "manual" : "auto"} reset`);
    if (manual) this.help.innerText = this.msgDict.help.reset;
    else this.help.innerText = this.msgDict.help.autoReset;
    this.chooser.reset(false);
    this.resetUI();
    return true;
  }
  static resetUI() {
    Array.from(this.wheel.dom.children).forEach((e) =>
      e.classList.remove("disabled")
    );
    this.count.innerText = this.chooser.chooseList.length;
  }
  static get itemList() {
    return this._itemList;
  }
  static set itemList(list) {
    this.chooser.chooseList = null;
    this._itemList = this.chooser.itemList = this.wheel.itemList = list;
  }
}
class Settings {
  // This is just a object filled with functions and data.
  // so there is no constructor, but static functions only.
  // BUT, initialize function still should be called first, as always been.
  static initialize() {
    // constants

    this.buttons = {
      open: document.getElementById("setting-button"),
      close: document.getElementById("setting-close"),
      save: document.getElementById("setting-save"),
      cancel: document.getElementById("setting-cancel"),
      reset: document.getElementById("setting-reset"),
      confirm: document.getElementById("setting-confirm"),
      confirmCancel: document.getElementById("setting-confirm-cancel"),
    };
    this.inputs = {
      wheelSpeed: document.getElementById("wheel-speed"),
      itemList: document.getElementById("item-list"),
    };
    this.inputs.itemList.placeholder =
      "例: 1,2 3.4\n" +
      "将被识别为:'1','2','3','4'\n\n" +
      "特殊规则：如不希望符号在识别时用于分割，可在符号后加星号(*)。\n" +
      "所有的星号将在识别时移除，如需保留请输入两个星号。\n\n" +
      "例1: Harry Potter,Star*,Ron Weasley,Hermione Granger\n" +
      "将被识别为: 'Harry','Potter','Star','Ron'...\n\n" +
      "例2: Harry *Potter,Star**,Ron *Weasley,Hermione *Granger\n" +
      "将被识别为: 'Harry Potter','Star*','Ron Weasley'...\n\n" +
      "注意，更改物品列表后将自动重置已出现物品列表";
    this.settingConfirmMenu = document.getElementById(
      "setting-confirm-menu"
    );
    this.wheelSpeedLabel = document.getElementById("wheel-speed-label");
    this.mainPage = document.getElementById("setting");

    // vars
    this._confirmAction = null;

    // handlers
    this.buttons.open.addEventListener("mouseup", (e) => {
      Main.locked = true;
      e.preventDefault();
      e.stopPropagation();
      Settings.mainPage.classList.add("active");
    });
    this.buttons.close.addEventListener("mouseup", () => {
      Main.locked = false;
      Settings.mainPage.classList.remove("active");
    });
    this.buttons.save.addEventListener("mouseup", () => Settings.save());
    this.buttons.cancel.addEventListener("mouseup", () => {
      Settings.confirmAction = Settings.cancel;
    });
    this.buttons.reset.addEventListener("mouseup", () => {
      Settings.confirmAction = Settings.reset;
    });
    this.buttons.confirm.addEventListener("mouseup", () => {
      Settings.confirmAction();
    });
    this.buttons.confirmCancel.addEventListener("mouseup", () => {
      Settings.confirmAction;
    });
    this.mainPage.addEventListener("mouseup", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    this.inputs.wheelSpeed.addEventListener("input", (e) => {
      Settings.wheelSpeedLabel.innerText =
        Settings.inputs.wheelSpeed.value;
    });

    // localStorage initialization
    if (!localStorage.itemList)
      localStorage.itemList = JSON.stringify(Main.testItemList);
    if (!localStorage.delay)
      localStorage.delay = JSON.stringify(Main.defaultDelay);
    this.cancel(); // read from localStorage
    this.save(); // apply
    if (localStorage.chooseList) {
      let tmp = JSON.parse(localStorage.chooseList);
      if (!tmp.every((e, i) => Main.chooser.itemList[i] === e)) {
        console.debug(
          "Settings.initialize: recovered chooseList",
          Tools.logObj(tmp)
        );
        Main.chooser.chooseList = tmp;
        Main.help.innerText = Main.msgDict.help.recover;
        Main.wheel.syncDOM(tmp);
        Main.count.innerText = Main.chooser.chooseList.length;
      }
    }
    window.addEventListener("unload", () => {
      localStorage.chooseList = JSON.stringify(Main.chooser.chooseList);
    });
  }
  static save() {
    Main.wheel.delay = Settings.inputs.wheelSpeed.value * 1000;
    localStorage.delay = JSON.stringify(Main.wheel.delay);
    if (Settings.inputs.itemList.value) {
      Main.itemList = Settings.inputs.itemList.value
        .split(/[,，.。;；\s](?!\*(?!\*))/g) // 分割
        .map((e) => e.replace(/\*(?!\*)/, "").replace("**", "*")) // 去星号
        .filter((e) => e !== "") // 去空值
        .filter((e, i, a) => a.indexOf(e) === i); // 去重
      // ↑ "1,2，,,,,,,,,3 *4 **5 1 1 1 1 1" ->  ['1', '2', '3 4', '*5']
      localStorage.itemList = JSON.stringify(Main.itemList);
      Main.count.innerText = Main.chooser.chooseList.length;
    }
  }
  static reset() {
    Settings.inputs.wheelSpeed.value = Main.defaultDelay / 1000;
    Settings.inputs.itemList.value = Main.testItemList.join(",");
    Settings.save();
  }
  static cancel() {
    Settings.inputs.wheelSpeed.value =
      JSON.parse(localStorage.delay) / 1000;
    Settings.inputs.itemList.value = JSON.parse(
      localStorage.itemList
    ).join(",");
  }
  static get confirmAction() {
    console.debug("Settings getter: confirmAction get");
    this.settingConfirmMenu.classList.remove("focus", "active");
    const tmp = this._confirmAction;
    this._confirmAction = null;
    return tmp;
  }
  static set confirmAction(action) {
    console.debug("Settings setter: confirmAction set");
    this._confirmAction = action;
    if (this.settingConfirmMenu.classList.contains("active")) {
      this.settingConfirmMenu.classList.add("focus");
    } else this.settingConfirmMenu.classList.add("active");
  }
}

function dataExport() {
  let tmp = Tools.logObj(localStorage);
  tmp = {
    itemList: tmp.itemList,
    chooseList: tmp.chooseList,
    delay: tmp.delay,
  };
  return navigator.clipboard.writeText(JSON.stringify(tmp));
}

async function dataImport() {
  let tmp;
  try {
    tmp = JSON.parse(await navigator.clipboard.readText());
    if (
      Tools.testType(JSON.parse(tmp.itemList), 'Array') &&
      Tools.testType(JSON.parse(tmp.chooseList), 'Array') &&
      Tools.testType(JSON.parse(tmp.delay), 'Number')) {
      localStorage.itemList = tmp.itemList;
      localStorage.chooseList = tmp.chooseList;
      localStorage.delay = tmp.delay;
    } else throw new SyntaxError();
  } catch (e) {
    if (e instanceof SyntaxError) console.log('dataImport: Error parsing JSON.');
    return false;
  }


  return true;
}
