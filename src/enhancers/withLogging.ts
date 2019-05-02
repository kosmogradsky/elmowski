import { CreateStore, ValueConstructor, Epic, ofType, combineEpics, LoopReducer, Batch } from "..";
import { ignoreElements, tap } from "rxjs/operators";

export class Log implements ValueConstructor {
  readonly type = 'Logging/Log'

  constructor(
    readonly prevState: unknown,
    readonly action: unknown,
    readonly nextState: unknown
  ) {}
}

const logEpic: Epic<never> = effect$ => effect$.pipe(
  ofType<Log>('Logging/Log'),
  tap(({ prevState, action, nextState }) => {
    console.log('Previous state:')
    console.log(prevState)
    console.log('Action:')
    console.log(action)
    console.log('Next state:')
    console.log(nextState)
  }),
  ignoreElements()
) 

export const withLogging = <S, A>(
  createStore: CreateStore<S, A>
): CreateStore<S, A> => (
  initialState,
  reducer,
  epic
) => {
  const loggingReducer: LoopReducer<S, A> = (prevState, action) => {
    const [nextState, effect] = reducer(prevState, action);

    const effects = new Batch([effect, new Log(prevState, action, nextState)])

    return [nextState, effects]
  }

  const store = createStore(
    initialState,
    loggingReducer,
    combineEpics(epic, logEpic)
  )

  return store;
}