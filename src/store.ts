import { Subject, Observable, NEVER } from 'rxjs';
import { scan, startWith, map, filter } from 'rxjs/operators';
import { Loop, LoopReducer, Epic, Reducer, AnyEffect } from './types';

export interface Store<S, A> {
  state$: Observable<S>;
  dispatch: (action: A) => void;
  destroy: () => void;
}

export const createStore = <S, A>(
  initialLoop: Loop<S>,
  reducer: LoopReducer<S, A>,
  epic: Epic<A>
): Store<S, A> => {
  const actionSubject = new Subject<A>();

  const loop$ = actionSubject.pipe(
    scan<A, Loop<S>>(
      ([prevState], action) => reducer(prevState, action),
      initialLoop,
    ),
    startWith(initialLoop),
  );

  const state$ = loop$.pipe(map(([state]) => state));

  const effect$ = loop$.pipe(
    map(([_, effect]) => effect),
    filter((effect): effect is AnyEffect => effect !== undefined),
  );
  const epicSubscription = epic(effect$).subscribe();

  return {
    state$,
    dispatch: (action: A) => actionSubject.next(action),
    destroy: () => {
      actionSubject.complete();

      // observables from epic() may derive not only from effect$
      epicSubscription.unsubscribe();
    }
  }
}

export const createStoreWithoutEffects = <S, A>(
  initialState: S,
  reducer: Reducer<S, A>
): Store<S, A> =>
  createStore<S, A>(
    [initialState],
    (prevState, action) => [reducer(prevState, action)],
    () => NEVER
  );