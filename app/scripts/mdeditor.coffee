'use strict'

###
global $: false
###
###
global _: false
###
###
global CodeMirror: false
###
###
global marked: false
###

class MdEditor

  constructor: (selector, options) ->
    @textarea = $(selector)
    return console.log('Aucun élément ne correspond à ce selecteuir') if @textarea.length is 0

    default_options = {
      labelClose: 'Do you really want to close this window ? Every edit you did could be lost'
    }

    # Variables
    @markdownSections = []  # Sections of content in the markdown
    @previewSections = []   # Sections of content in the HTML (used for _scrollSync)
    @lastMardownScrollTop = null
    @lastPreviewScrollTop = null
    @scrolling = false      # What is scrolling ? markdown or preview
    @isMarkdownMoving= false
    @isPreviewMoving = false
    $.merge(@options, options) if options isnt undefined
    @canExit = true # Can we close the window safely ?

    # HTML and Elements Variable
    @element = $("""
    <div class="mdeditor">
      <div class="mdeditor_toolbar"></div>
      <div class="mdeditor_body">
        <section class="mdeditor_markdown"><div class="mdeditor_scroll mdeditor_markdown_scroll"><header>Markdown</header></div></section>
        <section class="mdeditor_preview"><div class="mdeditor_scroll mdeditor_preview_scroll"><header>Aperçu</header><div class="mdeditor_render"></div></div></section>
      </div>
    </div>
    """)
    @markdownScroll = $('.mdeditor_markdown_scroll', @element) # used for scroll syncing
    @previewScroll = $('.mdeditor_preview_scroll', @element)
    @preview = $('.mdeditor_render', @element) # Content will be injected here
    @toolbar = $('.mdeditor_toolbar', @element)
    @form = @textarea.parents('form') # We catch parent form (for autosave features CTRL+S)

    @textarea.after(@element)
    $('.mdeditor_markdown .mdeditor_scroll', @element).append(@textarea)

    # CodeMirror offers a nice way to style Markdown while editing
    @editor = CodeMirror.fromTextArea @textarea[0],
      mode: 'markdown',
      tabMode: 'indent',
      theme: 'neo',
      lineWrapping: true,
      viewportMargin: Infinity

    @updatePreview()
    @_buildToolbar()
    @_bindEvents()
    @fullscreen()

  # Update preview content from markdown content
  updatePreview: ->
    text = @editor.getValue()
    @textarea.val(@editor.getValue())

    if @preview.is ':visible'
      @preview.html marked(text), breaks: true
      @_setSections()

  # Transform selection with bold **
  bold: (e) =>
    e.preventDefault() if e isnt undefined
    @editor.doc.replaceSelection('**' + @editor.doc.getSelection('around') + '**')
    @editor.focus()

  # Transform selection with Italic *
  italic: (e) =>
    e.preventDefault() if e isnt undefined
    @editor.doc.replaceSelection('*' + @editor.doc.getSelection('around') + '*')
    @editor.focus()

  # Transform selection with code ```
  code: (e) =>
    e.preventDefault() if e isnt undefined
    @editor.doc.replaceSelection("```\n" + @editor.doc.getSelection('around') + "\n```")
    @editor.focus()

  # Transform selection with link []()
  link: (e) =>
    e.preventDefault() if e isnt undefined
    @editor.doc.replaceSelection('[' + @editor.doc.getSelection('end') + ']()');
    cursor = @editor.doc.getCursor();
    @editor.doc.setCursor({line: cursor.line, ch: cursor.ch - 1})
    @editor.focus()

  # Display image panel or prompt for image link
  image: (e) =>
    e.preventDefault() if e isnt undefined
    $('.mdeditor_modal', @element).toggle()

  fullscreen: (e) =>
    e.preventDefault() if e isnt undefined
    @element.toggleClass('is-fullscreen')
    @editor.refresh()

  # Bind various events
  _bindEvents: ->
    # When changing markdown content
    @editor.on 'change', =>
      @cenExit = false
      @updatePreview()

    # Submiting cut the beforeunload
    @form.submit -> canExit = true

    # Prevent user from leaving by mistake
    $(window).bind 'beforeunload', => return @options.labelClose if !@canExit

    # Scrolling (when fullscreen enabled)
    @markdownScroll.scroll =>
      if @isMarkdownMoving is false
        @scrolling = 'markdown'
        @_syncScroll()
      return true
    @previewScroll.scroll =>
      if @isPreviewMoving is false
        @scrolling = 'preview'
        @_syncScroll()
      return true

  # Sync scroll position between markdown and preview
  _syncScroll: _.throttle( ->
    return false if !@preview.is(':visible') or @markdownSections.length is 0 or @previewSections.length is 0
    markdownScrollTop = @markdownScroll.scrollTop()
    previewScrollTop = @previewScroll.scrollTop()
    destScrollTop = 0

    if @scrolling is 'markdown'
      return false if Math.abs(markdownScrollTop - @lastMarkdownScrollTop) <= 9
      @scrolling = false
      @lastMarkdownScrollTop = markdownScrollTop
      destScrollTop = @_scrollTop(markdownScrollTop, @markdownSections, @previewSections)
      # Cancel animation for short scrolls
      if Math.abs(destScrollTop - previewScrollTop) <= 9
        @lastPreviewScrollTop = previewScrollTop
        return false
      @isPreviewMoving = true
      @previewScroll.stop().animate(scrollTop: destScrollTop, 100, => @isPreviewMoving = false)
  )

  # get scrollTop to reach
  _scrollTop: (srcScrollTop, srcList, destList) ->
    sectionIndex = 0
    section = _.find(srcList, (section, index) ->
      sectionIndex = index;
      return srcScrollTop < section.endOffset
    )
    return 0 if section is undefined
    posInSection = (srcScrollTop - section.startOffset) / (section.height || 1)
    destSection = destList[sectionIndex]
    return (destSection.startOffset + destSection.height * posInSection)

  # Inject buttons for the toolbar
  _buildToolbar: ->
    $('<button class="mdeditor_bold">b</button>').appendTo(@toolbar).click @bold
    $('<button class="mdeditor_italic">i</button>').appendTo(@toolbar).click @italic
    $('<button class="mdeditor_link">l</button>').appendTo(@toolbar).click @link
    $('<button class="mdeditor_picture">p</button>').appendTo(@toolbar).click @image
    $('<button class="mdeditor_code">c</button>').appendTo(@toolbar).click @code
    $('<button class="mdeditor_fullscreen">f</button>').appendTo(@toolbar).click @fullscreen

  # To sync the scroll we need to build an array of every section (a shit load of code inside)
  _setSections: _.debounce(->
    @markdownSections = []
    @previewSections = []

    mdSectionOffset = null
    previewSectionOffset = null

    # Markdown sections, we detect every h1, h2, h3, h4....
    $('.CodeMirror-code .cm-header', @element).each (index, element) =>
      if mdSectionOffset is null
        mdSectionOffset = 0
        return
      newSectionOffset = $(element).offset().top + @markdownScroll.scrollTop()
      @markdownSections.push({
        startOffset: mdSectionOffset,
        endOffset: newSectionOffset,
        height: newSectionOffset - mdSectionOffset
      });
      mdSectionOffset = newSectionOffset
    # Last section till the end
    @markdownSections.push(
      startOffset: mdSectionOffset,
      endOffset: @markdownScroll[0].scrollHeight,
      height: @markdownScroll[0].scrollHeight - mdSectionOffset
    )

    # HTML Sections, we detect every h1, h2, h3, h4....
    @preview.find('h1, h2, h3, h4, h5').each (index, element) =>
      if previewSectionOffset is null
        previewSectionOffset = 0
        return
      newSectionOffset = $(element).offset().top + @previewScroll.scrollTop()
      @previewSections.push(
        startOffset: previewSectionOffset,
        endOffset: newSectionOffset,
        height: newSectionOffset - previewSectionOffset
      )
      previewSectionOffset = newSectionOffset
    # Last section till the end
    @previewSections.push({
      startOffset: previewSectionOffset,
      endOffset: @previewScroll[0].scrollHeight,
      height: @previewScroll[0].scrollHeight - previewSectionOffset
    })

    @lastMardownScrollTop = -10;
    @lastPreviewScrollTop = -10;
  , 500)

#
