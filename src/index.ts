import { applyMiddleware, compose, createStore, combineReducers } from 'redux';

var _window: any = typeof window === 'undefined' ? {} : window;

type ValueOf<T> = T[keyof T];

interface ActionGroup<
  ActionType extends string | number | symbol,
  ActionCreator extends (...args: any[]) => { type: ActionType },
  State,
  SubReducer extends (state: State, action: ReturnType<ActionCreator>) => State
> {
  actionCreator: ActionCreator;
  subReducer: SubReducer;
}

export const buildActionGroup = <
  ActionType extends string,
  ActionCreator extends (...args: any[]) => { type: ActionType },
  State,
  SubReducer extends (state: State, action: ReturnType<ActionCreator>) => State
>({
  actionCreator,
  subReducer,
}: {
  actionCreator: ActionCreator;
  subReducer: SubReducer;
}): ActionGroup<ActionType, ActionCreator, State, SubReducer> => ({
  actionCreator,
  subReducer,
});

/**
 * An internal helper type that narrows the type of `actions` to an object of `ActionGroup`s.
 */
const buildReduxModule = <
  State,
  AllActionTypes extends string,
  AllActionCreators extends (...args: any[]) => { type: string },
  AllSubReducers extends (state: State, action: ReturnType<AllActionCreators>) => State
>(
  initialState: State,
  actions: {
    [ActionType in AllActionTypes]: ActionGroup<
      ActionType,
      // Finds the single action creator from all of the action creators that has a return type whose `type` key
      // matches this action's `type`.
      Extract<AllActionCreators, (...args: any[]) => Extract<ReturnType<AllActionCreators>, { type: ActionType }>>,
      State,
      Extract<
        AllSubReducers,
        (state: State, action: Extract<ReturnType<AllActionCreators>, { type: ActionType }>) => State
      >
    >
  }
) => ({
  initialState,
  actions,
});

type AllActionsOf<
  T extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string };
    };
  }
> = { [K in keyof T]: ReturnType<T[K]['actionCreator']> };

type AllActionCreatorsOf<
  T extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string };
    };
  }
> = { [K in keyof T]: T[K]['actionCreator'] };

type AllSubReducersOf<
  T extends {
    [type: string]: {
      subReducer: (state: any, action: { type: string }) => any;
    };
  }
> = { [K in keyof T]: T[K]['subReducer'] };

export const buildModule = <
  State,
  Actions extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string };
      subReducer: (state: State, action: { type: string }) => State;
    };
  }
>(
  initialState: State,
  actions: {
    [ActionType in keyof Actions]: ActionGroup<
      ActionType,
      Extract<
        ValueOf<AllActionCreatorsOf<Actions>>,
        (...args: any[]) => Extract<ValueOf<AllActionsOf<Actions>>, { type: ActionType }>
      >,
      State,
      Extract<
        ValueOf<AllSubReducersOf<Actions>>,
        (state: State, action: Extract<ValueOf<AllActionsOf<Actions>>, { type: ActionType }>) => State
      >
    >
  }
) => {
  type OurAllActionCreators = ValueOf<AllActionCreatorsOf<Actions>>;
  type OurAllSubReducers = ValueOf<AllSubReducersOf<Actions>>;

  return buildReduxModule<State, string, OurAllActionCreators, OurAllSubReducers>(initialState, actions);
};

type SecondArgumentOf<T> = T extends (arg1: any, arg2: infer A, ...args: any[]) => any ? A : undefined;

type Id<T> = { [K in keyof T]: T[K] };

/**
 * Given an object defining the reducers and their internal action creators and sub-reducers, builds a Redux store and
 * typed functions for interacting with it.
 *
 * This function MUST be called with an explicit type parameter of `typeof modules` provided in order to gain fully-
 * typed results.  The syntax for that looks like this:
 *
 * ```ts
 * const yourModules = { ... };
 * const { dispatch, getState } = buildStore<typeof yourModules>(yourModules);
 * ```
 *
 * @param modules The object defining the reducers to construct
 * @param middleware An optional middleware object to add to the created store
 */
