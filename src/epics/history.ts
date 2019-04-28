import { ValueConstructor, Epic } from '../types'
import { LocationDescriptor, History } from 'history';
import { ofType, combineEpics } from './helpers';
import { tap, ignoreElements } from 'rxjs/operators';

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

export type Effect = PushUrl | ReplaceUrl;

export const createEpic = (history: History): Epic<Effect, never> => {
  const pushEpic: Epic<Effect, never> = effect$ => effect$.pipe(
    ofType<Effect, PushUrl>('History/PushUrl'),
    tap(({ location }) => {
      history.push(location as any);
    }),
    ignoreElements()
  );

  const replaceEpic: Epic<Effect, never> = effect$ => effect$.pipe(
    ofType<Effect, ReplaceUrl>('History/ReplaceUrl'),
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