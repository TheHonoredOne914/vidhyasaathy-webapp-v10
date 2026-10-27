# API contract

Import schemas and inferred types from `@vidhyasaathy/contracts`.
Roles are `admin`, `teacher`, `student`, and `parent`.

| Endpoint | Request schema | Success |
| --- | --- | --- |
| `POST /auth/register-school` | `RegisterSchoolSchema` (`schoolName`, administrator `name`, `email`, `password`) | 201, `MeSchema` |
| `POST /auth/login` | `LoginSchema` (`email`, `password`) | 200, `MeSchema` |
| `POST /auth/claim` | `ClaimSchema` (`code`, `pin`) | 200, `MeSchema` |
| `POST /auth/pin-login` | `PinLoginSchema` (`profileId`, `pin`) | 200, `MeSchema` |
| `POST /auth/logout` | No body | 204 |
| `GET /me` | No body | 200, `MeSchema` |

All successful auth requests set an httpOnly, SameSite=Lax session cookie.
Use `credentials: 'include'`. Mutating requests require the browser's `Origin`
header to match the API's configured `APP_ORIGIN`; use a same-origin web proxy.
Errors are always `ApiErrorSchema` JSON (`code`, `message`, optional `fields`).
Unauthenticated requests return 401; role/school denials return 403; invalid
inputs return 400; duplicate emails return 409; PIN lockout and rate limits
return 429. Invalid, expired, and already-used claim codes return 400.

Passwords contain 12–128 characters. PINs contain 4–6 digits. Claim codes
contain 12 uppercase letters/digits without `0`, `1`, `I`, `L`, or `O`.
Claim redemption returns the student's `profile.id`; retain that identifier
for subsequent PIN login. PINs, password hashes, and session tokens never
appear in `Me`. Timestamps in `ClaimCode` are UTC ISO-8601 strings.

## P2 school setup

All `/admin/*` endpoints require an administrator session. School IDs come from
the session, never from request bodies. Cross-school or invisible IDs return 404;
disallowed roles return 403. The Origin requirement above applies to every write,
including public invitation acceptance. Responses are `Cache-Control: no-store`.

| Resource | Write schema | Response schema |
| --- | --- | --- |
| `/admin/academic-years` | `SaveAcademicYearSchema` (`name`, `startsOn`, `endsOn`, dates `YYYY-MM-DD`) | `AcademicYearSchema` |
| `/admin/classes` | `SaveClassSchema` (`academicYearId`, `name`) | `ClassSchema` |
| `/admin/sections` | `SaveSectionSchema` (`classId`, `name`) | `SectionSchema` |
| `/admin/subjects` | `SaveSubjectSchema` (`classId`, `name`) | `SubjectSchema` |

Each resource supports GET list (200), POST (201), GET `/:id` (200), PUT `/:id`
(200, full replacement of writable fields), and DELETE `/:id` (204). Duplicate
records or deletion/moving of records still in use return 409.

Administrators and teachers may GET `/academic-years`, `/classes`, `/sections`,
and `/subjects`. GET `/classes/:id` and `/sections/:id` are also available.
Teachers see only their assigned sections, subjects, classes and academic years;
unassigned teachers receive empty lists. Students and parents cannot use these
setup read endpoints.

| Endpoint | Request | Success |
| --- | --- | --- |
| `POST /admin/invite-teacher` | `InviteTeacherSchema`: `email`, `assignments: [{sectionId, subjectId}]` | 201, `InviteTeacherResultSchema` |
| `POST /auth/accept-invite` (public) | `AcceptInviteSchema`: `token`, `name`, `password` | 201, `MeSchema`, session cookie |
| `POST /admin/teacher-assignments` | `AssignTeacherSchema`: `teacherProfileId`, `sectionId`, `subjectId` | 201, `TeacherAssignmentSchema` |
| `POST /admin/link-parent` | `LinkParentSchema`: `parentProfileId`, `studentProfileId` | 201, `ParentLinkSchema` |
| `POST /admin/import-roster` | `ImportRosterSchema`: `sectionId`, `csv` (text inside JSON) | 200, `RosterImportResultSchema` |
| `POST /admin/claim-codes` | `IssueClaimCodeSchema`: `profileId` | 201, `ClaimCodeSchema` |
| `GET /admin/claim-codes?sectionId=…` | `ClaimCodeSheetQuerySchema` | 200, `ClaimCodeSheetSchema` |

Invitation tokens are returned once to the administrator for manual delivery;
email delivery is not implemented. Only the token hash is stored. Invitations
expire after seven days and are single-use. Reinviting the same email in a school
invalidates older pending invitations. Acceptance fixes the email, school and
teacher role from the invitation, and applies its assignments atomically.
Subjects and sections in an assignment must belong to the same class.

CSV headers must contain exactly `name,rollNumber` (either column order). Quoted
commas, escaped quotes, multiline fields, UTF-8 BOM and CRLF are supported. Roll
numbers remain strings, including leading zeroes, and are unique per section.
Blank lines are ignored. Import at most 500 rows and 262144 characters per request
(the JSON body is also limited to 300000 bytes). Invalid headers/oversized batches
insert nothing. Otherwise valid rows commit, invalid rows report physical starting
line numbers (counting the header and blank lines), and rejected rows leave no users, profiles or
claim codes. `imported` pairs each accepted row with its `profileId`; `errors`
contains `row`, `message`, and optional field errors. `claimCodeSheet.entries`
contains only the new students' codes for printing.

### Printable claim codes

Set `CLAIM_CODE_ENCRYPTION_KEY` in `apps/api/.env` to a persistent, secret 64-digit
hex key. Generate it once with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Keep the key with the database backup, outside source control. Codes are hashed
for redemption and AES-256-GCM encrypted for admin-only printing. Imports,
issuance and sheets return 503 if no key is configured. A wrong key makes existing
sheets unavailable; restore it or reissue the affected unclaimed students' codes.
Codes default to a seven-day expiry (a reversible configuration decision).
Issuing a replacement invalidates older codes for that student. Claimed accounts
cannot receive new codes (409); sheets omit expired, redeemed and legacy hash-only
codes. Legacy unclaimed accounts can receive replacement codes. Redemption clears
the stored ciphertext. No invitation tokens, codes or CSV contents enter audits.
