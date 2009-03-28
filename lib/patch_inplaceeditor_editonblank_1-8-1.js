// Patch InPlaceEditor script.aculo.us 1.8.2 to add editOnBlank feature
// Author : Sebastien Grosjean - ZenCocoon (http://www.zencocoon.com)
// Version : 1.2
//
// Please be aware that it's patching the actual version of InPlaceEditor (script.aculo.us 1.8.2)
// and it can make more damages on previous or later versions.
Object.extend(Ajax.InPlaceEditor.prototype, {
  initialize: function(element, url, options) {
    this.url = url;
    this.element = element = $(element);
    this.prepareOptions();
    this._controls = { };
    arguments.callee.dealWithDeprecatedOptions(options); // DEPRECATION LAYER!!!
    Object.extend(this.options, options || { });
    if (!this.options.formId && this.element.id) {
      this.options.formId = this.element.id + '-inplaceeditor';
      if ($(this.options.formId))
        this.options.formId = '';
    }
    if (this.options.externalControl)
      this.options.externalControl = $(this.options.externalControl);
    if (!this.options.externalControl)
      this.options.externalControlOnly = false;
    this._originalBackground = this.element.getStyle('background-color') || 'transparent';
    this.element.title = this.options.clickToEditText;
    this._boundCancelHandler = this.handleFormCancellation.bind(this);
    this._boundComplete = (this.options.onComplete || Prototype.emptyFunction).bind(this);
    this._boundFailureHandler = this.handleAJAXFailure.bind(this);
    this._boundSubmitHandler = this.handleFormSubmission.bind(this);
    this._boundWrapperHandler = this.wrapUp.bind(this);
    this.registerListeners();
    if (this.options.editOnBlank && this.getText().length == 0)
      this.enterEditMode();
  },
  handleAJAXFailure: function(transport) {
    this.triggerCallback('onFailure', transport);
    this.element.innerHTML = this._oldInnerHTML;
    this._oldInnerHTML = null;
    this.leaveEditMode();
  },
  wrapUp: function(transport) {
    this.leaveEditMode();
    if (this.options.editOnBlank && this.getText().length == 0)
      this.enterEditMode();
    // Can't use triggerCallback due to backward compatibility: requires
    // binding + direct element
    this._boundComplete(transport, this.element);
  }
});
Object.extend(Ajax.InPlaceEditor.DefaultOptions, {
  editOnBlank: true
});
//**** DEPRECATION LAYER FOR InPlace[Collection]Editor! ****
//**** This only  exists for a while,  in order to  let ****
//**** users adapt to  the new API.  Read up on the new ****
//**** API and convert your code to it ASAP!            ****

Ajax.InPlaceEditor.prototype.initialize.dealWithDeprecatedOptions = function(options) {
  if (!options) return;
  function fallback(name, expr) {
    if (name in options || expr === undefined) return;
    options[name] = expr;
  };
  fallback('cancelControl', (options.cancelLink ? 'link' : (options.cancelButton ? 'button' :
    options.cancelLink == options.cancelButton == false ? false : undefined)));
  fallback('okControl', (options.okLink ? 'link' : (options.okButton ? 'button' :
    options.okLink == options.okButton == false ? false : undefined)));
  fallback('highlightColor', options.highlightcolor);
  fallback('highlightEndColor', options.highlightendcolor);
};