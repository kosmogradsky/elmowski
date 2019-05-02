import { Subject, Observable, merge } from 'rxjs';
import { scan, startWith, map, filter, mergeMap } from 'rxjs/operators';

export interface ValueConstructor {
  readonly type: string;
}

export type Loop<S> = [S, ValueConstructor];
export type Reducer<S, A> = (prevState: S, action: A) => S;
export type LoopReducer<S, A> = (prevState: S, action: A) => Loop<S>;
export type Epic<A> = (effect$: Observable<ValueConstructor>) => Observable<A>;

const batchType = 'Core/Batch'
const noneType = 'Core/None'

export class Batch implements ValueConstructor {
  readonly type = batchType

  constructor(
    readonly effects: ValueConstructor[]
  ) {}
}

class None implements ValueConstructor {
  readonly type = noneType
}

export const NONE = new None();

const isBatch = (effect: ValueConstructor): effect is Batch => effect.type === batchType
const isNone = (effect: ValueConstructor): effect is None => effect.type === noneType

export const combineEpics = <A>(...epics: Epic<A>[]): Epic<A> => effect$ => merge(
  ...epics.map(epic => epic(effect$))
)

export const ofType = <R extends ValueConstructor>(...keys: R['type'][]) =>
  (source: Observable<ValueConstructor>): Observable<R> =>
    source.pipe(filter((value): value is R => keys.includes(value.type)));

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
    mergeMap(effect => isBatch(effect) ? effect.effects : [effect]),
    filter(effect => !isNone(effect))
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

export interface CreateStore<S, A> {
  (
    initialLoop: Loop<S>,
    reducer: LoopReducer<S, A>,
    epic: Epic<A>
  ): Store<S, A>
}

export const createEnhancedStore = <S, A>(...enhancers: ((param: CreateStore<S, A>) => CreateStore<S, A>)[]) =>
  enhancers.reduce((nextCreateStore, enhancer) => enhancer(nextCreateStore), createStore as CreateStore<S, A>)