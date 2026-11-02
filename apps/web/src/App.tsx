import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AttemptSyncProvider } from './assessment/AttemptSync';
import { SessionProvider } from './session';
import { Landing } from './routes/Landing';
import { RoleGuard } from './routes/RoleGuard';
import { Shell } from './routes/Shell';
import { SignIn } from './routes/SignIn';
import { RouteFallback } from './ui/RouteFallback';

const AccessDenied = lazy(() => import('./routes/AccessDenied').then((module) => ({ default: module.AccessDenied })));
const AcceptInvite = lazy(() => import('./routes/AcceptInvite').then((module) => ({ default: module.AcceptInvite })));
const Claim = lazy(() => import('./routes/Claim').then((module) => ({ default: module.Claim })));
const NotFound = lazy(() => import('./routes/NotFound').then((module) => ({ default: module.NotFound })));
const Onboarding = lazy(() => import('./routes/Onboarding').then((module) => ({ default: module.Onboarding })));
const PinSignIn = lazy(() => import('./routes/PinSignIn').then((module) => ({ default: module.PinSignIn })));
const Privacy = lazy(() => import('./routes/Privacy').then((module) => ({ default: module.Privacy })));
const Recover = lazy(() => import('./routes/Recover').then((module) => ({ default: module.Recover })));
const RegisterSchool = lazy(() => import('./routes/RegisterSchool').then((module) => ({ default: module.RegisterSchool })));
const RoleHome = lazy(() => import('./routes/RoleHome').then((module) => ({ default: module.RoleHome })));
const TeacherHome = lazy(() => import('./routes/TeacherHome').then((module) => ({ default: module.TeacherHome })));
const AdminHome = lazy(() => import('./routes/admin/AdminHome').then((module) => ({ default: module.AdminHome })));
const ClaimSheet = lazy(() => import('./routes/admin/ClaimSheet').then((module) => ({ default: module.ClaimSheet })));
const ClassScreen = lazy(() => import('./routes/admin/ClassScreen').then((module) => ({ default: module.ClassScreen })));
const ClassesScreen = lazy(() => import('./routes/admin/ClassesScreen').then((module) => ({ default: module.ClassesScreen })));
const SectionScreen = lazy(() => import('./routes/admin/SectionScreen').then((module) => ({ default: module.SectionScreen })));
const SectionsScreen = lazy(() => import('./routes/admin/SectionsScreen').then((module) => ({ default: module.SectionsScreen })));
const SubjectScreen = lazy(() => import('./routes/admin/SubjectScreen').then((module) => ({ default: module.SubjectScreen })));
const SubjectsScreen = lazy(() => import('./routes/admin/SubjectsScreen').then((module) => ({ default: module.SubjectsScreen })));
const Wizard = lazy(() => import('./routes/admin/Wizard').then((module) => ({ default: module.Wizard })));
const ParentHome = lazy(() => import('./routes/ParentHome').then((module) => ({ default: module.ParentHome })));
const StudentWelcome = lazy(() => import('./routes/Welcome').then((module) => ({ default: module.StudentWelcome })));
const TeacherOnboarding = lazy(() => import('./routes/Welcome').then((module) => ({ default: module.TeacherOnboarding })));
const TeacherSubjects = lazy(() => import('./routes/content/TeacherSubjects').then((module) => ({ default: module.TeacherSubjects })));
const TeacherSubjectPage = lazy(() => import('./routes/content/SubjectLessons').then((module) => ({ default: module.TeacherSubjectPage })));
const StudentSubject = lazy(() => import('./routes/content/SubjectLessons').then((module) => ({ default: module.StudentSubject })));
const ChapterPage = lazy(() => import('./routes/content/ChapterDesk').then((module) => ({ default: module.ChapterPage })));
const LearningChapter = lazy(() => import('./proto/LearningChapter').then((module) => ({ default: module.LearningChapter })));
const LearningPlayer = lazy(() => import('./proto/LearningPlayer').then((module) => ({ default: module.LearningPlayer })));
const ConceptPage = lazy(() => import('./routes/content/ConceptPage').then((module) => ({ default: module.ConceptPage })));
const NotePage = lazy(() => import('./routes/content/NotePage').then((module) => ({ default: module.NotePage })));
const SessionFormPage = lazy(() => import('./routes/content/SessionForm').then((module) => ({ default: module.SessionFormPage })));
const SessionPlayer = lazy(() => import('./routes/content/SessionPlayer').then((module) => ({ default: module.SessionPlayer })));
const QuestionBankPage = lazy(() => import('./assessment/QuestionBank').then((module) => ({ default: module.QuestionBankPage })));
const AssignmentFormPage = lazy(() => import('./assessment/AssignmentForm').then((module) => ({ default: module.AssignmentFormPage })));
const AssignmentAnswerPage = lazy(() => import('./assessment/AssignmentAnswer').then((module) => ({ default: module.AssignmentAnswerPage })));
const HomeworkPage = lazy(() => import('./assessment/HomeworkPage').then((module) => ({ default: module.HomeworkPage })));
const ReviewQueuePage = lazy(() => import('./assessment/ReviewQueue').then((module) => ({ default: module.ReviewQueuePage })));
const ExaminerHome = lazy(() => import('./examiner/ExaminerHome').then((module) => ({ default: module.ExaminerHome })));
const PaperReview = lazy(() => import('./examiner/PaperReview').then((module) => ({ default: module.PaperReview })));
const ModerationSummary = lazy(() => import('./examiner/ModerationSummary').then((module) => ({ default: module.ModerationSummary })));
const RemediationPage = lazy(() => import('./ai/RemediationPage').then((module) => ({ default: module.RemediationPage })));
const AskPanel = lazy(() => import('./ai/AskPanel').then((module) => ({ default: module.AskPanel })));
const DraftReviewPage = lazy(() => import('./ai/DraftReview').then((module) => ({ default: module.DraftReviewPage })));
const AnnouncementsPage = lazy(() => import('./dashboard/AnnouncementsPage').then((module) => ({ default: module.AnnouncementsPage })));
const AuditPage = lazy(() => import('./dashboard/AuditPage').then((module) => ({ default: module.AuditPage })));
const InsightsPage = lazy(() => import('./dashboard/InsightsPage').then((module) => ({ default: module.InsightsPage })));
const NotificationsPage = lazy(() => import('./dashboard/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const ParentChild = lazy(() => import('./dashboard/ParentChild').then((module) => ({ default: module.ParentChild })));
const ProgressPage = lazy(() => import('./dashboard/ProgressPage').then((module) => ({ default: module.ProgressPage })));
const SettingsPage = lazy(() => import('./dashboard/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const DiagnosticPage = lazy(() => import('./student/notebook/screens/DiagnosticPage').then((module) => ({ default: module.DiagnosticPage })));
const PracticeList = lazy(() => import('./practice/PracticeList').then((module) => ({ default: module.PracticeList })));
const PracticePlay = lazy(() => import('./practice/PracticePlay').then((module) => ({ default: module.PracticePlay })));
const CatchupDesk = lazy(() => import('./student/CatchupDesk').then((module) => ({ default: module.CatchupDesk })));
const WarmupDesk = lazy(() => import('./student/WarmupDesk').then((module) => ({ default: module.WarmupDesk })));
const ChallengeDesk = lazy(() => import('./student/ChallengeDesk').then((module) => ({ default: module.ChallengeDesk })));
const DushmanDesk = lazy(() => import('./student/DushmanDesk').then((module) => ({ default: module.DushmanDesk })));
const EngineGamePage = lazy(() => import('./games/EngineGamePage').then((module) => ({ default: module.EngineGamePage })));
const ChapterEntryGate = lazy(() => import('./games/ChapterEntryGate').then((module) => ({ default: module.ChapterEntryGate })));
const AtomForgeVideo = lazy(() => import('./games/atom/AtomForgeVideo').then((module) => ({ default: module.AtomForgeVideo })));

export function prefetchSignIn() {
  return import('./routes/SignIn');
}

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AttemptSyncProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/student/games/atom" element={<RoleGuard role="student"><AtomForgeVideo /></RoleGuard>} />
            <Route path="/student/chapters/:chapterId/practice/engine/:gameId" element={<RoleGuard role="student"><ChapterEntryGate><EngineGamePage /></ChapterEntryGate></RoleGuard>} />
            <Route element={<Shell />}>
              <Route path="/" element={<Landing />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signin/student" element={<PinSignIn />} />
              <Route path="/claim" element={<Claim />} />
              <Route path="/register-school" element={<RegisterSchool />} />
              <Route path="/register" element={<Navigate to="/register-school" replace />} />
              <Route path="/setup" element={<Navigate to="/admin/setup" replace />} />
              <Route path="/recover" element={<Recover />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route element={<RoleGuard role="admin"><Outlet /></RoleGuard>}>
                <Route path="/admin" element={<AdminHome />} />
                <Route path="/admin/setup" element={<Wizard />} />
                <Route path="/admin/classes" element={<ClassesScreen />} />
                <Route path="/admin/classes/:classId" element={<ClassScreen audience="admin" />} />
                <Route path="/admin/sections" element={<SectionsScreen />} />
                <Route path="/admin/sections/:sectionId" element={<SectionScreen />} />
                <Route path="/admin/subjects" element={<SubjectsScreen />} />
                <Route path="/admin/subjects/:subjectId" element={<SubjectScreen />} />
                <Route path="/admin/chapters/:chapterId/concepts/:conceptId" element={<ConceptPage />} />
                <Route path="/admin/chapters/:chapterId/sessions/new" element={<SessionFormPage />} />
                <Route path="/admin/chapters/:chapterId" element={<ChapterPage />} />
                <Route path="/admin/sessions/:sessionId" element={<SessionFormPage />} />
                <Route path="/admin/notes/:noteId" element={<NotePage />} />
                <Route path="/admin/homework" element={<HomeworkPage />} />
                <Route path="/admin/review" element={<ReviewQueuePage />} />
                <Route path="/admin/chapters/:chapterId/questions" element={<QuestionBankPage />} />
                <Route path="/admin/chapters/:chapterId/assignments/new" element={<AssignmentFormPage />} />
                <Route path="/admin/assignments/:assignmentId" element={<AssignmentFormPage />} />
                <Route path="/admin/claim-codes" element={<ClaimSheet />} />
                <Route path="/admin/activity" element={<AuditPage />} />
                <Route path="/admin/announcements" element={<AnnouncementsPage />} />
                <Route path="/admin/notifications" element={<NotificationsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/sections/:sectionId/insights" element={<InsightsPage />} />
                <Route path="/admin/ai/drafts/:jobId" element={<DraftReviewPage />} />
                <Route path="/admin/*" element={<AccessDenied />} />
              </Route>
              <Route element={<RoleGuard role="teacher"><Outlet /></RoleGuard>}>
                <Route path="/teacher" element={<TeacherHome />} />
                <Route path="/teacher/onboarding" element={<TeacherOnboarding />} />
                <Route path="/teacher/subjects" element={<TeacherSubjects />} />
                <Route path="/teacher/subjects/:subjectId" element={<TeacherSubjectPage />} />
                <Route path="/teacher/chapters/:chapterId/concepts/:conceptId" element={<ConceptPage />} />
                <Route path="/teacher/chapters/:chapterId/sessions/new" element={<SessionFormPage />} />
                <Route path="/teacher/chapters/:chapterId" element={<ChapterPage />} />
                <Route path="/teacher/sessions/:sessionId" element={<SessionFormPage />} />
                <Route path="/teacher/notes/:noteId" element={<NotePage />} />
                <Route path="/teacher/homework" element={<HomeworkPage />} />
                <Route path="/teacher/review" element={<ReviewQueuePage />} />
                <Route path="/teacher/chapters/:chapterId/questions" element={<QuestionBankPage />} />
                <Route path="/teacher/chapters/:chapterId/assignments/new" element={<AssignmentFormPage />} />
                <Route path="/teacher/assignments/:assignmentId" element={<AssignmentFormPage />} />
                <Route path="/teacher/ai/drafts/:jobId" element={<DraftReviewPage />} />
                <Route path="/teacher/announcements" element={<AnnouncementsPage />} />
                <Route path="/teacher/notifications" element={<NotificationsPage />} />
                <Route path="/teacher/settings" element={<SettingsPage />} />
                <Route path="/teacher/sections/:sectionId/insights" element={<InsightsPage />} />
                <Route path="/teacher/classes/:classId" element={<ClassScreen audience="teacher" />} />
                <Route path="/teacher/sections/:sectionId" element={<SectionScreen audience="teacher" />} />
                <Route path="/teacher/*" element={<AccessDenied />} />
              </Route>
              <Route path="/student" element={<RoleGuard role="student"><RoleHome role="student" /></RoleGuard>} />
              <Route path="/student/saathy" element={<RoleGuard role="student"><AskPanel /></RoleGuard>} />
              <Route path="/student/welcome" element={<RoleGuard role="student"><StudentWelcome /></RoleGuard>} />
              <Route path="/student/subjects/:subjectId" element={<RoleGuard role="student"><StudentSubject /></RoleGuard>} />
              <Route path="/student/chapters/:chapterId/learn" element={<RoleGuard role="student"><LearningChapter /></RoleGuard>} />
              <Route path="/student/learning/sessions/:sessionId" element={<RoleGuard role="student"><LearningPlayer /></RoleGuard>} />
              <Route path="/student/chapters/:chapterId/concepts/:conceptId" element={<RoleGuard role="student"><ChapterEntryGate><ConceptPage /></ChapterEntryGate></RoleGuard>} />
              <Route path="/student/chapters/:chapterId" element={<RoleGuard role="student"><ChapterEntryGate><ChapterPage /></ChapterEntryGate></RoleGuard>} />
              <Route path="/student/chapters/:chapterId/diagnostic" element={<RoleGuard role="student"><DiagnosticPage /></RoleGuard>} />
            <Route path="/student/chapters/:chapterId/practice" element={<RoleGuard role="student"><ChapterEntryGate><PracticeList /></ChapterEntryGate></RoleGuard>} />
              <Route path="/student/chapters/:chapterId/practice/:gameId" element={<RoleGuard role="student"><ChapterEntryGate><PracticePlay /></ChapterEntryGate></RoleGuard>} />
              <Route path="/student/notes/:noteId" element={<RoleGuard role="student"><NotePage /></RoleGuard>} />
              <Route path="/student/sessions/:sessionId" element={<RoleGuard role="student"><SessionPlayer /></RoleGuard>} />
              <Route path="/student/assignments/:assignmentId" element={<RoleGuard role="student"><AssignmentAnswerPage /></RoleGuard>} />
              <Route path="/student/catchup" element={<RoleGuard role="student"><CatchupDesk /></RoleGuard>} />
              <Route path="/student/warmup" element={<RoleGuard role="student"><WarmupDesk /></RoleGuard>} />
              <Route path="/student/challenge" element={<RoleGuard role="student"><ChallengeDesk /></RoleGuard>} />
              <Route path="/student/dushman" element={<RoleGuard role="student"><DushmanDesk /></RoleGuard>} />
              <Route path="/student/concepts/:conceptId/remediation" element={<RoleGuard role="student"><RemediationPage /></RoleGuard>} />
              <Route path="/student/progress" element={<RoleGuard role="student"><ProgressPage /></RoleGuard>} />
              <Route path="/student/notifications" element={<RoleGuard role="student"><NotificationsPage /></RoleGuard>} />
              <Route path="/student/settings" element={<RoleGuard role="student"><SettingsPage /></RoleGuard>} />
              <Route path="/student/*" element={<RoleGuard role="student"><AccessDenied /></RoleGuard>} />
              <Route path="/parent" element={<RoleGuard role="parent"><ParentHome /></RoleGuard>} />
              <Route path="/parent/children/:childId" element={<RoleGuard role="parent"><ParentChild /></RoleGuard>} />
              <Route path="/parent/children/:childId/progress" element={<RoleGuard role="parent"><ParentChild view="progress" /></RoleGuard>} />
              <Route path="/parent/children/:childId/assignments" element={<RoleGuard role="parent"><ParentChild view="assignments" /></RoleGuard>} />
              <Route path="/parent/announcements" element={<RoleGuard role="parent"><AnnouncementsPage /></RoleGuard>} />
              <Route path="/parent/notifications" element={<RoleGuard role="parent"><NotificationsPage /></RoleGuard>} />
              <Route path="/parent/settings" element={<RoleGuard role="parent"><SettingsPage /></RoleGuard>} />
              <Route path="/parent/*" element={<RoleGuard role="parent"><AccessDenied /></RoleGuard>} />
              <Route path="/examiner" element={<ExaminerHome />} />
              <Route path="/examiner/papers/:assignmentId" element={<PaperReview />} />
              <Route path="/examiner/moderation" element={<ModerationSummary />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
        </AttemptSyncProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}
