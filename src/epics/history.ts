import { AnyEffect, Epic } from '../types'
import { LocationDescriptor, History } from 'history';
import { ofType, combineEpics } from './helpers';
import { tap, ignoreElements } from 'rxjs/operators';

export class PushUrl implements AnyEffect {
  readonly type = 'History/PushUrl';

  constructor(
    readonly location: LocationDescriptor
  ) {}
}

export class ReplaceUrl implements AnyEffect {
  readonly type = 'History/ReplaceUrl';

  constructor(
    readonly location: LocationDescriptor
  ) {}
}

export const createEpic = (history: History): Epic<never> => {
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