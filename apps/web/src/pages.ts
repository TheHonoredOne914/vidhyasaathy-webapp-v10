export const PAGE = {
  landing: {
    path: '/',
    title: 'VidhyaSaathy',
    description: 'VidhyaSaathy gives a school an administrator account and a separate signed-in page for each role.',
  },
  signIn: {
    path: '/signin',
    title: 'Sign in — VidhyaSaathy',
    description: 'Sign in to VidhyaSaathy with the email and password used to register the school.',
  },
  pin: {
    path: '/signin/student',
    title: 'Student PIN sign in — VidhyaSaathy',
    description: 'Choose your account on this device and sign in with your four-digit PIN.',
  },
  claim: {
    path: '/claim',
    title: 'Claim a code — VidhyaSaathy',
    description: 'Claim a one-time school code and choose the PIN you will use next time.',
  },
  register: {
    path: '/register-school',
    title: 'Register a school — VidhyaSaathy',
    description: 'Register a school and become its administrator.',
  },
  recover: {
    path: '/recover',
    title: 'Password and PIN help — VidhyaSaathy',
    description: 'This version cannot reset a password or a PIN.',
  },
  admin: {
    path: '/admin',
    title: 'Administrator — VidhyaSaathy',
    description: 'Signed-in home for the school administrator.',
  },
  teacher: {
    path: '/teacher',
    title: 'Teacher — VidhyaSaathy',
    description: 'Signed-in home for a teacher.',
  },
  student: {
    path: '/student',
    title: 'Student — VidhyaSaathy',
    description: 'Your school subjects and today’s learning.',
  },
  parent: {
    path: '/parent',
    title: 'Parent — VidhyaSaathy',
    description: 'Signed-in home for a parent.',
  },
  onboarding: {
    path: '/onboarding',
    title: 'How people join — VidhyaSaathy',
    description: 'How an administrator, a teacher, and a student each join a school on VidhyaSaathy.',
  },
  acceptInvite: {
    path: '/accept-invite',
    title: 'Accept invitation — VidhyaSaathy',
    description: 'Accept a teacher invitation from your school and choose a password.',
  },
  setup: {
    path: '/admin/setup',
    title: 'School setup — VidhyaSaathy',
    description: 'Add an academic year, classes, sections, subjects, teacher invitations, and a student roster.',
  },
  classes: {
    path: '/admin/classes',
    title: 'Classes — VidhyaSaathy',
    description: 'Classes for the signed-in school, grouped under an academic year.',
  },
  classDetail: {
    path: '/admin/classes/:classId',
    title: 'Class — VidhyaSaathy',
    description: 'Sections and subjects that belong to one class.',
  },
  sections: {
    path: '/admin/sections',
    title: 'Sections — VidhyaSaathy',
    description: 'Sections for the signed-in school and the class each one belongs to.',
  },
  sectionDetail: {
    path: '/admin/sections/:sectionId',
    title: 'Section — VidhyaSaathy',
    description: 'One section, its class, the student roster import, and activation codes.',
  },
  subjects: {
    path: '/admin/subjects',
    title: 'Subjects — VidhyaSaathy',
    description: 'Subjects for the signed-in school and the class each one belongs to.',
  },
  subjectDetail: {
    path: '/admin/subjects/:subjectId',
    title: 'Subject — VidhyaSaathy',
    description: 'One subject and the class it belongs to.',
  },
  claimSheet: {
    path: '/admin/claim-codes',
    title: 'Activation codes — VidhyaSaathy',
    description: 'Printable one-time activation codes for students in a section.',
  },
  teacherClass: {
    path: '/teacher/classes/:classId',
    title: 'Teacher class — VidhyaSaathy',
    description: 'The class, sections, and subjects assigned to the signed-in teacher.',
  },
  teacherInsights: {
    path: '/teacher/sections/:sectionId/insights',
    title: 'Concept checks — VidhyaSaathy',
    description: 'Counts of marked checks, wrong options, and reteach decisions for one section.',
  },
  adminInsights: {
    path: '/admin/sections/:sectionId/insights',
    title: 'Section concept checks — VidhyaSaathy',
    description: 'Counts of marked checks and wrong options for one section, without student names.',
  },
  announcements: {
    path: '/teacher/announcements',
    title: 'Announcements — VidhyaSaathy',
    description: 'Write a class announcement for students, parents, or both.',
  },
  notifications: {
    path: '/teacher/notifications',
    title: 'Notifications — VidhyaSaathy',
    description: 'In-app alerts for this account, including delivery that failed because a channel is not configured.',
  },
  alertSettings: {
    path: '/teacher/settings',
    title: 'Alert settings — VidhyaSaathy',
    description: 'Quiet hours, alert delivery, and reduced motion for this account.',
  },
  studentProgress: {
    path: '/student/progress',
    title: 'Progress — VidhyaSaathy',
    description: 'Marked checks and assignments for the signed-in student, without a ranking.',
  },
  parentChild: {
    path: '/parent/children/:childId',
    title: 'Child summary — VidhyaSaathy',
    description: 'Observed progress, teacher updates, and a suggested next step for one linked child.',
  },
  audit: {
    path: '/admin/activity',
    title: 'Activity log — VidhyaSaathy',
    description: 'Enrolment, link, and permission changes recorded for this school.',
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy — VidhyaSaathy',
    description: 'What VidhyaSaathy stores, how the session cookie works, and the review still needed under India\'s Digital Personal Data Protection Act.',
  },
  accessDenied: {
    path: '/access-denied',
    title: 'Access denied — VidhyaSaathy',
    description: 'This page is limited to a different role.',
  },
  practice: {
    path: '/student/chapters/:chapterId/practice',
    title: 'Practice — VidhyaSaathy',
    description: 'Optional games on released questions. They do not change a deadline.',
  },
  notFound: {
    path: '/this-page-does-not-exist',
    title: 'Page not found — VidhyaSaathy',
    description: 'That address does not match a VidhyaSaathy page.',
  },
} as const;

export type PageKey = keyof typeof PAGE;
