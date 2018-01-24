import HTML = marked.Tokens.HTML

type ISection = [number, number]
export type ISections = ISection[]

let selectors: string[] = []
for (let i = 1; i < 6; i++) {
  selectors.push('.cm-header-' + i, 'h' + i)
}

export class SectionsGenerator {

  static selectors: string[] = selectors

  static fromElement (element: HTMLElement): ISections {
    let matches = element.querySelectorAll(this.selectors.join(', ')) as NodeListOf<HTMLElement>
    let previous = 0
    let sections: ISections = []
    matches.forEach(sectionElement => {
      let offsetTop = this.offsetTop(sectionElement, element)
      sections.push([previous, offsetTop])
      previous = offsetTop
    })
    sections.push([previous, element.scrollHeight])
    return sections
  }

  static offsetTop (element: HTMLElement, target: HTMLElement, acc = 0): number {
    if (element === target) {
      return acc
    }
    return this.offsetTop(element.parentElement as HTMLElement, target, acc + element.offsetTop)
  }

  static getIndex (offsetTop: number, sections: ISections): number {
    return sections.findIndex(function (section) {
      return offsetTop >= section[0] && offsetTop <= section[1]
    })
  }

  static getScrollPosition (offsetTop: number, sectionsSource: ISections, sectionsDest: ISections): number {
    let index = this.getIndex(offsetTop, sectionsSource)
    let section = sectionsSource[index]
    let percentage = (offsetTop - section[0]) / (section[1] - section[0])
    let sectionDest = sectionsDest[index]
    return sectionDest[0] + percentage * (sectionDest[1] - sectionDest[0])
  }

}
