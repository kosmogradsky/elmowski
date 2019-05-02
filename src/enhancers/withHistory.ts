import { History, Location, LocationDescriptor } from "history";
import { CreateStore, ValueConstructor, Epic, ofType, combineEpics } from "..";
import { tap, ignoreElements } from "rxjs/operators";

export class PushUrl implements ValueConstructor {
  readonly type = 'History/PushUrl';

  constructor(
    readonly location: LocationDescriptor
  ) {}
}

export class ReplaceUrl implements ValueConstructor {
  readonly type = 'History/ReplaceUrl';

  constructor(
    readonly location: LocationDescriptor
  ) {}
}

export class UrlChanged implements ValueConstructor {
  readonly type = 'History/UrlChanged'

  constructor(readonly location: Location) {}
}

const createEpic = (history: History): Epic<never> => {
  const pushEpic: Epic<never> = effect$ => effect$.pipe(
    ofType<PushUrl>('History/PushUrl'),
    tap(({ location }) => {
      history.push(location as any);
    }),
    ignoreElements()
  );

  const replaceEpic: Epic<never> = effect$ => effect$.pipe(
    ofType<ReplaceUrl>('History/ReplaceUrl'),
    tap(({ location }) => {
      history.replace(location as any);
    }),
    ignoreElements()
  );

  return combineEpics(
    pushEpic,
    replaceEpic
  )
}

export const withHistory = (
  history: History
) => <S, A>(
  createStore: CreateStore<S, A | UrlChanged>
): CreateStore<S, A | UrlChanged> => (
  initialLoop,
  reducer,
  epic
) => {
  const store = createStore(
    initialLoop,
    reducer,
    combineEpics(epic, createEpic(history))
  )

  const unregisterHistoryListener = history.listen((toLocation) => {
    store.dispatch(new UrlChanged(toLocation));
  });

  return {
    ...store,
    destroy: () => {
      unregisterHistoryListener();
      store.destroy();
    }
  }
}