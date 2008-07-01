var tinymce_options = {
  mode : "textareas",
  theme : "simple"
};

var tinymce_advanced_options = {
  mode : "textareas",
  theme : "advanced"
};

var tinymce_advanced_with_save_options = {
  mode : "textareas",
  theme : "advanced",
  theme_advanced_buttons1: 'save,cancel',
  plugins: 'save'
};

tinyMCE.init(tinymce_advanced_options);
tinyMCE.init(tinymce_advanced_with_save_options);
tinyMCE.init(tinymce_options);