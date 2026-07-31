import type { CompulsionForm, OcdSubtype } from '@/db/types'

/**
 * Screener item bank.
 *
 * All wording here is original. The underlying constructs (obsession
 * persistence, compulsion function, subtype clusters) are standard clinical
 * material, but no phrasing is carried over from the source workbook — see
 * the content-rights note in README.md.
 */

export interface ScreenerItem {
  id: string
  text: string
}

export interface ScreenerSection {
  key: 'obsessions' | 'compulsions' | OcdSubtype
  title: string
  blurb?: string
  items: ScreenerItem[]
}

export const CORE_SECTIONS: ScreenerSection[] = [
  {
    key: 'obsessions',
    title: 'Unwanted thoughts',
    blurb: 'Think about the last couple of weeks.',
    items: [
      { id: 'o1', text: 'The same unwanted thought keeps returning, even when I try to move past it.' },
      { id: 'o2', text: 'It has been showing up regularly for two weeks or longer.' },
      { id: 'o3', text: 'Some of what comes to mind disturbs or frightens me.' },
      { id: 'o4', text: 'I try to push these thoughts away or shut them down, and it does not work.' },
    ],
  },
  {
    key: 'compulsions',
    title: 'What you do in response',
    items: [
      { id: 'c1', text: 'I do certain things over and over in response to those thoughts.' },
      { id: 'c2', text: 'I do them mainly to bring my anxiety down, not because I want to.' },
      { id: 'c3', text: 'Part of me knows it does not really help, and I do it anyway.' },
    ],
  },
]

export const SUBTYPE_SECTIONS: ScreenerSection[] = [
  {
    key: 'contamination',
    title: 'Contamination',
    items: [
      { id: 'ct1', text: 'I avoid touching things because of what might be on them.' },
      { id: 'ct2', text: 'I wash or clean far more than the people around me.' },
      { id: 'ct3', text: 'Germs, illness, or dirt take up a lot of my attention.' },
    ],
  },
  {
    key: 'symmetry',
    title: 'Order and symmetry',
    items: [
      { id: 'sy1', text: 'Things around me need to be arranged a particular way.' },
      { id: 'sy2', text: 'I notice immediately when something has been moved.' },
      { id: 'sy3', text: 'It upsets me when someone rearranges my things.' },
    ],
  },
  {
    key: 'checking',
    title: 'Checking and repeating',
    items: [
      { id: 'ck1', text: 'I check the same thing repeatedly.' },
      { id: 'ck2', text: 'Tasks take me a long time because I go back and repeat steps.' },
      { id: 'ck3', text: 'I worry a great deal about having made a mistake.' },
    ],
  },
  {
    key: 'harm',
    title: 'Fear of causing harm',
    items: [
      { id: 'hm1', text: 'I worry I might hurt someone through carelessness.' },
      { id: 'hm2', text: 'I fear losing control and doing something I would never choose to do.' },
      { id: 'hm3', text: 'I feel responsible for preventing harm to people, including strangers.' },
    ],
  },
  {
    key: 'perfection',
    title: 'Perfectionism',
    items: [
      { id: 'pf1', text: 'I hold myself to standards I cannot actually reach.' },
      { id: 'pf2', text: 'I redo work until it feels right.' },
      { id: 'pf3', text: 'Past mistakes stay with me.' },
    ],
  },
  {
    key: 'magical_thinking',
    title: 'Thoughts that feel powerful',
    items: [
      { id: 'mt1', text: 'Thinking about something bad makes it feel more likely to happen.' },
      { id: 'mt2', text: 'Certain numbers, words, or colours feel lucky or dangerous.' },
      { id: 'mt3', text: 'I believe my actions can prevent events they are not connected to.' },
    ],
  },
]

/**
 * The routing question, and the most consequential one in the app.
 *
 * v1's engine works by exposing you to a trigger and preventing the compulsive
 * response. That only works when the response is something observable and
 * timeable. Someone whose rituals are entirely mental needs imaginal exposure,
 * which is v2 — and they deserve to be told that plainly rather than handed a
 * fear ladder that will not fit them.
 */
export interface CompulsionFormOption {
  value: CompulsionForm | 'both'
  title: string
  detail: string
}

export const COMPULSION_FORM_OPTIONS: CompulsionFormOption[] = [
  {
    value: 'behavioral',
    title: 'Something you could see me do',
    detail: 'Washing, checking, arranging, redoing, asking for reassurance.',
  },
  {
    value: 'mental',
    title: 'Something entirely in my head',
    detail: 'Replaying events, reviewing, silently counting or praying, mentally checking.',
  },
  {
    value: 'both',
    title: 'Both, fairly evenly',
    detail: 'Some of each, depending on the situation.',
  },
]
