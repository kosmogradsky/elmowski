import { Observable } from "rxjs";
import {
  groupBy,
  mergeMap,
  switchMap,
  takeUntil,
  filter
} from "rxjs/operators";

export const groupByTracker = <T extends { tracker?: string }, R>(
  project: (value: T, index: number) => Observable<R>,
  cancelTracker$: Observable<string>
) => {
  const defaultTracker = Symbol("defaultTracker");

  return (source$: Observable<T>): Observable<R> =>
    source$.pipe(
      groupBy(effect => effect.tracker || defaultTracker),
      mergeMap(group => {
        if (group.key === defaultTracker) {
          return group.pipe(mergeMap(project));
        }

        const until = cancelTracker$.pipe(
          filter(tracker => tracker === group.key)
        );

        return group.pipe(
          switchMap((value, index) =>
            project(value, index).pipe(takeUntil(until))
          )
        );
      })
    );
};
