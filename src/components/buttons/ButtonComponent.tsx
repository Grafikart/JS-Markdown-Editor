import {h, Component} from 'preact'
import * as CodeMirror from 'codemirror'

export interface ButtonProps {
  editor: CodeMirror.Editor
}

export class Button<TState = {}, TProps extends ButtonProps = ButtonProps> extends Component<TProps,TState> {

  constructor (props: TProps) {
    super(props)
    this.action = this.action.bind(this)
  }

  render (): JSX.Element | null {
    return <button onClick={this.onClick}>{this.icon()}</button>
  }

  icon (): JSX.Element | null {
    return null
  }

  action (editor: CodeMirror.Editor): void {
  }

  onClick = (e: MouseEvent) => {
    e.preventDefault()
    this.action(this.props.editor)
  }

}
