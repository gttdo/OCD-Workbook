-- ─────────────────────────────────────────────────────────────────────────────
-- Seed the starter exposure catalogue.
--
-- These are global content, not user data. IDs are fixed and must stay in sync
-- with src/data/starterExposures.ts, because exposure_session.prompt_id is a
-- foreign key — a client-generated prompt id would fail on sync.
--
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

insert into exposure_prompt (id, text, category, difficulty, subtype_tags) values
  ('a0000000-0000-4000-8000-000000000001', 'Go to the shop without a list.',                        'Everyday',     2, '{}'),
  ('a0000000-0000-4000-8000-000000000002', 'Eat dessert before the main course.',                   'Everyday',     2, '{}'),
  ('a0000000-0000-4000-8000-000000000003', 'Take a different route somewhere you go often.',        'Everyday',     2, '{}'),
  ('a0000000-0000-4000-8000-000000000004', 'Send a message without reading it back.',               'Other people', 4, '{perfection}'),
  ('a0000000-0000-4000-8000-000000000005', 'Leave one thing out of place until tomorrow.',          'Order',        4, '{symmetry}'),
  ('a0000000-0000-4000-8000-000000000006', 'Let someone else choose what you watch.',               'Other people', 2, '{}'),
  ('a0000000-0000-4000-8000-000000000007', 'Order something you have never tried.',                 'Everyday',     3, '{}'),
  ('a0000000-0000-4000-8000-000000000008', 'Wonder about something for a day without looking it up.','Not knowing',  5, '{checking}'),
  ('a0000000-0000-4000-8000-000000000009', 'Reply in fewer words than you would like to.',          'Other people', 4, '{perfection}'),
  ('a0000000-0000-4000-8000-000000000010', 'Let a call go to voicemail and ring back later.',       'Other people', 3, '{}'),
  ('a0000000-0000-4000-8000-000000000011', 'Buy something small without reading the reviews.',      'Not knowing',  3, '{checking}'),
  ('a0000000-0000-4000-8000-000000000012', 'Walk into a room and straighten nothing.',              'Order',        5, '{symmetry}'),
  ('a0000000-0000-4000-8000-000000000013', 'Say "I do not know" out loud and leave it there.',      'Not knowing',  4, '{}'),
  ('a0000000-0000-4000-8000-000000000014', 'Take one photo and do not retake it.',                  'Everyday',     3, '{perfection}'),
  ('a0000000-0000-4000-8000-000000000015', 'Set a timer and stop when it goes, finished or not.',   'Everyday',     5, '{perfection}'),
  ('a0000000-0000-4000-8000-000000000016', 'Leave a message unanswered for an hour.',               'Other people', 4, '{}'),
  ('a0000000-0000-4000-8000-000000000017', 'Post something without checking it twice.',             'Other people', 5, '{perfection,checking}'),
  ('a0000000-0000-4000-8000-000000000018', 'Start a book in the middle.',                           'Order',        3, '{symmetry}'),
  ('a0000000-0000-4000-8000-000000000019', 'Let someone else load the dishwasher their way.',       'Order',        4, '{symmetry}'),
  ('a0000000-0000-4000-8000-000000000020', 'Make a small plan and change it halfway through.',      'Not knowing',  4, '{}')
on conflict (id) do update
  set text         = excluded.text,
      category     = excluded.category,
      difficulty   = excluded.difficulty,
      subtype_tags = excluded.subtype_tags;
