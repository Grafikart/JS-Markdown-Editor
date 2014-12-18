'use strict';

/*
global $: false
 */

/*
global _: false
 */

/*
global CodeMirror: false
 */

/*
global Dropzone: false
 */

/*
global marked: false
 */
var MdEditor,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

MdEditor = (function() {
  function MdEditor(selector, options) {
    this.save = __bind(this.save, this);
    this.fullscreen = __bind(this.fullscreen, this);
    this.image = __bind(this.image, this);
    this.link = __bind(this.link, this);
    this.code = __bind(this.code, this);
    this.italic = __bind(this.italic, this);
    this.bold = __bind(this.bold, this);
    this.textarea = $(selector);
    if (this.textarea.length === 0) {
      return console.log('Aucun élément ne correspond à ce selecteuir');
    }
    this.options = {
      labelClose: 'Do you really want to close this window ? Every edit you did could be lost',
      labelInsert: 'Insert',
      labelDelete: 'Delete',
      labelSuccess: 'Content saved with success',
      labelImage: 'Insert your image url',
      labelConfirm: 'Do you really want to delete this picture ?',
      preview: true,
      uploader: false,
      uploaderData: {},
      ctrls: true,
      imageURL: function(el) {
        return el.url;
      },
      flash: function(message, type) {
        return window.alert(message);
      }
    };
    this.markdownSections = [];
    this.previewSections = [];
    this.lastMardownScrollTop = null;
    this.lastPreviewScrollTop = null;
    this.scrolling = false;
    this.isMarkdownMoving = false;
    this.isPreviewMoving = false;
    if (options !== void 0) {
      $.extend(this.options, options);
    }
    this.canExit = true;
    this.element = $("<div class=\"mdeditor\">\n  <div class=\"mdeditor_toolbar\"></div>\n  <div class=\"mdeditor_body\">\n    <section class=\"mdeditor_markdown\"><div class=\"mdeditor_scroll mdeditor_markdown_scroll\"><header>Markdown</header></div></section>\n    <section class=\"mdeditor_preview\"><div class=\"mdeditor_scroll mdeditor_preview_scroll\"><header>Aperçu</header><div class=\"mdeditor_render formatted\"></div></div></section>\n  </div>\n  <div class=\"mdeditor_modal\"><div class=\"mdeditor_drop\"></div></div>\n</div>");
    this.markdownScroll = $('.mdeditor_markdown_scroll', this.element);
    this.previewScroll = $('.mdeditor_preview_scroll', this.element);
    this.preview = $('.mdeditor_render', this.element);
    this.toolbar = $('.mdeditor_toolbar', this.element);
    this.form = this.textarea.parents('form');
    this.textarea.after(this.element);
    if (!this.options.preview) {
      this.element.addClass('has-no-preview');
    }
    $('.mdeditor_markdown .mdeditor_scroll', this.element).append(this.textarea);
    this.editor = CodeMirror.fromTextArea(this.textarea[0], {
      mode: 'markdown',
      tabMode: 'indent',
      theme: 'neo',
      lineWrapping: true,
      viewportMargin: Infinity
    });
    this.updatePreview();
    this._buildToolbar();
    this._buildDropzone();
    this._bindEvents();
  }

  MdEditor.prototype.updatePreview = function() {
    var text;
    text = this.editor.getValue();
    this.textarea.val(this.editor.getValue());
    if (this.preview.is(':visible')) {
      this.preview.html(marked(text), {
        breaks: true
      });
      return this._setSections();
    }
  };

  MdEditor.prototype.flash = function(message, type) {
    if (type === void 0) {
      type = 'error';
    }
    return this.options.flash(message, type);
  };

  MdEditor.prototype.bold = function(e) {
    if (e !== void 0) {
      e.preventDefault();
    }
    this.editor.doc.replaceSelection('**' + this.editor.doc.getSelection('around') + '**');
    return this.editor.focus();
  };

  MdEditor.prototype.italic = function(e) {
    if (e !== void 0) {
      e.preventDefault();
    }
    this.editor.doc.replaceSelection('*' + this.editor.doc.getSelection('around') + '*');
    return this.editor.focus();
  };

  MdEditor.prototype.code = function(e) {
    if (e !== void 0) {
      e.preventDefault();
    }
    this.editor.doc.replaceSelection("```\n" + this.editor.doc.getSelection('around') + "\n```");
    return this.editor.focus();
  };

  MdEditor.prototype.link = function(e) {
    var cursor;
    if (e !== void 0) {
      e.preventDefault();
    }
    this.editor.doc.replaceSelection('[' + this.editor.doc.getSelection('end') + ']()');
    cursor = this.editor.doc.getCursor();
    this.editor.doc.setCursor({
      line: cursor.line,
      ch: cursor.ch - 1
    });
    return this.editor.focus();
  };

  MdEditor.prototype.image = function(e) {
    var cursor, url;
    if (e !== void 0) {
      e.preventDefault();
    }
    if (this.options.uploader === false) {
      url = window.prompt(this.options.labelImage);
      this.editor.doc.replaceSelection("![](" + url + ")");
      cursor = this.editor.doc.getCursor();
      this.editor.doc.setCursor({
        line: cursor.line,
        ch: 2
      });
      return this.editor.focus();
    } else {
      return $('.mdeditor_modal', this.element).toggle();
    }
  };

  MdEditor.prototype.fullscreen = function(e) {
    if (e !== void 0) {
      e.preventDefault();
    }
    this.element.toggleClass('is-fullscreen');
    this.editor.refresh();
    return this.updatePreview();
  };

  MdEditor.prototype.save = function(e) {
    if (e !== void 0) {
      e.preventDefault();
    }
    if (this.canExit) {
      return true;
    }
    $.ajax({
      dataType: 'json',
      url: this.form.attr('action'),
      data: this.form.serialize(),
      type: this.form.attr('method')
    }).done((function(_this) {
      return function(data) {
        _this.canExit = true;
        return _this.flash(_this.options.labelSuccess, 'success');
      };
    })(this)).fail((function(_this) {
      return function(jqXHR) {
        return _this.flash(jqXHR.responseText);
      };
    })(this));
    return false;
  };

  MdEditor.prototype._bindEvents = function() {
    this.markdownScroll.click((function(_this) {
      return function() {
        return _this.editor.focus();
      };
    })(this));
    this.editor.on('change', (function(_this) {
      return function() {
        _this.canExit = false;
        return _this.updatePreview();
      };
    })(this));
    this.form.submit((function(_this) {
      return function() {
        _this.canExit = true;
        return true;
      };
    })(this));
    $(document).keydown((function(_this) {
      return function(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) {
          if (e.which === 83 && _this.options.ctrls) {
            return _this.save(e);
          } else if (e.which === 66) {
            return _this.bold(e);
          } else if (e.which === 73) {
            return _this.italic(e);
          } else if (e.which === 76) {
            return _this.link(e);
          }
        }
        if (e.which === 27 && _this.element.hasClass('is-fullscreen')) {
          return _this.fullscreen(e);
        }
      };
    })(this));
    $(window).bind('beforeunload', (function(_this) {
      return function() {
        if (!_this.canExit) {
          return _this.options.labelClose;
        }
      };
    })(this));
    this.markdownScroll.scroll((function(_this) {
      return function() {
        if (_this.isMarkdownMoving === false) {
          _this.scrolling = 'markdown';
          _this._syncScroll();
        }
        return true;
      };
    })(this));
    return this.previewScroll.scroll((function(_this) {
      return function() {
        if (_this.isPreviewMoving === false) {
          _this.scrolling = 'preview';
          _this._syncScroll();
        }
        return true;
      };
    })(this));
  };

  MdEditor.prototype._syncScroll = _.throttle(function() {
    var destScrollTop, markdownScrollTop, previewScrollTop;
    if (!this.preview.is(':visible') || this.markdownSections.length === 0 || this.previewSections.length === 0) {
      return false;
    }
    markdownScrollTop = this.markdownScroll.scrollTop();
    previewScrollTop = this.previewScroll.scrollTop();
    destScrollTop = 0;
    if (this.scrolling === 'markdown') {
      if (Math.abs(markdownScrollTop - this.lastMarkdownScrollTop) <= 9) {
        return false;
      }
      this.scrolling = false;
      this.lastMarkdownScrollTop = markdownScrollTop;
      destScrollTop = this._scrollTop(markdownScrollTop, this.markdownSections, this.previewSections);
      if (Math.abs(destScrollTop - previewScrollTop) <= 9) {
        this.lastPreviewScrollTop = previewScrollTop;
        return false;
      }
      this.isPreviewMoving = true;
      return this.previewScroll.stop().animate({
        scrollTop: destScrollTop
      }, 100, (function(_this) {
        return function() {
          _this.isPreviewMoving = false;
          return true;
        };
      })(this));
    }
  }, 100);

  MdEditor.prototype._scrollTop = function(srcScrollTop, srcList, destList) {
    var destSection, posInSection, section, sectionIndex;
    sectionIndex = 0;
    section = _.find(srcList, function(section, index) {
      sectionIndex = index;
      return srcScrollTop < section.endOffset;
    });
    if (section === void 0) {
      return 0;
    }
    posInSection = (srcScrollTop - section.startOffset) / (section.height || 1);
    destSection = destList[sectionIndex];
    return destSection.startOffset + destSection.height * posInSection;
  };

  MdEditor.prototype._buildToolbar = function() {
    $('<button class="mdeditor_bold">b</button>').appendTo(this.toolbar).click(this.bold);
    $('<button class="mdeditor_italic">i</button>').appendTo(this.toolbar).click(this.italic);
    $('<button class="mdeditor_link">l</button>').appendTo(this.toolbar).click(this.link);
    $('<button class="mdeditor_picture">p</button>').appendTo(this.toolbar).click(this.image);
    $('<button class="mdeditor_code">c</button>').appendTo(this.toolbar).click(this.code);
    return $('<button class="mdeditor_fullscreen">f</button>').appendTo(this.toolbar).click(this.fullscreen);
  };

  MdEditor.prototype._buildDropzone = function() {
    var editor, options, that;
    if (this.options.uploader === false) {
      return false;
    }
    options = this.options;
    editor = this.editor;
    that = this;
    this.dropzone = new Dropzone($('.mdeditor_drop').get(0), {
      maxFiles: 10,
      paramName: 'image',
      url: options.uploader,
      addRemoveLinks: false,
      thumbnailWidth: 150,
      thumbnailHeight: 150,
      init: function() {
        var addButton, drop;
        drop = this;
        addButton = function(file) {
          var $previewElement;
          $previewElement = $(file.previewElement);
          $previewElement.append('<a class="dz-insert">' + options.labelInsert + '</a>');
          $previewElement.append('<a class="dz-remove">' + options.labelDelete + '</a>');
          $('.dz-remove', $previewElement).click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (window.confirm(options.labelConfirm)) {
              return $.ajax({
                url: options.uploader + '/' + file.id,
                method: 'DELETE'
              }).done(function(data) {
                console.log(file);
                return $(file.previewElement).fadeOut(500, function() {
                  return drop.removeFile(file);
                });
              }).fail(function(jqXHR) {
                return that.flash(jqXHR.responseText);
              });
            }
          });
          return $('.dz-insert', $previewElement).click(function(e) {
            var cursor;
            e.preventDefault();
            e.stopPropagation();
            editor.doc.replaceSelection("![](" + (options.imageURL(file)) + ")");
            cursor = editor.doc.getCursor();
            editor.doc.setCursor({
              line: cursor.line,
              ch: 2
            });
            editor.focus();
            return $('.mdeditor_modal').hide();
          });
        };
        this.on('addedfile', function(file) {
          return addButton(file);
        });
        this.on('sending', function(file, jqXHR, formData) {
          return $.each(options.uploaderData, function(k, v) {
            return formData.append(k, v);
          });
        });
        this.on('success', function(file, response) {
          $.extend(file, response);
          return $(file.previewElement).removeClass('dz-processing');
        });
        this.on('error', function(file, errorMessage, xhr) {
          that.flash(errorMessage);
          return $(file.previewElement).fadeOut();
        });
        if (options.images) {
          return $.each(options.images, function(k, image) {
            drop.options.addedfile.call(drop, image);
            drop.options.thumbnail.call(drop, image, options.imageURL(image));
            drop.files.push(image);
            return addButton(image);
          });
        }
      }
    });
  };

  MdEditor.prototype._setSections = _.debounce(function() {
    var mdSectionOffset, previewSectionOffset;
    this.markdownSections = [];
    this.previewSections = [];
    mdSectionOffset = null;
    previewSectionOffset = null;
    $('.CodeMirror-code .cm-header', this.element).each((function(_this) {
      return function(index, element) {
        var newSectionOffset;
        if (mdSectionOffset === null) {
          mdSectionOffset = 0;
          return;
        }
        newSectionOffset = $(element).offset().top + _this.markdownScroll.scrollTop();
        _this.markdownSections.push({
          startOffset: mdSectionOffset,
          endOffset: newSectionOffset,
          height: newSectionOffset - mdSectionOffset
        });
        mdSectionOffset = newSectionOffset;
      };
    })(this));
    this.markdownSections.push({
      startOffset: mdSectionOffset,
      endOffset: this.markdownScroll[0].scrollHeight,
      height: this.markdownScroll[0].scrollHeight - mdSectionOffset
    });
    this.preview.find('h1, h2, h3, h4, h5').each((function(_this) {
      return function(index, element) {
        var newSectionOffset;
        if (previewSectionOffset === null) {
          previewSectionOffset = 0;
          return;
        }
        newSectionOffset = $(element).offset().top + _this.previewScroll.scrollTop();
        _this.previewSections.push({
          startOffset: previewSectionOffset,
          endOffset: newSectionOffset,
          height: newSectionOffset - previewSectionOffset
        });
        previewSectionOffset = newSectionOffset;
      };
    })(this));
    this.previewSections.push({
      startOffset: previewSectionOffset,
      endOffset: this.previewScroll[0].scrollHeight,
      height: this.previewScroll[0].scrollHeight - previewSectionOffset
    });
    this.lastMardownScrollTop = -10;
    this.lastPreviewScrollTop = -10;
  }, 500);

  return MdEditor;

})();
