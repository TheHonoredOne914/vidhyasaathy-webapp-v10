import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthIcon } from '../auth/AuthIcon';
import { NotebookCircle, NotebookFooter, NotebookHeader, NotebookNight } from '../auth/Notebook';
import { SchoolBackground, SchoolScene } from '../components/SchoolBackground';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import '../landing/landing.css';

const games = [
  { image: 's-bio.jpg', title: 'Bio Quest', chapter: 'Ch 5 · cell membrane' },
  { image: 's-atom.jpg', title: 'Atom Workshop 3D', chapter: 'Ch 4 · structure of the atom' },
  { image: 's-refl.jpg', title: 'Reflection Lab', chapter: 'light kahan jaayegi?' },
  { image: 's-tinker.jpg', title: 'Tinker', chapter: 'history · early humans' },
  { image: 's-numerical.jpg', title: 'Numerical game', chapter: 'Ch 8 · motion' },
];
const questions = [
  ['Does Saathy just make things up?', 'No. It answers from the notes and material your school approved, and cites the note it used. If a topic isn’t covered, it says so.'],
  ['We share one phone at home. Okay?', 'Yes. Each child has a separate profile and PIN. Their progress never mixes.'],
  ['What if the internet drops?', 'Chapters, quizzes and games can be synced for offline use. Answers save on the phone and sync later.'],
  ['How does a student get an account?', 'The school prints a claim sheet with an activation code. Enter it once, set a PIN, done.'],
];

