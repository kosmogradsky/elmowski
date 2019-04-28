import { Subject, Observable, NEVER } from 'rxjs';
import { scan, startWith, map, filter } from 'rxjs/operators';
import * as H from 'history';
import { Loop, LoopReducer, Epic, Reducer } from './types';
import { combineEpics } from './epics/helpers';
import { createEpic as createHistoryEpic, Effect as HistoryEffect } from './epics/history'

interface Program<S, A> {
  state$: Observable<S>;
  dispatch: (action: A) => void;
  destroy: () => void;
}

interface CreateElementConfig<S, A, E> {
  initialLoop: Loop<S, E>,
  reducer: LoopReducer<S, A, E>,
  epic: Epic<E, A>
}

export const createElement = <S, A, E>({ initialLoop, reducer, epic }: CreateElementConfig<S, A, E>): Program<S, A> => {
  const actionSubject = new Subject<A>();

  const loop$ = actionSubject.pipe(
    scan<A, Loop<S, E>>(
      ([prevState], action) => reducer(prevState, action),
      initialLoop,
    ),
    startWith(initialLoop),
  );

  const state$ = loop$.pipe(map(([state]) => state));

  const effect$ = loop$.pipe(
    map(([_, effect]) => effect),
    filter((effect): effect is E => effect !== undefined),
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

interface CreateSandboxConfig<S, A> {
  initialState: S,
  reducer: Reducer<S, A>
}

export const createSandbox = <S, A>({ initialState, reducer }: CreateSandboxConfig<S, A>): Program<S, A> =>
  createElement<S, A, never>({
    initialLoop: [initialState],
    reducer: (prevState, action) => [reducer(prevState, action)],
    epic: () => NEVER
  });

interface CreateApplicationConfig<S, A, E> {
  initialLoop: Loop<S, E>,
  reducer: LoopReducer<S, A, E>,
  epic: Epic<E, A>,
  history: H.History,
  onUrlRequest: (location: H.Location) => A,
  onUrlChange: (location: H.Location) => A,
}

export function createApplication<S, A, E>({
  initialLoop,
  reducer,
  epic,
  history,
  onUrlRequest,
  onUrlChange
}: CreateApplicationConfig<S, A, E>): Program<S, A> {
  const app = createElement({
    initialLoop,
    reducer,
    epic: combineEpics<E | HistoryEffect, A>(epic, createHistoryEpic(history))
  })

  const unregisterHistoryListener = history.listen((toLocation) => {
    app.dispatch(onUrlChange(toLocation));
  });

  return {
    ...app,
    destroy: () => {
      unregisterHistoryListener();
      app.destroy();
    }
  }
}

