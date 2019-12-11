import { map } from "rxjs/operators";
import { ofType, Effect, Epic, Action, SilentEff } from "./Loop";
import { groupByTracker } from "./Utils";
import { Observable } from "rxjs";

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

export class Post<A extends Action> implements Effect<A> {
  readonly type = "Http/Post";

  constructor(
    readonly url: string,
    readonly body: any,
    readonly onResponse: (payload: any) => A,
    readonly tracker?: string
  ) {}

  map<B extends Action>(mapper: (from: A) => B): Post<B> {
    return new Post(
      this.url,
      this.body,
      p => mapper(this.onResponse(p)),
      this.tracker
    );
  }
}

export class CancelRequest extends SilentEff {
  readonly type = "Http/CancelRequest";

  constructor(readonly tracker: string) {
    super();
  }
}

// EPIC
export const getEpic = <A extends Action>(
  fetch: (url: string) => Observable<any>
): Epic<A> => effect$ =>
  effect$.pipe(
    ofType<Get<A>>("Http/Get"),
    groupByTracker(
      (effect: Get<A>) =>
        fetch(effect.url).pipe(map(response => effect.onResponse(response))),
      effect$.pipe(
        ofType<CancelRequest>("Http/CancelRequest"),
        map(effect => effect.tracker)
      )
    )
  );

export const postEpic = <A extends Action>(
  fetch: (url: string, body: any) => Observable<any>
): Epic<A> => effect$ =>
  effect$.pipe(
    ofType<Post<A>>("Http/Post"),
    groupByTracker(
      (effect: Post<A>) =>
        fetch(effect.url, effect.body).pipe(
          map(response => effect.onResponse(response))
        ),
      effect$.pipe(
        ofType<CancelRequest>("Http/CancelRequest"),
        map(effect => effect.tracker)
      )
    )
  );
