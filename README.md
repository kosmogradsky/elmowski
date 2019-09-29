# Sudetenwaltz

A wrapper around Redux that adds concepts of [effects](https://package.elm-lang.org/packages/elm/core/latest/Platform-Cmd) and [subscriptions](https://package.elm-lang.org/packages/elm/core/latest/Platform-Sub), which are similar to what Elm has.

## Effects and epics

A `LoopReducer` in Sudetenwaltz is a bit more complicated than a `Reducer` in Redux itself. `LoopReducer` returns a tuple, where the first element is a next state and the second is a side effect. `someEffect` is an object of a class that extends `Effect` class.

```typescript
return [nextState, someEffect];
```

All effects are then passed to the epics which execute non-pure functions. Epic is the third argument to the `createStore` function.

# Subscriptions

Subscriptions is a function that accepts `model$` observable and returns an observable of actions. It's the fourth argument to the `createStore` function.
