import { Link } from 'react-router-dom'

/**
 * The landing page.
 *
 * Most people arrive here because a therapist sent them a link, in a state
 * where they are deciding whether this is safe rather than whether it is
 * exciting. So it answers three questions plainly — what this is, what it will
 * ask of you, and what it will not do to you — and then gets out of the way.
 *
 * No testimonials, no claims of outcomes, no urgency. Nothing here promises
 * treatment: it is homework, and saying so is both honest and the position
 * that keeps this out of regulated-device territory.
 */
export function Landing() {
  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-16 pt-14 sm:px-6 sm:pt-24">
      <div className="mb-14">
        <h1 className="text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
          The homework, not the therapy.
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-700">
          A place to do the exposure work your therapist gives you between
          sessions — instead of on paper you have to remember to carry.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            to="/signup"
            className="tap block w-full rounded-xl bg-ink-900 px-4 py-3 text-center
                       font-medium text-white active:bg-ink-800"
          >
            Create an account
          </Link>
          <Link
            to="/signin"
            className="tap block w-full rounded-xl border border-ink-300 bg-white px-4 py-3
                       text-center font-medium text-ink-800 active:bg-ink-50"
          >
            I already have one
          </Link>
        </div>
      </div>

      <section className="space-y-8">
        <Block title="What it does">
          <p>
            You list what you avoid, put it in your own order, and work up it a
            step at a time. Before each attempt you write down what you think
            will happen; afterwards, what actually did. Seeing the gap between
            those two is what loosens a fear.
          </p>
          <p>
            There is also a timer for the moment an urge hits, when you want to
            hold off rather than give in.
          </p>
        </Block>

        <Block title="What it will ask of you">
          <p>
            Exposure work means going towards what frightens you and not doing
            the thing that makes it stop. It is uncomfortable on purpose, and
            for the first week or two it often feels worse before it eases.
          </p>
          <p>
            Nothing here decides what you should face or how fast. That stays
            between you and your therapist.
          </p>
        </Block>

        <Block title="What it will not do">
          <ul className="space-y-2">
            <li>No streaks, no scores, nothing built to keep you opening it.</li>
            <li>No analytics or advertising trackers of any kind.</li>
            <li>Your writing is never used to train anything.</li>
            <li>
              No reminders unless you ask for them, at a time you choose in
              advance.
            </li>
          </ul>
          <p>
            If it is working, you should find yourself opening it less over
            time, not more.
          </p>
        </Block>

        <Block title="It works without signal">
          <p>
            The moments where this matters happen in bathrooms, kitchens, car
            parks and at three in the morning. Once you have signed in, it keeps
            working with no connection and catches up later.
          </p>
        </Block>
      </section>

      <p className="mt-12 rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-600">
        This is not treatment and not a diagnosis. It is a place to practise
        work you are doing with a professional. If you are in crisis, contact
        your local emergency services — in the US you can call or text 988, and
        in the UK you can call Samaritans on 116 123.
      </p>
    </div>
  )
}

function Block({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-sm font-medium text-ink-500">{title}</h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-ink-700">
        {children}
      </div>
    </div>
  )
}
