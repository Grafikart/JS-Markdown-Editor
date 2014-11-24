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
global Dropzone: false
###
###
global marked: false
###

class MdEditor

  constructor: (selector, options) ->
    @textarea = $(selector)
    return console.log('Aucun élément ne correspond à ce selecteuir') if @textarea.length is 0

    @options = {
      labelClose: 'Do you really want to close this window ? Every edit you did could be lost',
      labelInsert: 'Insert',
      labelDelete: 'Delete',
      labelSuccess: 'Content save with success',
      labelImage: 'Insert your image url',
      preview: true,
      uploader: false,
      uploaderData: {}
    }

    # Variables
    @markdownSections = []  # Sections of content in the markdown
    @previewSections = []   # Sections of content in the HTML (used for _scrollSync)
    @lastMardownScrollTop = null
    @lastPreviewScrollTop = null
    @scrolling = false      # What is scrolling ? markdown or preview
    @isMarkdownMoving= false
    @isPreviewMoving = false
    $.extend(@options, options) if options isnt undefined
    @canExit = true # Can we close the window safely ?

    # HTML and Elements Variable
    @element = $("""
    <div class="mdeditor">
      <div class="mdeditor_toolbar"></div>
      <div class="mdeditor_body">
        <section class="mdeditor_markdown"><div class="mdeditor_scroll mdeditor_markdown_scroll"><header>Markdown</header></div></section>
        <section class="mdeditor_preview"><div class="mdeditor_scroll mdeditor_preview_scroll"><header>Aperçu</header><div class="mdeditor_render"></div></div></section>
      </div>
      <div class="mdeditor_modal"><div class="mdeditor_drop"></div></div>
    </div>
    """)
    @markdownScroll = $('.mdeditor_markdown_scroll', @element) # used for scroll syncing
    @previewScroll = $('.mdeditor_preview_scroll', @element)
    @preview = $('.mdeditor_render', @element) # Content will be injected here
    @toolbar = $('.mdeditor_toolbar', @element)
    @form = @textarea.parents('form') # We catch parent form (for autosave features CTRL+S)

    @textarea.after(@element)
    @element.addClass('has-no-preview') if !@options.preview
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
    @_buildDropzone()
    @_bindEvents()

  # Update preview content from markdown content
  updatePreview: ->
    text = @editor.getValue()
    @textarea.val(@editor.getValue())

    if @preview.is ':visible'
      @preview.html marked(text), breaks: true
      @_setSections()

  flash: (message) ->
    alert(message)

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
    @editor.doc.replaceSelection('[' + @editor.doc.getSelection('end') + ']()')
    cursor = @editor.doc.getCursor();
    @editor.doc.setCursor({line: cursor.line, ch: cursor.ch - 1})
    @editor.focus()

  # Display image panel or prompt for image link
  image: (e) =>
    e.preventDefault() if e isnt undefined
    if @options.uploader is false
      url = window.prompt @options.labelImage
      @editor.doc.replaceSelection("![](#{url})")
      cursor = @editor.doc.getCursor()
      @editor.doc.setCursor({line: cursor.line, ch: 2})
      @editor.focus()
    else
      $('.mdeditor_modal', @element).toggle()

  fullscreen: (e) =>
    e.preventDefault() if e isnt undefined
    @element.toggleClass('is-fullscreen')
    @editor.refresh()


  save: (e) =>
    e.preventDefault if e isnt undefined
    return true if canExit
    $.ajax(
      dataType: 'json',
      url: @form.attr('action'),
      data: @form.serialize(),
      type: @form.attr('method')
    ).done( (data) =>
      @canExit = true;
      @flash(@options.labelSuccess)
    ).fail( (jqXHR) =>
      @flash(jqXHR.responseText)
    )

  # Bind various events
  _bindEvents: ->
    # When changing markdown content
    @editor.on 'change', =>
      @cenExit = false
      @updatePreview()

    # Submiting cut the beforeunload
    @form.submit ->
      canExit = true
      return true

    # Keyboard shortcuts
    $(document).keydown =>
      if e.ctrlKey or e.metaKey
        if e.which is 83
          @save(e)
        else if e.which is 66
          @bold(e)
        else if e.which is 73
          @italic(e)
        else if e.which is 76
          @link(e)
      fullscreen(e) if e.which is 27 and @element.hasClass('is-fullscreen')

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
      @previewScroll.stop().animate(scrollTop: destScrollTop, 100, =>
        @isPreviewMoving = false
        return true
      )
  , 100)

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

  _buildDropzone: ->
    return false if @options.uploader is false
    options = @options
    flash = @flash
    editor = @editor
    @dropzone = new Dropzone $('.mdeditor_drop').get(0),
      maxFiles: 10,
      paramName: 'image',
      url: options.uploader,
      addRemoveLinks: true,
      thumbnailWidth: 150,
      thumbnailHeight:150,
      dictRemoveFile: options.labelDelete,
      init: ->
        drop = this
        addButton = (file) ->
          $previewElement = $(file.previewElement)
          $previewElement.append('<a class="dz-insert" href="#">' + options.labelInsert + '</a>')
          $('.dz-insert', $previewElement).click (e) ->
            e.preventDefault()
            e.stopPropagation()
            editor.doc.replaceSelection("![](#{file.url})")
            cursor = editor.doc.getCursor()
            editor.doc.setCursor({line: cursor.line, ch: 2})
            editor.focus()
            $('.mdeditor_modal').hide()
        this.on 'addedfile', (file) -> addButton(file)
        this.on 'sending', (file, jqXHR, formData) -> $.extend(formData, options.uploaderData)
        this.on 'success', (file, response) ->
          $.extend(file, response)
          $(file.previewElement).removeClass('dz-processing')
        this.on 'error', (file, errorMessage, xhr) ->
          flash(errorMessage)
          $(file.previewElement).fadeOut()
        this.on 'removedfile', (file) ->
          $.ajax(
            url: options.uploader + '/' + file.id,
            method: 'DELETE'
          ).done((data) ->
          ).fail((jqXHR) ->
            flash(jqXHR.responseText)
          )
        $.each options.images, (k, image) ->
          drop.options.addedfile.call(drop, image)
          drop.options.thumbnail.call(drop, image, image.url)
          drop.files.push(image)
          addButton(image)
    return

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
      return
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
      return
    # Last section till the end
    @previewSections.push({
      startOffset: previewSectionOffset,
      endOffset: @previewScroll[0].scrollHeight,
      height: @previewScroll[0].scrollHeight - previewSectionOffset
    })

    @lastMardownScrollTop = -10
    @lastPreviewScrollTop = -10
    return
  , 500)

#
