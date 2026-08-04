/**
 * The concepts library.
 *
 * Reference, never a curriculum. Nothing links here demanding to be read,
 * nothing tracks whether you have, and there is no order to work through.
 *
 * Kept plain on purpose: these words get used by clinicians without being
 * explained, and someone who has just been told they need to do "response
 * prevention" deserves somewhere to find out what that means without asking a
 * chatbot that will reassure them along the way.
 */
export interface Concept {
  term: string
  body: string[]
}

export const CONCEPTS: Concept[] = [
  {
    term: 'Obsession',
    body: [
      'An unwanted thought, image or urge that keeps returning and will not settle when you try to reason with it.',
      'Almost everyone gets intrusive thoughts. What makes one an obsession is not the content — it is that it sticks, and that it seems to mean something about you.',
    ],
  },
  {
    term: 'Compulsion',
    body: [
      'Something you do to make the discomfort stop. Washing, checking, arranging, asking, or replaying an event in your head until it feels settled.',
      'Compulsions work, briefly. That is exactly the problem: the relief teaches your brain the danger was real and you escaped it.',
    ],
  },
  {
    term: 'Avoidance',
    body: [
      'Staying away from what sets it off. It counts as a compulsion even though it looks like nothing is happening.',
      'Avoidance is what keeps a fear intact — you never find out you were wrong, so the fear is never corrected.',
    ],
  },
  {
    term: 'Exposure',
    body: [
      'Deliberately meeting the thing that sets off the obsession, rather than waiting for it to ambush you.',
      'Planned is not the same as easier. It is the fact that you chose it that makes it work.',
    ],
  },
  {
    term: 'Response prevention',
    body: [
      'The other half, and the half that does most of the work: not doing the compulsion afterwards.',
      'Exposure without it is just a bad afternoon. The learning happens in the gap where the compulsion used to be.',
    ],
  },
  {
    term: 'Expectancy violation',
    body: [
      'The active ingredient, as it is currently understood. You predict something specific will happen, it does not, and the belief updates.',
      'This is why the prediction is written down before you start. Afterwards, a fear that turned out to be wrong is remembered as milder than it was.',
    ],
  },
  {
    term: 'Habituation',
    body: [
      'The older explanation: stay with something long enough and the distress comes down on its own.',
      'It still describes what usually happens, which is why distress ratings are worth taking. It is no longer thought to be the main mechanism.',
    ],
  },
  {
    term: 'Safety behaviour',
    body: [
      'A small thing that takes the edge off during an exposure — wearing gloves, holding your breath, doing it only when someone else is home.',
      'It feels like coping and works like avoidance. It gives your brain something else to credit for the fact that nothing went wrong.',
    ],
  },
  {
    term: 'Reassurance-seeking',
    body: [
      'Asking — a person, a search engine, a chatbot — whether it is going to be fine.',
      'It is a compulsion like any other, and a particularly slippery one because it looks like sensible information-gathering. The relief lasts minutes and the need comes back larger.',
    ],
  },
  {
    term: 'Lapse',
    body: [
      'Doing a compulsion you had stopped doing, or a fear coming back after it had gone quiet.',
      'Expected, and not a return to the start. What worked before works again — usually starting smaller than you think you need to.',
    ],
  },
]
