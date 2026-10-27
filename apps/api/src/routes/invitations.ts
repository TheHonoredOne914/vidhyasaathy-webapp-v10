import { randomUUID } from 'node:crypto';
import {
  AcceptInviteSchema, AssignTeacherSchema, InvitationSchema, InviteTeacherSchema,
  LinkParentSchema, ParentLinkSchema, TeacherAssignmentSchema,
} from '@vidhyasaathy/contracts';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import { generateSessionToken, hashCredential, hashToken } from '../auth/security.ts';
import type { AuthService } from '../auth/service.ts';
import type { Db } from '../db/index.ts';
import { invitations, parentLinks, profiles, teacherAssignments, users } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { mutate, profileWithRole, sectionSubject } from '../school/access.ts';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function invalidInvite() {
  return new ApiException(400, 'INVALID_INVITATION', 'The invitation is invalid, expired, or already used.');
}

export function registerInvitationRoutes(app: FastifyInstance, db: Db, auth: AuthService, now: () => number): void {
  const adminOptions = { preHandler: requireRole('admin') };
  app.post('/admin/invite-teacher', adminOptions, async (request, reply) => {
    const input = parseInput(InviteTeacherSchema, request.body);
    const schoolId = requireAuth(request).school.id;
    const token = generateSessionToken();
    const invitation = mutate(() => db.transaction(() => {
      for (const assignment of input.assignments) sectionSubject(db, schoolId, assignment.sectionId, assignment.subjectId);
      if (db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).get()) {
        throw new ApiException(409, 'EMAIL_IN_USE', 'An account already uses this email.');
      }
      const createdAt = now();
      db.update(invitations).set({ expiresAt: createdAt }).where(and(
        eq(invitations.schoolId, schoolId), eq(invitations.email, input.email), isNull(invitations.acceptedAt),
      )).run();
      const result = db.insert(invitations).values({
        ...input, id: randomUUID(), schoolId, tokenHash: hashToken(token),
        createdAt, expiresAt: createdAt + INVITATION_TTL_MS,
      }).returning().get();
      auth.audit(request, 'school.invite-teacher');
      return InvitationSchema.parse({
        id: result.id, schoolId, email: result.email,
        expiresAt: new Date(result.expiresAt).toISOString(), acceptedAt: null,
      });
    }));
    return reply.code(201).send({ invitation, token });
  });

  app.post('/auth/accept-invite', { config: { public: true } }, async (request, reply) => {
    const input = parseInput(AcceptInviteSchema, request.body);
    const invitation = db.select().from(invitations).where(eq(invitations.tokenHash, hashToken(input.token))).get();
    if (!invitation || invitation.acceptedAt !== null || invitation.expiresAt <= now()) throw invalidInvite();
    const passwordHash = await hashCredential(input.password);
    const identity = mutate(() => auth.startSession(request, reply, 'auth.accept-invite', () => {
      const createdAt = now();
      const accepted = db.update(invitations).set({ acceptedAt: createdAt }).where(and(
        eq(invitations.id, invitation.id), eq(invitations.schoolId, invitation.schoolId),
        isNull(invitations.acceptedAt), gt(invitations.expiresAt, createdAt),
      )).run();
      if (accepted.changes !== 1) throw invalidInvite();
      const userId = randomUUID();
      const profileId = randomUUID();
      const user = db.insert(users).values({ id: userId, email: invitation.email, passwordHash, createdAt })
        .onConflictDoNothing({ target: users.email }).returning({ id: users.id }).get();
      if (!user) throw new ApiException(409, 'EMAIL_IN_USE', 'An account already uses this email.');
      db.insert(profiles).values({
        id: profileId, userId, schoolId: invitation.schoolId, name: input.name, role: 'teacher', createdAt,
      }).run();
      for (const assignment of invitation.assignments) {
        const target = sectionSubject(db, invitation.schoolId, assignment.sectionId, assignment.subjectId);
        db.insert(teacherAssignments).values({
          ...target, id: randomUUID(), schoolId: invitation.schoolId, teacherProfileId: profileId,
        }).run();
      }
      return auth.identityForProfile(profileId);
    }));
    return reply.code(201).send(identity);
  });

  app.post('/admin/teacher-assignments', adminOptions, async (request, reply) => {
    const input = parseInput(AssignTeacherSchema, request.body);
    const schoolId = requireAuth(request).school.id;
    const assignment = mutate(() => db.transaction(() => {
      profileWithRole(db, schoolId, input.teacherProfileId, 'teacher');
      const target = sectionSubject(db, schoolId, input.sectionId, input.subjectId);
      const id = randomUUID();
      db.insert(teacherAssignments).values({ ...input, ...target, id, schoolId }).run();
      auth.audit(request, 'school.assign-teacher');
      return TeacherAssignmentSchema.parse({ ...input, id, schoolId });
    }));
    return reply.code(201).send(assignment);
  });

  app.post('/admin/link-parent', adminOptions, async (request, reply) => {
    const input = parseInput(LinkParentSchema, request.body);
    const schoolId = requireAuth(request).school.id;
    const link = mutate(() => db.transaction(() => {
      profileWithRole(db, schoolId, input.parentProfileId, 'parent');
      profileWithRole(db, schoolId, input.studentProfileId, 'student');
      const result = db.insert(parentLinks).values({ ...input, id: randomUUID(), schoolId }).returning().get();
      auth.audit(request, 'school.link-parent');
      return ParentLinkSchema.parse(result);
    }));
    return reply.code(201).send(link);
  });
}
