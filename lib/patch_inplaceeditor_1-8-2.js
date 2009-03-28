// Patch InPlaceEditor for script.aculo.us 1.8.2 to fix failure handling bugs
// Author : Sebastien Grosjean - ZenCocoon (http://www.zencocoon.com)
// Version : 1.1
//
// Please be aware that it's patching the actual version of InPlaceEditor (script.aculo.us 1.8.2)
// and it can make more damages on previous or later versions.
Object.extend(Ajax.InPlaceEditor.prototype, {
  handleAJAXFailure: function(transport) {
    this.triggerCallback('onFailure', transport);
    if (this._oldInnerHTML) {
      this.element.innerHTML = this._oldInnerHTML;
      this._oldInnerHTML = null;
    }
    this.leaveEditMode();
  }
});
Object.extend(Ajax.InPlaceEditor.DefaultCallbacks, {
  onFailure: function(ipe, transport) {
    alert('Error communication with the server: ' + transport.responseText.stripTags());
  }
});
