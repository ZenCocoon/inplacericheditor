// InPlaceRichEditor, version 1.3.1
// 
// Author: Sebastien Grosjean (http://www.zencocoon.com, http://seb.box.re)
//
// Contributor:
//   Neil Rickards, Robert Muzslai, Andrew Petersen, Brian Hansen, Brian French,
//   Dan Dalf, Anton Mostovoy, Hans-Peter, Filipe Pina, Min Kim, Rudi Boutinaud,
//   Joaquin Miguez, E. Vrolijk - RedAnt Solutions, Tony Cuny
//
// InPlaceRichEditor is freely distributable under the terms of an MIT-style license.
// For details, see the inPlaceRichEditor web site: http://inplacericheditor.box.re/

if(typeof Ajax.InPlaceEditor == 'undefined')
  throw("InPlaceRichEditor requires including script.aculo.us' controls.js library");
if(typeof tinyMCE == 'undefined')
  throw("InPlaceRichEditor requires including moxiecode' tiny_mce.js library and proper initialization");

tinymce.EditorManager.oldAdd = tinymce.EditorManager.add;
tinymce.EditorManager.add = function(ed) {
  ed.onInit.add(function(ed) {
    $(ed.id).fire('tinymce:onInit', ed);
  });
  return tinymce.EditorManager.oldAdd(ed);
}

