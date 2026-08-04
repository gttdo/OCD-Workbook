import type { OcdSubtype } from '@/db/types'

/**
 * Vignettes.
 *
 * The source workbook's strongest device is a short "does this sound like
 * you?" passage — concrete enough to be recognised, ordinary enough to be a
 * relief. We cannot use hers, so these are ours.
 *
 * Written to three rules. They are specific, because "worries about germs"
 * recognises nobody and "washes until the water runs cold" recognises someone.
 * They are undramatic, because a person with harm obsessions already believes
 * they are a monster and does not need the prose to agree. And every one
 * carries the beat that actually defines the disorder: knowing it makes no
 * sense, and doing it anyway.
 */
export interface Vignette {
  subtype: OcdSubtype
  text: string
}

export const VIGNETTES: Vignette[] = [
  {
    subtype: 'contamination',
    text: 'Someone washes their hands until the water runs cold, and knows while they are doing it that this is more than anyone needs. They have quietly stopped using the kitchen at work. They tell colleagues they just prefer their own mug.',
  },
  {
    subtype: 'checking',
    text: 'Someone photographs the hob before leaving the house. On the train they look at the photo. Then they look again, because the first time they might not have properly seen it.',
  },
  {
    subtype: 'harm',
    text: 'Someone drives over a pothole and cannot stop wondering whether it was a person. They go back around the block. Nothing is there. They go around once more anyway, and then check the local news that evening.',
  },
  {
    subtype: 'symmetry',
    text: 'Someone straightens the towels before bed, then straightens them again because one was sitting slightly forward. They know perfectly well that nothing happens if the towels are crooked. They lie awake thinking about the towels.',
  },
  {
    subtype: 'perfection',
    text: 'Someone rewrites a three-line email eleven times. Every version says the same thing. They send the eleventh, then open the sent folder to reread it and work out whether it sounded cold.',
  },
  {
    subtype: 'magical_thinking',
    text: 'Someone has a thought about their mother dying as they walk through a doorway, so they walk back through it thinking something else. They know this is not how anything works. Not doing it feels like gambling with someone else’s life.',
  },
]

export const VIGNETTE_FRAMING =
  'None of these people are unusual, and none of them are their thoughts. This is what it looks like from the inside.'
