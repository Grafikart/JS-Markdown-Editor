import {h, Component} from 'preact'
import * as marked from 'marked'

interface IProps {
  content: string
}

export default class MarkdownComponent extends Component<IProps,{}> {

  render () {
    return <div dangerouslySetInnerHTML={{__html: this.renderMarkdown()}}/>
  }

  renderMarkdown (): string {
    marked.setOptions({
      gfm: true,
      tables: true,
      breaks: true,
      pedantic: false,
      sanitize: true,
      smartLists: true,
      smartypants: false,
      xhtml: false
    })
    return marked(this.props.content)
  }

}