export const buildStore = <
  Modules extends {
    [stateKey: string]: {
      initialState: any;
      actions: {
        [type: string]: {
          actionCreator: (...args: any[]) => { type: string };
          subReducer: (
            state: ValueOf<{ [StateKey in keyof Modules]: Modules[StateKey]['initialState'] }>,
            action: { type: string }
          ) => ValueOf<{ [StateKey in keyof Modules]: Modules[StateKey]['initialState'] }>;
        };
      };
    };
  },
  CustomReducers extends { [key: string]: (state: any, action: { type: string }) => any } = {},
  CustomState extends { [K in keyof CustomReducers]: ReturnType<CustomReducers[K]> } = {
    [K in keyof CustomReducers]: ReturnType<CustomReducers[K]>
  }
>(
  modules: {
    [StateKey in keyof Modules]: {
      initialState: { [StateKey in keyof Modules]: Modules[StateKey]['initialState'] }[StateKey];
      actions: {
        [ActionType in keyof Modules[StateKey]['actions']]: ActionGroup<
          ActionType,
          Extract<
            ValueOf<AllActionCreatorsOf<Modules[StateKey]['actions']>>,
            (...args: any[]) => Extract<ValueOf<AllActionsOf<Modules[StateKey]['actions']>>, { type: ActionType }>
          >,
          { [K in keyof Modules]: Modules[K]['initialState'] }[StateKey],
          Extract<
            ValueOf<AllSubReducersOf<Modules[StateKey]['actions']>>,
            (
              state: { [K in keyof Modules]: Modules[K]['initialState'] }[StateKey],
              action: Extract<ValueOf<AllActionsOf<Modules[StateKey]['actions']>>, { type: ActionType }>
            ) => { [K in keyof Modules]: Modules[K]['initialState'] }[StateKey]
          >
        >
      };
    }
  },
  middleware?: any,
  customReducers: CustomReducers = {} as CustomReducers
) => {
  type CustomActions = ValueOf<{ [StateKey in keyof CustomReducers]: SecondArgumentOf<CustomReducers[StateKey]> }>;

  type UserActions = ValueOf<
    {
      [StateKey in keyof Modules]: ReturnType<
        ValueOf<
          {
            [ActionType in keyof Modules[StateKey]['actions']]: Modules[StateKey]['actions'][ActionType]['actionCreator']
          }
        >
      >
    }
  >;
  type AllActions = UserActions | CustomActions;

  const builtReducers = Object.keys(modules).reduce(
    (acc: object, stateKey) => ({
      ...acc,
      [stateKey]: (state = modules[stateKey].initialState, action: { type: string }) => {
        const subModule = modules[stateKey].actions[action.type];
        return subModule ? subModule.subReducer(state, action) : state;
      },
    }),
    {}
  );

  const actionCreators = Object.keys(modules).reduce(
    (acc: object, stateKey) => ({
      ...acc,
      [stateKey]: Object.keys(modules[stateKey].actions).reduce(
        (acc, actionType) => ({
          ...acc,
          [actionType]: modules[stateKey].actions[actionType].actionCreator,
        }),
        {}
      ),
    }),
    {}
  ) as {
    [StateKey in keyof Modules]: {
      [ActionType in ValueOf<
        {
          [K in keyof Modules[StateKey]['actions']]: ReturnType<
            Modules[StateKey]['actions'][K]['actionCreator']
          >['type']
        }
      >]: Extract<Modules[StateKey]['actions'][ActionType]['actionCreator'], (...args: any[]) => { type: ActionType }>
    }
  };

  const composeEnhancers: typeof compose = _window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  const store = createStore(
    combineReducers({ ...builtReducers, ...(customReducers as {}) }),
    middleware ? composeEnhancers(applyMiddleware(middleware)) : undefined
  );

  const dispatch = (action: AllActions): void => store.dispatch(action as any);

  type UserState = { [K in keyof Modules]: Modules[K]['initialState'] };
  type FullState = UserState & CustomState;

  const getState = (): FullState => store.getState() as FullState;

  const __fullState: FullState = null as any;
  const __customActions: CustomActions = null as any;

  return { actionCreators, dispatch, getState, __fullState, __customActions };
};
