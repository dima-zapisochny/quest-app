export interface HowToStep {
  scene: string
  title: string
  text: string
}

export const HOWTO_PLAY_STEPS: HowToStep[] = [
  { scene: 'start', title: 'howto.play1Title', text: 'howto.play1Text' },
  { scene: 'join', title: 'howto.play2Title', text: 'howto.play2Text' },
  { scene: 'open', title: 'howto.play3Title', text: 'howto.play3Text' },
  { scene: 'buzz', title: 'howto.play4Title', text: 'howto.play4Text' },
  { scene: 'score', title: 'howto.play5Title', text: 'howto.play5Text' }
]

export const HOWTO_CREATE_STEPS: HowToStep[] = [
  { scene: 'new', title: 'howto.create1Title', text: 'howto.create1Text' },
  { scene: 'board', title: 'howto.create2Title', text: 'howto.create2Text' },
  { scene: 'fill', title: 'howto.create3Title', text: 'howto.create3Text' },
  { scene: 'done', title: 'howto.create4Title', text: 'howto.create4Text' }
]
