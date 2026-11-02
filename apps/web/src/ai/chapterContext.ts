export function defaultSubject<T extends { id: string; name: string }>(subjects: T[], current?: string) {
  return subjects.find((row) => row.name.toLowerCase() === current?.toLowerCase())
    ?? subjects.find((row) => /physics/i.test(row.name))
    ?? subjects.find((row) => /science/i.test(row.name))
    ?? subjects[0];
}

export function defaultChapter<T extends { id: string; title: string }>(chapters: T[], current?: string) {
  return chapters.find((row) => row.title === current)
    ?? chapters.find((row) => row.title.toLowerCase() === 'motion')
    ?? chapters[0];
}
