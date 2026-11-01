# Backend-only surfaces awaiting mockups

- Teacher escalation inbox/reply: `GET /teacher/escalations`, `POST /teacher/escalations/:id/reply`. No invented teacher UI.
- Complete saved-explanation/thread browser and save/escalation confirmation: `/ask/saved`, `/ask/threads`, `/ask/escalate`. Use only the approved Ask rail/actions until these surfaces are approved.
- Game completion summary: finish API returns real answered/correct, personal best and XP; retain the existing finish surface rather than designing a new results card.

No fake doubt clusters are seeded. Analytics are derived from actual Ask activity only. Text/photo provider credentials remain optional; missing providers are reported honestly through `/ask/status`.
