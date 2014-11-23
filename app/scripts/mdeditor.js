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
global marked: false
 */
var MdEditor,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

MdEditor = (function() {
  function MdEditor(selector, options) {
    this.fullscreen = __bind(this.fullscreen, this);
    this.image = __bind(this.image, this);
    this.link = __bind(this.link, this);
    this.code = __bind(this.code, this);
    this.italic = __bind(this.italic, this);
    this.bold = __bind(this.bold, this);
    var default_options;
    this.textarea = $(selector);
    if (this.textarea.length === 0) {
      return console.log('Aucun élément ne correspond à ce selecteuir');
    }
    default_options = {
      labelClose: 'Do you really want to close this window ? Every edit you did could be lost'
    };
    this.markdownSections = [];
    this.previewSections = [];
    this.lastMardownScrollTop = null;
    this.lastPreviewScrollTop = null;
    this.scrolling = false;
    this.isMarkdownMoving = false;
    this.isPreviewMoving = false;
    if (options !== void 0) {
      $.merge(this.options, options);
    }
    this.canExit = true;
    this.element = $("<div class=\"mdeditor\">\n  <div class=\"mdeditor_toolbar\"></div>\n  <div class=\"mdeditor_body\">\n    <section class=\"mdeditor_markdown\"><div class=\"mdeditor_scroll mdeditor_markdown_scroll\"><header>Markdown</header></div></section>\n    <section class=\"mdeditor_preview\"><div class=\"mdeditor_scroll mdeditor_preview_scroll\"><header>Aperçu</header><div class=\"mdeditor_render\"></div></div></section>\n  </div>\n</div>");
    this.markdownScroll = $('.mdeditor_markdown_scroll', this.element);
    this.previewScroll = $('.mdeditor_preview_scroll', this.element);
    this.preview = $('.mdeditor_render', this.element);
    this.toolbar = $('.mdeditor_toolbar', this.element);
    this.form = this.textarea.parents('form');
    this.textarea.after(this.element);
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
    this._bindEvents();
    this.fullscreen();
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
    if (e !== void 0) {
      e.preventDefault();
    }
    return $('.mdeditor_modal', this.element).toggle();
  };

  MdEditor.prototype.fullscreen = function(e) {
    if (e !== void 0) {
      e.preventDefault();
    }
    this.element.toggleClass('is-fullscreen');
    return this.editor.refresh();
  };

  MdEditor.prototype._bindEvents = function() {
    this.editor.on('change', (function(_this) {
      return function() {
        _this.cenExit = false;
        return _this.updatePreview();
      };
    })(this));
    this.form.submit(function() {
      var canExit;
      return canExit = true;
    });
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
          return _this.isPreviewMoving = false;
        };
      })(this));
    }
  });

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
        return mdSectionOffset = newSectionOffset;
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
        return previewSectionOffset = newSectionOffset;
      };
    })(this));
    this.previewSections.push({
      startOffset: previewSectionOffset,
      endOffset: this.previewScroll[0].scrollHeight,
      height: this.previewScroll[0].scrollHeight - previewSectionOffset
    });
    this.lastMardownScrollTop = -10;
    return this.lastPreviewScrollTop = -10;
  }, 500);

  return MdEditor;

})();
