import { map, mergeMap, take } from "rxjs/operators";
import { ofType, Effect, Epic, Action, AnyAction } from "./Loop";
import { interval } from "rxjs";

// EFFECTS

export class SetTimeout<A extends Action> implements Effect<A> {
  readonly type = "Time/SetTimeout";

  constructor(
    readonly timeout: number,
    readonly handler: (timePassed: number) => A,
    readonly tracker?: string
  ) {}

  map<B extends Action>(mapper: (from: A) => B): SetTimeout<B> {
    return new SetTimeout(
      this.timeout,
      p => mapper(this.handler(p)),
      this.tracker
    );
  }
}

// EPIC
export const epic: Epic<AnyAction> = effect$ =>
  effect$.pipe(
    ofType<SetTimeout<Action>>("Time/SetTimeout"),
    mergeMap(effect => {
      return interval(effect.timeout).pipe(
        map(timePassed => effect.handler(timePassed)),
        take(1)
      );
    })
  );
