export function chooseIdError(message: string | null, choose: string): string | null {
  if (message === 'Enter the profile ID from the student page.') return choose;
  return message;
}

export function classLabel(classes: { id: string; name: string }[], classId: string): string {
  return classes.find((item) => item.id === classId)?.name ?? 'Class';
}
