import * as React from "react";
import { Action as ReduxAction } from "redux";
import { ignoreElements, tap } from "rxjs/operators";
import { combineEpics, ofType, Epic, SilentEff } from "./Loop";
import { HistoryLocation } from "./History/Helpers";

// ACTIONS

interface RequestLocationChange extends ReduxAction {
  type: "RequestLocationChange";
  location: HistoryLocation;
}

interface LocationChanged extends ReduxAction {
  type: "LocationChanged";
  location: Location;
}

export type Action = RequestLocationChange | LocationChanged;

// EFFECTS

export class Push extends SilentEff {
  readonly type = "History/Push";

  constructor(readonly location: HistoryLocation) {
    super();
  }
}

export class Replace extends SilentEff {
  readonly type = "History/Replace";

  constructor(readonly location: HistoryLocation) {
    super();
  }
}

// EPIC

const pushEpic: Epic<ReduxAction, never> = effect$ =>
  effect$.pipe(
    ofType<Push>("History/Push"),
    tap(({ location }) => {
      history.push(location);
    }),
    ignoreElements()
  );

const replaceEpic: Epic<ReduxAction, never> = effect$ =>
  effect$.pipe(
    ofType<Replace>("History/Replace"),
    tap(({ location }) => {
      history.replace(location);
    }),
    ignoreElements()
  );

export const epic = combineEpics(pushEpic, replaceEpic);

// LINK COMPONENT

export class RequestUrlChange {
  readonly type = "RequestUrlChange";

  constructor(readonly location: HistoryLocation) {}
}

const isModifiedEvent = (event: React.MouseEvent<HTMLAnchorElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  history: History;
  onUrlChangeRequest: (location: HistoryLocation) => void;
}

export const Link: React.FunctionComponent<LinkProps> = function Link(
  props,
  ref
) {
  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    toLocation: HistoryLocation
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
