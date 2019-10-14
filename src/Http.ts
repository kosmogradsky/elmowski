import { ajax } from "rxjs/ajax";
import { groupBy, map, mergeMap, switchMap } from "rxjs/operators";
import { ofType, Effect, Epic, Action, AnyAction } from "./Loop";

const defaultTracker = Symbol("defaultTracker");

// EFFECTS

export class Get<A extends Action> implements Effect<A> {
  readonly type = "Http/Get";

  constructor(
    readonly url: string,
    readonly onResponse: (payload: any) => A,
    readonly tracker?: string
  ) {}

  map<B extends Action>(mapper: (from: A) => B): Get<B> {
    return new Get(this.url, p => mapper(this.onResponse(p)), this.tracker);
  }
}

// EPIC
export const epic: Epic<AnyAction> = effect$ =>
  effect$.pipe(
    ofType<Get<Action>>("Http/Get"),
    groupBy(effect => effect.tracker || defaultTracker),
    mergeMap(group => {
      const getRequest$ = (effect: Get<Action>) =>
        ajax
          .get(effect.url)
          .pipe(map(({ response }) => effect.onResponse(response)));

      if (group.key === defaultTracker) {
        return group.pipe(mergeMap(getRequest$));
      }

      return group.pipe(switchMap(getRequest$));
    })
  );
