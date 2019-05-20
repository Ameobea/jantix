import { applyMiddleware, compose, createStore, combineReducers } from 'redux';

type ValueOf<T> = T[keyof T];

interface ActionGroup<
  ActionType extends string | number | symbol,
  Action extends { type: ActionType; [key: string]: any },
  ActionCreator extends (...args: any[]) => Action,
  State,
  SubReducer extends (state: State, action: Action) => State
> {
  actionCreator: ActionCreator;
  subReducer: SubReducer;
}

const buildActionGroup = <
  ActionType extends string,
  Action extends { type: ActionType; [key: string]: any },
  ActionCreator extends (...args: any[]) => Action,
  State,
  SubReducer extends (state: State, action: Action) => State
>(
  actionCreator: ActionCreator,
  subReducer: SubReducer
): ActionGroup<ActionType, Action, ActionCreator, State, SubReducer> => ({
  actionCreator,
  subReducer,
});

const buildReduxModule = <
  State,
  AllActionTypes extends string,
  AllActions extends { type: string; [key: string]: any },
  AllActionCreators extends (...args: any[]) => { type: string; [key: string]: any },
  AllSubReducers extends (state: State, action: AllActions) => State
>(
  initialState: State,
  actions: {
    [K in AllActionTypes]: ActionGroup<
      K,
      Extract<AllActions, { type: K; [key: string]: any }>,
      Extract<
        AllActionCreators,
        (...args: any[]) => Extract<AllActions, { type: K; [key: string]: any }>
      >,
      State,
      Extract<
        AllSubReducers,
        (state: State, action: Extract<AllActions, { type: K; [key: string]: any }>) => State
      >
    >
  }
) => {
  return {
    initialState,
    actions,
  };
};

type AllActionsOf<
  T extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string; [key: string]: any };
    };
  }
> = { [K in keyof T]: ReturnType<T[K]['actionCreator']> };

type AllActionCreatorsOf<
  T extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string; [key: string]: any };
    };
  }
> = { [K in keyof T]: T[K]['actionCreator'] };

type AllSubReducersOf<
  T extends {
    [type: string]: {
      subReducer: (state: any, action: { type: string; [key: string]: any }) => any;
    };
  }
> = { [K in keyof T]: T[K]['subReducer'] };

const manuallyTypedModule = {
  DELETE_VALUE: buildActionGroup<
    'DELETE_VALUE',
    { type: 'DELETE_VALUE'; key: string },
    (key: string) => { type: 'DELETE_VALUE'; key: string },
    { [key: string]: string },
    (
      state: { [key: string]: string },
      action: { type: 'DELETE_VALUE'; key: string }
    ) => { [key: string]: string }
  >(
    (key: string) => ({ type: 'DELETE_VALUE', key }),
    (state: { [key: string]: string }, { key }) => ({ ...state, [key]: undefined })
  ),
  SET_VALUE: buildActionGroup<
    'SET_VALUE',
    { type: 'SET_VALUE'; key: string; value: string },
    (key: string, value: string) => { type: 'SET_VALUE'; key: string; value: string },
    { [key: string]: string },
    (
      state: { [key: string]: string },
      action: { type: 'SET_VALUE'; key: string; value: string }
    ) => { [key: string]: string }
  >(
    (key: string, value: string) => ({ type: 'SET_VALUE', key, value }),
    (state: { [key: string]: string }, { key, value }) => ({ ...state, [key]: value })
  ),
};

const autoTypedModule = {
  DELETE_VALUE: buildActionGroup(
    (key: string) => ({ type: 'DELETE_VALUE', key }),
    (state: { [key: string]: string }, { key }) => ({ ...state, [key]: undefined })
  ),
  SET_VALUE: buildActionGroup(
    (key: string, value: string) => ({ type: 'SET_VALUE', key, value }),
    (state: { [key: string]: string }, { key, value }) => ({ ...state, [key]: value })
  ),
};

const buildModule = <
  State,
  Actions extends {
    [type: string]: {
      actionCreator: (...args: any[]) => { type: string; [key: string]: any };
      subReducer: (state: State, action: { type: string; [key: string]: any }) => State;
    };
  }
