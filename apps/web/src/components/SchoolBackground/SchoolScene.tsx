import { sceneMarkup, type SceneName } from './scenes';

export function SchoolScene({ name }: { name: SceneName }) {
  return <div className={`school-section-scene school-section-scene--${name}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: sceneMarkup(name) }} />;
}
