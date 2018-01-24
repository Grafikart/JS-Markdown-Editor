import { h, render } from 'preact'
import Editor from './components/EditorComponent'

let $editor = document.querySelector('#editor') as HTMLDivElement | null

if ($editor) {
  render(<Editor value={$editor.innerHTML} name="demo"/>, $editor, $editor.lastChild as Element)
}
