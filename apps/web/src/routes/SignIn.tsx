import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { NotebookSignIn } from '../student/notebook/screens/NotebookSignIn';

export function SignIn() {
  usePageMeta(PAGE.signIn.title, PAGE.signIn.description);
  return <NotebookSignIn />;
}
