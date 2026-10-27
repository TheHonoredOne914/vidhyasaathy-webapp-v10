import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import '../theme/vs-theme.css';

export function Privacy() {
  usePageMeta(PAGE.privacy.title, PAGE.privacy.description);
  return (
    <div className="vs-page">
      <header className="vs-page-header">
        <p className="vs-eyebrow">Your school, your information</p>
        <h1>Privacy</h1>
        <p>What VidhyaSaathy stores, what stays in this browser, and how your session works.</p>
        <aside className="vs-notice" aria-label="Privacy review">
          <p>This page describes the data stored by this version. It needs review under India's Digital Personal Data Protection Act before a school uses VidhyaSaathy with real student data.</p>
        </aside>
      </header>
      <div className="vs-privacy-layout">
        <nav className="vs-card vs-contents" aria-labelledby="privacy-contents-title">
          <h2 id="privacy-contents-title">On this page</h2>
          <ul>
            <li><a href="#school-and-accounts">School and accounts</a></li>
            <li><a href="#students">Students</a></li>
            <li><a href="#classes">Classes and invitations</a></li>
            <li><a href="#sessions">Sessions, audit, and rate limits</a></li>
            <li><a href="#this-browser">This browser</a></li>
            <li><a href="#retention">How long it is kept</a></li>
          </ul>
        </nav>
        <div className="vs-card vs-privacy-article">
          <section id="school-and-accounts" aria-labelledby="school-privacy-title">
            <h2 id="school-privacy-title">School and accounts</h2>
            <p>A school record stores the school name and when it was registered. The administrator profile stores a name, role, and school. The administrator account stores an email address and an Argon2id hash of the password. The password itself is not stored.</p>
          </section>
          <section id="students" aria-labelledby="student-privacy-title">
            <h2 id="student-privacy-title">Students</h2>
            <p>A student profile stores a name, the student role, and the school. A roster import also stores the section and roll number. The one-time activation code is stored as a SHA-256 hash and, until it is used or it expires, as encrypted text so an administrator can print it. The PIN is stored only as an Argon2id hash. This version does not store a student email address.</p>
          </section>
          <section id="classes" aria-labelledby="class-privacy-title">
            <h2 id="class-privacy-title">Classes and invitations</h2>
            <p>An academic year stores a name and the start and end dates. A class, section, and subject each store a name and the school. A teacher invitation stores an email address, the assigned sections and subjects, an expiry, and a hash of the invitation token. The token is shown once to the administrator and is not stored. These pages do not collect a parent account.</p>
          </section>
          <section id="sessions" aria-labelledby="session-privacy-title">
            <h2 id="session-privacy-title">Sessions, audit, and rate limits</h2>
            <p>The session cookie is httpOnly and SameSite=Lax. The server stores a SHA-256 hash of the cookie value, the profile, the school, and the expiry. Signing out deletes that session. The audit log stores the action name, school id, profile id, request id, and time. It does not store passwords, PINs, activation codes, invitation tokens, or cookies. Rate limiting stores a hash of the caller address, a count, and an expiry.</p>
          </section>
          <section id="this-browser" aria-labelledby="browser-privacy-title">
            <h2 id="browser-privacy-title">This browser</h2>
            <p>After a successful sign-in, this browser keeps the school name, profile name, role, ids and the time they were saved. Read-only lists are cached separately for each school and profile. Signing out removes the session copy and cached lists. Student names, school names and internal account ids remain for the shared-device account chooser, never PINs. Choose only your own name. Clearing site data removes the chooser.</p>
          </section>
          <section id="retention" aria-labelledby="retention-privacy-title">
            <h2 id="retention-privacy-title">How long it is kept</h2>
            <p>Sessions expire after the server’s configured lifetime, seven days unless that setting is changed. Claim codes expire at the time stored with the code. Rate-limit rows expire when their window ends. School, account, and profile rows stay until a retention period is chosen in the DPDP review named above. That period is not fixed in this version.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
