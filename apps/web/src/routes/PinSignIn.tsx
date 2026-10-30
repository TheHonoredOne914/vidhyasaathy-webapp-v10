import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { NotebookSignIn } from '../student/notebook/screens/NotebookSignIn';

export function PinSignIn() {
  usePageMeta(PAGE.pin.title, PAGE.pin.description);
  return <NotebookSignIn />;
}