export function Landing() {
  usePageMeta(PAGE.landing.title, PAGE.landing.description);
  const page = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const sections = page.current?.querySelectorAll('.nb-section > .nb-wrap, .nb-stop, .nb-vision > .nb-wrap') ?? [];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.classList.add('is-visible');
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.08 });
    sections.forEach((section) => {
      section.classList.add('school-reveal');
      observer.observe(section);
    });
    return () => {
      observer.disconnect();
      sections.forEach((section) => section.classList.remove('school-reveal', 'is-visible'));
    };
  }, []);
  return <div className="vs-notebook vs-landing school-scene" id="top" ref={page}>
    <SchoolBackground />
    <NotebookHeader />
    <main id="content">
      <section className="nb-hero" aria-labelledby="hero-title">
        <SchoolScene name="hero" />
        <NotebookNight />
        <div className="nb-hero-copy">
          <p className="nb-kicker">3:40 pm, school&apos;s out</p>
          <h1 id="hero-title">Learning doesn&apos;t stop at the <span className="nb-bell">bell.
            <svg className="nb-underline" viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden="true"><path d="M3 15 C30 9,62 18,95 12 S160 7,196 13 M14 20 C60 15,120 20,170 16" /></svg>
            <svg className="nb-bell-doodle" viewBox="0 0 56 60" aria-hidden="true"><path d="M28 6 L28 11 M14 40 C16 30,13 13,28 12 C43 12,40 30,43 40 Z M10 41 L46 40 M24 46 C25 50,31 50,32 46" /><path className="nb-blue-stroke" d="M6 16 C3 20,3 26,5 30 M50 15 C53 19,54 25,51 30" /></svg>
          </span></h1>
          <p className="nb-hero-sub">Your school&apos;s notes, practice and Saathy, every evening.</p>
          <div className="nb-ctas"><a className="nb-button" href="#day">See how it works</a><Link className="nb-text-link" to="/register-school">Register your school</Link></div>
          <p className="nb-trust">for <b>students</b> · <b>teachers</b> · <b>parents</b> · <b>schools</b></p>
        </div>
        <svg className="nb-path" viewBox="0 0 1280 712" preserveAspectRatio="none" aria-hidden="true"><path d="M410 540 C510 548,640 520,735 440" vectorEffect="non-scaling-stroke" /></svg>
        <div className="nb-ground" /><img className="nb-hero-mascot" src="/img/mascot.webp" width="140" height="140" alt="Saathy, the cloud mascot" />
        <div className="nb-mascot-note">this is Saathy<svg viewBox="0 0 70 60" aria-hidden="true"><path d="M2 20 C20 6,40 8,60 30 M60 30 L48 28 M60 30 L58 18" /></svg></div>
        <div className="nb-phone"><img src="/img/chat-crop.jpg" width="600" height="893" alt="Saathy explaining the Cartesian plane with an interactive graph" fetchPriority="high" /></div>
        <div className="nb-tonight"><p>tonight&apos;s games</p><div className="nb-polaroids">{[['g-bio-quest.jpg', 'Bio Quest'], ['g-atom-workshop-3d.jpg', 'Atom Workshop'], ['g-reflection-lab.jpg', 'Reflection Lab']].map(([image, label]) => <div className="nb-polaroid" key={image}><img src={`/img/${image}`} width="94" height="76" alt="" /><small>{label}</small></div>)}</div></div>
      </section>

      <section className="nb-section" id="who" aria-labelledby="paths-title"><SchoolScene name="who" /><div className="nb-wrap">
        <p className="nb-kicker">who it&apos;s for</p><h2 id="paths-title">One school, <span className="nb-circle">four<NotebookCircle /></span> kinds of homework.</h2>
        <div className="nb-timetable nb-ruled nb-paper"><span className="nb-margin" /><div className="nb-table-title">Timetable, after the bell <small>written in by your school</small></div>
          <div className="nb-table-scroll" tabIndex={0} role="region" aria-label="What each school role can do"><table><thead><tr><th aria-label="Role details" /><th id="for-students" scope="col"><AuthIcon name="student" size={20} /> Student</th><th id="for-teachers" scope="col"><AuthIcon name="teacher" size={20} /> Teacher</th><th id="for-parents" scope="col"><AuthIcon name="parent" size={20} /> Parent</th><th scope="col"><AuthIcon name="school" size={20} /> School admin</th></tr></thead><tbody>
            <tr><th scope="row">gets</th><td><ul><li>teacher&apos;s notes and short sessions, one idea per slide</li><li>quizzes, games, friendly challenges</li><li>Saathy for doubts at night</li></ul></td><td><ul><li>publish notes, sessions and quizzes per chapter</li><li>a <span className="nb-highlight">daily report</span>: who finished, weak concepts</li><li>doubts grouped by topic</li></ul></td><td><ul><li>a dashboard of your child&apos;s progress</li><li>what they studied, what needs practice</li><li>never their private chats</li></ul></td><td><ul><li>set up classes, sections, subjects</li><li>invite teachers</li><li>import roster, print claim sheets</li></ul></td></tr>
            <tr><th scope="row">signs in with</th><td>activation code, then PIN</td><td>school email + password</td><td>email + password</td><td>school email + password</td></tr>
          </tbody></table></div><p className="nb-note nb-table-note">same app, a different page for each</p>
        </div>
      </div></section>

      <section className="nb-day" id="day" aria-labelledby="day-title"><SchoolScene name="day" /><div className="nb-wrap"><span id="how-it-works" className="nb-anchor" /><span id="after-the-bell" className="nb-anchor" />
        <p className="nb-kicker">a student&apos;s day</p><h2 id="day-title">What happens after 3:40.</h2><div className="nb-timeline-line" />
        <article className="nb-stop"><span className="nb-dot" /><div className="nb-stop-time">3:40 pm<small>school&apos;s out</small></div><div className="nb-stop-body"><div className="nb-slip nb-ruled nb-paper"><span className="nb-tape" /><h3>Ch 8 · Motion</h3><p>notes from class, by your teacher<br />· speed vs velocity<br />· <span className="nb-highlight-blue">uniform acceleration</span><br />· s = ut + ½at²</p></div><div className="nb-annotation"><p>Your teacher&apos;s notes are waiting. The same ones from class.</p><p>Sessions unlock one slide at a time, and end with a short check.</p></div></div></article>
        <article className="nb-stop"><span className="nb-dot" /><div className="nb-stop-time">5:00 pm<small>a doubt</small></div><div className="nb-stop-body"><div className="nb-clip nb-paper"><span className="nb-tape nb-tape--sky" /><img src="/img/s-chat.jpg" width="360" height="537" loading="lazy" alt="Saathy chat with an interactive graph" /></div><div className="nb-annotation"><p>Ask Saathy. It answers <span className="nb-highlight">only from your teacher&apos;s material</span>, gives a hint before the answer, and shows the note it used.</p><p>If it isn&apos;t in the notes, Saathy says so.</p></div></div></article>
        <article className="nb-stop"><span className="nb-dot" /><div className="nb-stop-time">7:00 pm<small>practice</small></div><div className="nb-stop-body"><div className="nb-clip nb-paper"><span className="nb-tape" /><img src="/img/s-numerical.jpg" width="300" height="420" loading="lazy" alt="Numerical game: a bus accelerating from rest" /></div><div className="nb-annotation"><p>A numerical game on the same chapter: drag a point, see distance as an area.</p><p>Missed a concept? A short lesson and a 2-question check first.</p></div></div></article>
        <article className="nb-stop nb-stop--night"><span className="nb-dot" /><div className="nb-stop-time">9:00 pm<small>report goes home</small></div><div className="nb-stop-body"><div className="nb-slip nb-grid nb-paper"><span className="nb-tape nb-tape--sky" /><h3>Today, Aditya <small>(sample)</small></h3><p>session: Uniform acceleration ✓<br />check: 4 / 5<br />to revisit: <span className="nb-highlight">units in answers</span></p></div><div className="nb-annotation"><p>Parents get a progress summary.</p><p>The teacher&apos;s report is ready before the next class.</p></div></div></article>
      </div></section>

      <section className="nb-section" id="games" aria-labelledby="games-title"><SchoolScene name="games" /><div className="nb-wrap"><span id="inside" className="nb-anchor" />
        <p className="nb-kicker">tonight&apos;s games</p><h2 id="games-title">Five games, one textbook.</h2><p className="nb-lead">All these games are developed for the <span className="nb-highlight">conceptual learning</span> of students.</p>
        <div className="nb-tickets">{games.map((game) => <article className="nb-ticket" key={game.image}><span className="nb-pin" /><img src={`/img/${game.image}`} width="196" height="124" loading="lazy" alt={game.title} /><div className="nb-ticket-stub">{game.title}<small>{game.chapter}</small></div></article>)}</div><p className="nb-note nb-practice-note">streaks count <s>logins</s> correct practice, never time spent</p>
      </div></section>

      <section className="nb-section nb-section--short" id="board" aria-labelledby="board-title"><SchoolScene name="board" /><div className="nb-wrap">
        <p className="nb-kicker">board examiner</p><h2 id="board-title">Checked like the board would.</h2><p className="nb-lead">Write your answer step by step. The board examiner marks against the CBSE marking scheme and shows exactly where a mark went.</p>
        <div className="nb-answer nb-ruled nb-paper"><span className="nb-margin" /><div className="nb-answer-header"><span>Q 14 · 3 marks</span><span>Science · Class 9</span><span>Ch 8 · Motion</span></div><img src="/img/s-board.jpg" width="520" height="450" loading="lazy" alt="Board examiner marking an answer step by step" /><span className="nb-mark">2/3</span><svg className="nb-mark-circle" viewBox="0 0 84 72" aria-hidden="true"><path d="M42 6 C12 4,2 30,10 50 C20 70,70 70,78 40 C84 14,56 2,36 10" /></svg><div className="nb-answer-note"><p>“25” without “m” costs the final mark.<br /><span>The physics is right.</span></p><svg viewBox="0 0 120 40" aria-hidden="true"><path d="M116 8 C80 4,40 14,6 30 M6 30 L18 20 M6 30 L20 34" /></svg></div><p className="nb-answer-note nb-answer-note--second">then: show the model answer,<br />or try a similar question</p></div>
      </div></section>

      <section className="nb-section nb-section--short" id="learn" aria-labelledby="learn-title"><SchoolScene name="learn" /><div className="nb-wrap">
        <p className="nb-kicker">personalised learning</p><h2 id="learn-title">A report card that changes the lesson.</h2><div className="nb-report-card"><img className="nb-learner-image" src="/img/s-learner.jpg" width="520" height="517" loading="lazy" alt="Saathy learner profile: difficulty, pace, explanation style, hints" /><div><div className="nb-crest"><img src="/img/logo.webp" width="36" height="36" alt="" />Progress card</div><p className="nb-muted">Class 9-A · CBSE · last 3 weeks</p><dl><dt>Difficulty</dt><dd>moves up when you get 3 in a row</dd><dt>Pace</dt><dd>shorter steps if long sessions drop off</dd><dt>Explanation</dt><dd>diagrams first, if diagrams help you</dd><dt>Hints</dt><dd>fewer, later, as you grow.</dd></dl><p className="nb-remarks">Remarks: every student falls into one of <span className="nb-circle">four learner groups<NotebookCircle /></span>, and the next session is picked from evidence.</p></div></div>
      </div></section>

      <section className="nb-section nb-section--short" id="safety" aria-labelledby="safety-title"><SchoolScene name="safety" /><div className="nb-wrap nb-safety-grid" id="school-connected"><div id="privacy-safety"><p className="nb-kicker">privacy and safety</p><h2 id="safety-title">Signed, before anything starts.</h2><p className="nb-lead">Built for children, with India&apos;s DPDP Act 2023 in mind: a child&apos;s data needs parent consent, and every account sees only what its role allows.</p></div><div className="nb-permission nb-paper"><svg className="nb-scissors" viewBox="0 0 28 20" aria-hidden="true"><circle cx="6" cy="5" r="4" /><circle cx="6" cy="15" r="4" /><path d="M9 7 L26 15 M9 13 L26 5" /></svg><h3>Permission slip</h3><p className="nb-permission-sub">VidhyaSaathy · to be returned to class teacher</p><ul>{['Students claim school accounts. Nobody signs up a child.', 'Parents see progress, never private Saathy chats.', 'Saathy answers only from school-approved material.', 'No public leaderboards. Shared phones: one PIN per child.'].map((line) => <li key={line}><span className="nb-check" aria-hidden="true"><svg viewBox="0 0 32 30"><path d="M4 16 L12 24 L28 4" /></svg></span>{line}</li>)}</ul><div className="nb-signature"><div>Parent&apos;s signature<span /></div><div>Date<span /></div></div></div></div></section>

      <section className="nb-section nb-section--short" id="faq" aria-labelledby="faq-title"><SchoolScene name="faq" /><div className="nb-wrap"><p className="nb-kicker">questions passed in class</p><h2 id="faq-title">Chits from the back bench.</h2><div className="nb-chits">{questions.map(([question, answer]) => <article className="nb-chit nb-paper" key={question}><h3><span>Q.</span>{question}</h3><p>{answer}</p></article>)}</div></div></section>

      <section className="nb-vision" id="vision" aria-labelledby="vision-title"><SchoolScene name="vision" /><div className="nb-wrap"><p className="nb-kicker">why we&apos;re building this</p><h2 id="vision-title">A school system where no child needs a coaching class to understand their own textbook.</h2><Link className="nb-button nb-button--peach" to="/register-school">Register your school</Link><div className="nb-sleep"><svg viewBox="0 0 260 220" aria-hidden="true"><g stroke="#f9f6ee" strokeWidth="2" strokeLinejoin="round"><path d="M18 172 L238 168 L240 198 L20 202 Z" fill="#517dab" /><path d="M30 142 L226 138 L228 168 L32 172 Z" fill="#d6e2e6" /><path d="M48 114 L210 112 L212 140 L50 142 Z" fill="#f9f6ee" /><path d="M30 186 L228 182 M44 156 L214 152" fill="none" stroke="#041d3d" opacity=".5" /><path d="M200 40 L214 40 L200 56 L214 56 M222 14 L232 14 L222 26 L232 26" fill="none" strokeLinecap="round" /></g></svg><img src="/img/mascot.webp" width="150" height="150" loading="lazy" alt="Saathy asleep on a stack of books" /></div></div></section>
    </main>
      <footer className="nb-cover"><SchoolScene name="cover" /><div className="nb-wrap"><div className="nb-cover-label"><div className="nb-cover-brand"><img src="/img/logo.webp" width="32" height="32" alt="" />VidhyaSaathy</div>Name<span className="nb-label-line" /><br />Class<span className="nb-label-line nb-label-line--class" /> Section<span className="nb-label-line nb-label-line--section" /><br />School<span className="nb-label-line" /></div></div><NotebookFooter /></footer>
  </div>;
}
