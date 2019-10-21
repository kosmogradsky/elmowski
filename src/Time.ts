import { map, take } from "rxjs/operators";
import {
  ofType,
  Effect,
  Epic,
  Action,
  AnyAction,
  SilentEff,
  combineEpics
} from "./Loop";
import { interval } from "rxjs";
import { groupByTracker } from "./Utils";

// EFFECTS

export class SetTimeout<A extends Action> implements Effect<A> {
  readonly type = "Time/SetTimeout";

  constructor(
    readonly ms: number,
    readonly handler: (timePassed: number) => A,
    readonly tracker?: string
  ) {}

  map<B extends Action>(mapper: (from: A) => B): SetTimeout<B> {
    return new SetTimeout(this.ms, p => mapper(this.handler(p)), this.tracker);
  }
}

export class CancelTimeout extends SilentEff {
  readonly type = "Time/CancelTimeout";

  constructor(readonly tracker: string) {
    super();
  }
}

export class SetInterval<A extends Action> implements Effect<A> {
  readonly type = "Time/SetInterval";

  constructor(
    readonly ms: number,
    readonly handler: (timePassed: number) => A,
    readonly tracker?: string
  ) {}

  map<B extends Action>(mapper: (from: A) => B): SetInterval<B> {
    return new SetInterval(this.ms, p => mapper(this.handler(p)), this.tracker);
  }
}

export class CancelInterval extends SilentEff {
  readonly type = "Time/CancelInterval";

  constructor(readonly tracker: string) {
    super();
  }
}

// EPIC
const timeoutEpic: Epic<AnyAction> = effect$ =>
  effect$.pipe(
    ofType<SetTimeout<Action>>("Time/SetTimeout"),
    groupByTracker(
      effect => {
        return interval(effect.ms).pipe(
          map(timePassed => effect.handler(timePassed)),
          take(1)
        );
      },
      effect$.pipe(
        ofType<CancelTimeout>("Time/CancelTimeout"),
        map(effect => effect.tracker)
      )
    )
  );

const intervalEpic: Epic<AnyAction> = effect$ =>
  effect$.pipe(
    ofType<SetInterval<Action>>("Time/SetInterval"),
    groupByTracker(
      effect => {
        return interval(effect.ms).pipe(
          map(timePassed => effect.handler(timePassed))
        );
      },
      effect$.pipe(
        ofType<CancelInterval>("Time/CancelInterval"),
        map(effect => effect.tracker)
      )
    )
  );

export const epic = combineEpics(timeoutEpic, intervalEpic);
