import {h, Component} from 'preact'
import {Bold, Italic, Fullscreen, Speech} from './buttons'
import CodeMirrorComponent from './CodeMirrorComponent'
import * as CodeMirror from 'codemirror'
import Markdown from './MarkdownComponent'
import { ISections, SectionsGenerator } from '../libs/SectionsGenerator'
import {debounce} from 'lodash'
import './Editor.scss'

interface IState {
  content: string
  editor: CodeMirror.Editor,
  fullscreen: boolean
}

interface IProps {
  value: string,
  name: string
}

export default class EditorComponent extends Component<IProps,IState> {

  private _sections: {[key: string]: ISections} | null = null

  private isScrolling: string | null = null

  get sections () {
    if (this._sections === null) {
      this._sections = {
        editor: SectionsGenerator.fromElement(this.base.querySelector('.mdeditor__editor') as HTMLElement),
        preview: SectionsGenerator.fromElement(this.base.querySelector('.mdeditor__preview') as HTMLElement)
      }
    }
    return this._sections
  }

  constructor (props: IProps) {
    super(props)
    this.state.content = EditorComponent.unescapeHtml(props.value)
    this.state.fullscreen = false
    this.setEditor = this.setEditor.bind(this)
    this.toggleFullscreen = this.toggleFullscreen.bind(this)
    this.resetScrolling = debounce(this.resetScrolling.bind(this), 500)
  }

  static unescapeHtml (safe: string): string {
    return safe.replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, '\'')
  }

  render () {
    let cls = 'mdeditor'
    if (this.state.fullscreen) { cls += ' mdeditor--fullscreen' }
    let {content, editor} = this.state
    return <div class={cls}>
      <div class="mdeditor__toolbar">
        <div className="mdeditor__toolbarleft">
          {editor && [
            <Bold editor={editor}/>,
            <Italic editor={editor}/>,
            <Speech editor={editor}/>
          ]}
        </div>
        <div className="mdeditor__toolbarright">
          {editor && <Fullscreen editor={editor} onClick={this.toggleFullscreen}/>}
        </div>
      </div>
      <div class="mdeditor__editor" onScroll={this.onScroll('editor')}>
        <CodeMirrorComponent content={content} onReady={this.setEditor}/>
      </div>
      <div class="mdeditor__preview" onScroll={this.onScroll('preview')}>
        <Markdown content={content}/>
      </div>
    </div>
  }

  componentDidUpdate (prevProps: IProps, prevState: IState) {
    if (prevState.fullscreen !== this.state.fullscreen) {
      this.state.editor.refresh()
    }
    if (prevState.content !== this.state.content) {
      this._sections = null
    }
  }

  setEditor (editor: CodeMirror.Editor): void {
    this.setState({editor})
    editor.on('change', e => {
      this.setState({content: e.getDoc().getValue()})
    })
  }

  toggleFullscreen (fullscreen: boolean): void {
    this.setState({fullscreen})
  }

  private onScroll (source: 'preview' | 'editor') {
    return (e: Event) => {
      if (this.isScrolling === null) {
        this.isScrolling = source
      } else if (this.isScrolling !== source) {
        return false
      }
      let dest = source === 'preview' ? 'editor' : 'preview'
      let offsetTop = SectionsGenerator.getScrollPosition(
        (e.target as HTMLElement).scrollTop,
        this.sections[source],
        this.sections[dest]
      )
      let $dest = this.base.querySelector('.mdeditor__' + dest) as HTMLElement
      if ($dest) {
        $dest.scrollTop = offsetTop
      }
      this.resetScrolling()
    }
  }

  private resetScrolling () {
    this.isScrolling = null
  }
}
