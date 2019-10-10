import * as React from "react";
import { ignoreElements, tap } from "rxjs/operators";
import {
  combineEpics,
  ofType,
  Epic,
  SilentEff,
  Action as LoopAction
} from "./Loop";
import { Location, History, createLocation } from "./History/Helpers";

// ACTIONS

interface RequestLocationChange extends LoopAction {
  type: "RequestLocationChange";
  location: Location;
}

interface LocationChanged extends LoopAction {
  type: "LocationChanged";
  location: Location;
}

export type Action = RequestLocationChange | LocationChanged;

// EFFECTS

export class Push extends SilentEff {
  readonly type = "History/Push";

  constructor(readonly location: Location) {
    super();
  }
}

export class Replace extends SilentEff {
  readonly type = "History/Replace";

  constructor(readonly location: Location) {
    super();
  }
}

// EPIC

export const createEpic = (history: History): Epic<never> => {
  const pushEpic: Epic<never> = effect$ =>
    effect$.pipe(
      ofType<Push>("History/Push"),
      tap(({ location }) => {
        history.push(location);
      }),
      ignoreElements()
    );

  const replaceEpic: Epic<never> = effect$ =>
    effect$.pipe(
      ofType<Replace>("History/Replace"),
      tap(({ location }) => {
        history.replace(location);
      }),
      ignoreElements()
    );

  return combineEpics(pushEpic, replaceEpic);
};

// LINK COMPONENT

const isModifiedEvent = (event: React.MouseEvent<HTMLAnchorElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  history: History;
  onUrlChangeRequest: (location: Location) => void;
}

export const Link: React.FunctionComponent<LinkProps> = function Link(
  props,
  ref
) {
  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    toLocation: Location
  ) => {
    if (props.onClick) {
      props.onClick(event);
    }

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore everything but left clicks
      (!props.target || props.target === "_self") && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();

      props.onUrlChangeRequest(toLocation);
    }
  };

  const { to, history, onUrlChangeRequest, ...rest } = props;
  const toLocation = createLocation(to);
  const href = history.createHref(toLocation);

  return (
    <a
      {...rest}
      onClick={event => handleClick(event, toLocation)}
      href={href}
      ref={ref}
    />
  );
};
