import type { ExposurePrompt } from '@/db/types'

/**
 * Starter exposures — the on-ramp.
 *
 * Deliberately low-stakes and mostly subtype-agnostic. Asking someone on day
 * one to walk up their fear ladder is a wall: high effort, high dread, no
 * payoff. These give a real win in five minutes, and every one of them
 * practises the same underlying skill — letting something be unresolved and
 * finding out that nothing happens.
 *
 * IDs are fixed so they match the rows seeded in
 * supabase/migrations/0002_seed_exposure_prompts.sql. exposure_session.prompt_id
 * is a foreign key, so these cannot be generated at runtime.
 *
 * Wording is original. The technique — behavioural experiments in tolerating
 * uncertainty — is standard clinical material and belongs to nobody.
 */

function id(n: number): string {
  return `a0000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

export const STARTER_EXPOSURES: ExposurePrompt[] = [
  { id: id(1), text: 'Go to the shop without a list.', category: 'Everyday', difficulty: 2, subtypeTags: [], isActive: true },
  { id: id(2), text: 'Eat dessert before the main course.', category: 'Everyday', difficulty: 2, subtypeTags: [], isActive: true },
  { id: id(3), text: 'Take a different route somewhere you go often.', category: 'Everyday', difficulty: 2, subtypeTags: [], isActive: true },
  { id: id(4), text: 'Send a message without reading it back.', category: 'Other people', difficulty: 4, subtypeTags: ['perfection'], isActive: true },
  { id: id(5), text: 'Leave one thing out of place until tomorrow.', category: 'Order', difficulty: 4, subtypeTags: ['symmetry'], isActive: true },
  { id: id(6), text: 'Let someone else choose what you watch.', category: 'Other people', difficulty: 2, subtypeTags: [], isActive: true },
  { id: id(7), text: 'Order something you have never tried.', category: 'Everyday', difficulty: 3, subtypeTags: [], isActive: true },
  { id: id(8), text: 'Wonder about something for a day without looking it up.', category: 'Not knowing', difficulty: 5, subtypeTags: ['checking'], isActive: true },
  { id: id(9), text: 'Reply in fewer words than you would like to.', category: 'Other people', difficulty: 4, subtypeTags: ['perfection'], isActive: true },
  { id: id(10), text: 'Let a call go to voicemail and ring back later.', category: 'Other people', difficulty: 3, subtypeTags: [], isActive: true },
  { id: id(11), text: 'Buy something small without reading the reviews.', category: 'Not knowing', difficulty: 3, subtypeTags: ['checking'], isActive: true },
  { id: id(12), text: 'Walk into a room and straighten nothing.', category: 'Order', difficulty: 5, subtypeTags: ['symmetry'], isActive: true },
  { id: id(13), text: 'Say "I do not know" out loud and leave it there.', category: 'Not knowing', difficulty: 4, subtypeTags: [], isActive: true },
  { id: id(14), text: 'Take one photo and do not retake it.', category: 'Everyday', difficulty: 3, subtypeTags: ['perfection'], isActive: true },
  { id: id(15), text: 'Set a timer and stop when it goes, finished or not.', category: 'Everyday', difficulty: 5, subtypeTags: ['perfection'], isActive: true },
  { id: id(16), text: 'Leave a message unanswered for an hour.', category: 'Other people', difficulty: 4, subtypeTags: [], isActive: true },
  { id: id(17), text: 'Post something without checking it twice.', category: 'Other people', difficulty: 5, subtypeTags: ['perfection', 'checking'], isActive: true },
  { id: id(18), text: 'Start a book in the middle.', category: 'Order', difficulty: 3, subtypeTags: ['symmetry'], isActive: true },
  { id: id(19), text: 'Let someone else load the dishwasher their way.', category: 'Order', difficulty: 4, subtypeTags: ['symmetry'], isActive: true },
  { id: id(20), text: 'Make a small plan and change it halfway through.', category: 'Not knowing', difficulty: 4, subtypeTags: [], isActive: true },
]

export const STARTER_CATEGORIES = [
  'Everyday',
  'Not knowing',
  'Order',
  'Other people',
] as const
