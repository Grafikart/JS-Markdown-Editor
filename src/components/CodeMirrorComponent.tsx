import {h, Component} from 'preact'
import * as CodeMirror from 'codemirror'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/neo.css'

interface IProps {
  content: string
  onReady: (editor: CodeMirror.Editor) => void
}

export default class CodeMirrorComponent extends Component<IProps,{}> {

  constructor () {
    super()
  }

  render () {
    return <div/>
  }

  componentDidMount () {
    let editor = CodeMirror(this.base, {
      value: this.props.content,
      mode: 'markdown',
      theme: 'neo',
      lineWrapping: true,
      viewportMargin: Infinity,
      cursorBlinkRate: 0
    })
    this.props.onReady(editor)
  }

  shouldComponentUpdate (nextProps: IProps) {
    return false
  }

}
