Test.Unit.Testcase.addMethods({
  assertTransparent: function(style) {
    var message = arguments[1] || 'assertTransparent';
    if (Prototype.Browser.WebKit) {
      this.assertEqual("rgba(0, 0, 0, 0)", style, message);
    } else {
      this.assertEqual("transparent", style, message);
    }
  }
});