Ajax.InPlaceRichEditor = Class.create(Ajax.InPlaceEditor, {
  // Dump form InPlaceEditor with only few changes
  // * Add support of formIdSuffix option
  // * Deletion of the Deprecation layer
  // * Add tinymce initialization
  initialize: function(element, url, options, tinymce_options) {
    this.url = url;
    this.element = element = $(element);
    this.prepareOptions();
    this.tinymceOptions = Object.clone(tinymce_options);
    this._controls = { };
    // Removed :: arguments.callee.dealWithDeprecatedOptions(options); // DEPRECATION LAYER!!!
    Object.extend(this.options, options || { });
    this.prepareTinymceSave();
    if (!this.options.formId && this.element.id) {
      this.options.formId = this.element.id + '-' + this.options.formIdSuffix;
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
  createControl: function($super, mode, handler, extraClasses) {
    // if (!this.options.tinymceSave)
      $super(mode, handler, extraClasses);
  },
  createEditField: function() {
    var text = (this.options.loadTextURL ? this.options.loadingText : this.getText());
    var fld;
    fld = document.createElement('textarea');
    fld.id = this.element.id + '-' + this.options.textareaIdSuffix;
    fld.rows = 3;
    fld.cols = 40;
    fld.name = this.options.paramName;
    fld.value = text; // No HTML breaks conversion anymore
    fld.className = this.options.editorClassName;
	  // TODO: Check if onBlur can be supported
    // if (this.options.submitOnBlur)
    //   fld.onblur = this._boundSubmitHandler;
    this._controls.editor = fld;
    if (this.options.loadTextURL)
      this.loadExternalText();
    this._form.appendChild(this._controls.editor);
  },
  enterEditMode: function($super, e) {
    if (this.options.tinymceToElementSize)
      var elementDimensions = this.element.getDimensions();
	  $super(e);
    this.tinymce = new tinymce.Editor(this._controls.editor.id, this.tinymceOptions);
    this.tinymce.onInit.add(function(ed) {
      if (this._form.hasClassName(this.options.loadingClassName)) {
        this.tinymce.setProgressState(1);
      }
    }.bind(this));
    this.tinymce.inplacericheditor = this;
    if (this.options.tinymceToElementSize) {
      this.tinymce.settings.height = elementDimensions.height;
      this.tinymce.settings.width = elementDimensions.width;
    }
    this.tinymce.render();
  },
  getText: function() {
    return this.element.innerHTML;
  },
  handleAJAXFailure: function($super, transport) {
    $super(transport);
    this.tinymce.setContent(this.element.innerHTML);
  },
  handleFormSubmission: function($super, e) {
    this.tinymce.save();
    $super(e);
  },
  removeForm: function($super) {
    try {
      this.tinymce.remove();
    } catch(e) {}
	  $super();
  },
  // TODO: OPTIMIZATION: By adding the callback onLoadExternalText in the initial
  // InPlaceEditor would keep this code lighter and provide easier extentions
  loadExternalText: function() {
    this._form.addClassName(this.options.loadingClassName);
    this._controls.editor.disabled = true;
    var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
    Object.extend(options, {
      parameters: 'editorId=' + encodeURIComponent(this.element.id),
      onComplete: function() {
        this.tinymce.setProgressState(0);
      }.bind(this),
      onSuccess: function(transport) {
        this._form.removeClassName(this.options.loadingClassName);
        var text = transport.responseText;
        if (this.options.stripLoadedTextTags)
          text = text.stripTags();
        this._controls.editor.value = text;
        this.tinymce.setContent(text);
        this._controls.editor.disabled = false;
        this.postProcessEditField();
      }.bind(this),
      onFailure: this._boundFailureHandler
    });
    new Ajax.Request(this.options.loadTextURL, options);
  },
  postProcessEditField: function() {
	  var fpc = this.options.fieldPostCreation;
    $(this._controls.editor.id).observe('tinymce:onInit', function(event) {
      if (fpc) {
        if (fpc == 'focus') {
          event.memo.focus();
        } else if (fpc == 'activate') {
          event.memo.execCommand('SelectAll');
        }
      }
    });
  },
  prepareTinymceSave: function() {
    if (this.options.tinymceSave) {
      if (this.tinymceOptions.theme == 'simple') {
        this.options.tinymceSave = false;
        return;
      }
      if ((!(this.tinymceOptions.theme_advanced_buttons1 && this.tinymceOptions.theme_advanced_buttons1.match(/(^|,)save(,|$)/)) &&
           !(this.tinymceOptions.theme_advanced_buttons2 && this.tinymceOptions.theme_advanced_buttons2.match(/(^|,)save(,|$)/)) &&
           !(this.tinymceOptions.theme_advanced_buttons3 && this.tinymceOptions.theme_advanced_buttons3.match(/(^|,)save(,|$)/))) ||
          (this.tinymceOptions.plugins == undefined || !this.tinymceOptions.plugins.match(/(^|,)save(,|$)/))) {
        throw("InPlaceRichEditor' tinymceSave option require at least the save button and the save plugin in tinyMCE initialization.");
      }
      if (this.options.onTinymceSave)
        this.tinymceOptions.save_onsavecallback = this.options.onTinymceSave;
      if (this.options.onTinymceCancel)
        this.tinymceOptions.save_oncancelcallback = this.options.onTinymceCancel;
    }
  },
  prepareOptions: function() {
    this.options = Object.clone(Ajax.InPlaceRichEditor.DefaultOptions);
    Object.extend(this.options, Ajax.InPlaceRichEditor.DefaultCallbacks);
    [this._extraDefaultOptions].flatten().compact().each(function(defs) {
      Object.extend(this.options, defs);
    }.bind(this));
  }
});

Object.extend(Ajax.InPlaceRichEditor, {
  // size, cols, rows and autoRows options are now unused
  DefaultOptions: Object.extend(Object.clone(Ajax.InPlaceEditor.DefaultOptions), {
	  editorClassName: 'editor_field',
	  fieldPostCreation: 'focus',
    formClassName: 'inplacericheditor-form',
	  formIdSuffix: 'inplacericheditor',
    loadingClassName: 'inplacericheditor-loading',
    savingClassName: 'inplacericheditor-saving',
	  textareaIdSuffix: 'textarea-inplacericheditor',
	  tinymceSave: false,
	  tinymceToElementSize: false
  }),
  DefaultCallbacks: Object.extend(Object.clone(Ajax.InPlaceEditor.DefaultCallbacks), {
    onTinymceSave: function(ed) { ed.inplacericheditor._boundSubmitHandler(); },
  	onTinymceCancel: function(ed) { ed.inplacericheditor._boundCancelHandler(); }
  })
});