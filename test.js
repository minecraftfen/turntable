if (localStorage.testEnabled !== true) {
  console.warn(`remember to disable test.js in production build`); // TODO: replace with Utils.Log.log()
}
import tape from "https://cdn.jsdelivr.net/npm/tape-catch@1.0.6/+esm";

tape("Log Library Test", (t) => {
  Utils.Log.catch(() => {
    t.equal(type({}), "object", "{} 应该是一个对象");
    t.equal(type([]), "array", "[] 应该是一个数组");
    t.equal(
      type(function () {}),
      "function",
      "function(){} 应该是一个函数"
    );
    t.equal(type(""), "string", '"" 应该是一个字符串');
    t.equal(type(123), "number", "123 应该是一个数字");
    t.equal(type(true), "boolean", "true 应该是一个布尔值");
    t.end();
    throw new Error("这个错误不应被抛出");
  });
});