>(
  initialState: State,
  actions: Extract<
    Actions,
    {
      [K in keyof Actions]: ActionGroup<
        K,
        Extract<ValueOf<AllActionsOf<Actions>>, { type: K; [key: string]: any }>,
        Extract<
          ValueOf<AllActionCreatorsOf<Actions>>,
          (
            ...args: any[]
          ) => Extract<ValueOf<AllActionsOf<Actions>>, { type: K; [key: string]: any }>
        >,
        State,
        Extract<
          ValueOf<AllSubReducersOf<Actions>>,
          (
            state: State,
            action: Extract<ValueOf<AllActionsOf<Actions>>, { type: K; [key: string]: any }>
          ) => State
        >
      >
    }
  >
) => {
  type OurAllActionTypes = keyof Actions;
  type OurAllActions = ValueOf<AllActionsOf<Actions>>;
  type OurAllActionCreators = ValueOf<AllActionCreatorsOf<Actions>>;
  type OurAllSubReducers = ValueOf<AllSubReducersOf<Actions>>;

  return buildReduxModule<State, string, OurAllActions, OurAllActionCreators, OurAllSubReducers>(
    initialState,
    actions
  );
};

const builtModule = buildModule<{ [key: string]: string }, typeof autoTypedModule>(
  {},
  autoTypedModule
);

const buildStore = <
  Modules extends {
    [stateKey: string]: {
      initialState: any;
      actions: {
        [type: string]: {
          actionCreator: (...args: any[]) => { type: string; [key: string]: any };
          subReducer: (
            state: ValueOf<{ [K in keyof Modules]: Modules[K]['initialState'] }>,
            action: { type: string; [key: string]: any }
          ) => ValueOf<{ [K in keyof Modules]: Modules[K]['initialState'] }>;
        };
      };
    };
  }
>(
  modules: {
    [StateKey in keyof Modules]: {
      initialState: { [K in keyof Modules]: Modules[K]['initialState'] }[StateKey];
      actions: {
        [ActionType in keyof Modules[StateKey]['actions']]: ActionGroup<
          ActionType,
          Extract<
            ValueOf<AllActionsOf<Modules[StateKey]['actions']>>,
            { type: ActionType; [key: string]: any }
          >,
          Extract<
            ValueOf<AllActionCreatorsOf<Modules[StateKey]['actions']>>,
            (
              ...args: any[]
            ) => Extract<
              ValueOf<AllActionsOf<Modules[StateKey]['actions']>>,
              { type: ActionType; [key: string]: any }
            >
          >,
          { [K in keyof Modules]: Modules[K]['initialState'] }[StateKey],
          Extract<
            ValueOf<AllSubReducersOf<Modules[StateKey]['actions']>>,
            (
              state: { [K in keyof Modules]: Modules[K]['initialState'] }[StateKey],
              action: Extract<
                ValueOf<AllActionsOf<Modules[StateKey]['actions']>>,
                { type: ActionType; [key: string]: any }
              >
            ) => { [K in keyof Modules]: Modules[K]['initialState'] }[StateKey]
          >
        >
      };
    }
  },
  middleware?: any
) => {
  type RefinedModules = typeof modules;
  type AllActions = ValueOf<
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

  const builtReducers = Object.keys(modules).reduce(
    (acc: object, stateKey) => ({
      ...acc,
      [stateKey]: (
        state = modules[stateKey].initialState,
        action: { type: string; [key: string]: any }
      ) => {
        const subReducer = modules[stateKey].actions[action.type].subReducer;
        return subReducer ? subReducer(state, action) : state;
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
      >]: Extract<
        Modules[StateKey]['actions'][ActionType]['actionCreator'],
        (...args: any[]) => { type: ActionType }
      >
    }
  };

  const composeEnhancers: typeof compose =
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  const store = createStore(
    combineReducers(builtReducers),
    composeEnhancers(applyMiddleware(middleware))
  );

  const dispatch = (action: AllActions): void => {
    store.dispatch(action as any);
  };

  return { actionCreators, dispatch };
};

const barModule = {
  INCREMENT: buildActionGroup(
    () => ({ type: 'INCREMENT' }),
    ({ count }: { count: number }, action: {}) => ({ count: count + 1 })
  ),
  DECREMENT: buildActionGroup(
    () => ({ type: 'DECREMENT' }),
    ({ count }: { count: number }, action: {}) => ({ count: count - 1 })
  ),
};

const storeDefinition = {
  foo: buildModule<{ [key: string]: string }, typeof autoTypedModule>({}, autoTypedModule),
  bar: buildModule<{ count: number }, typeof barModule>({ count: 0 }, barModule),
};

const { actionCreators, dispatch } = buildStore<typeof storeDefinition>(storeDefinition);
