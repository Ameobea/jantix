# Jantix

![NPM version badge for jantix](https://img.shields.io/npm/v/jantix.svg?style=flat-square)
![Last commit badge](https://img.shields.io/github/last-commit/ameobea/jantix.svg?style=flat-square)

Jantix is a fully-featured TypeScript library that defines a tiny (837 bytes gzip'd), self-contained, 100% type-safe Redux architecture. It allows for stores following a common pattern to be easily defined, merged, and used through the native Redux interface with type safety and consistency guarantees automatically applied.

In addition to enforcing a typed interface for interacting with the created store, it also provides many useful guarantees about the validity of the provided actions/reducers by preventing mismatches between action types, invalid actions, and mal-formed reducers all at compile-time.

## Installation

`yarn add jantix`

or

`npm install --save jantix`

## Design

Jantix works on the principle of coupling action creators, actions/types, reducers, and state together at both the type and structural level. One of the biggest annoyances with traditional Redux setups is the large spread in places where the various components of the Redux store are defined. Your action creators often go in one file, your reducers in another, your action type constants in another, etc. In addition to fragmenting your thought process when dealing with the code and making it easier for bugs/inconsistencies, it also makes creating manually established types for all of the different pieces more difficult.

Jantix represents an entire segment of the Redux store as a structure combining each of these pieces together at the code level. The hierarchy looks like this:

```txt
           +-------------------------------------------------+
           |                                                 |
           |                Global Redux Store               |
           |                                                 |
           |   Key A              Key B              Key C   |
           |                                                 |
           |                                                 |
           +------------------------+------------------------+
           |                        |                        |
           |                        |                        |
           |                        |                        |
           |                        |                        |
     +-----v-----+            +-----v-----+            +-----v-----+
     |           |            |           |            |           |
     |  State A  |            |  State B  |            |  State C  |
     |     +     |            |     +     |            |     +     |
     |  Reducer  |            |  Reducer  |            |  Reducer  |
     |           |            |           |            |           |
     +-----------+            +-----------+            +-----------+
     |           |            |           |            |           |
     |           |            |           |            |           |
     |           |            |           |            |           |
+----v----+ +----v----+  +----v----+ +----v----+  +----v----+ +----v----+
|         | |         |  |         | |         |  |         | |         |
| Action  | | Action  |  | Action  | | Action  |  | Action  | | Action  |
| Creator | | Creator |  | Creator | | Creator |  | Creator | | Creator |
|         | |         |  |         | |         |  |         | |         |
| Sub-    | | Sub-    |  | Sub-    | | Sub-    |  | Sub-    | | Sub-    |
| Reducer | | Reducer |  | Reducer | | Reducer |  | Reducer | | Reducer |
|         | |         |  |         | |         |  |         | |         |
+---------+ +---------+  +---------+ +---------+  +---------+ +---------+
```

The bottom-most boxes are called "Action Groups" in Jantix. The middle boxes are called "modules," and the top level is the global Redux store that is generated. An action group is essentially a mini-reducer that contains a single action and a single reducer for handling that action. Multiple of these action groups are combined into each module, each of which has its own state which is shared between each of the action groups. Finally, multiple modules are combined into a single Redux store with each module having its own unique key.

Here is an example of a complete Jantix architecture consisting of a single action group and store:

```ts
import { buildModule, buildStore, buildActionGroup } from 'jantix';

type KVStoreState = { [key: string]: string | undefined };

const actionGroups = {
  SET: buildActionGroup({
    actionCreator: (key: string, value: string) => ({ type: 'SET', key, value }),
    // The type of the second action argument are automatically inferred + type-checked against the action creator above
    subReducer: (state: KVStoreState, { key, value }) => ({ ...state, [key]: value }),
  }),
};

// The second type argument is necessary due to the internal tricks used to perform static type assertions on the
// structure of the action groups + module definition
const kvStoreModule = buildModule<KVStoreState, typeof actionGroups>({}, actionGroups);

const storeDefinition = {
  kvStore: kvStoreModule,
};

// This internally calls `combineReducers` and produces a new Redux store as well as strongly-typed methods for
// interacting with it and integrating it into React.
const { actionCreators, dispatch, getState } = buildStore<typeof storeDefinition>(storeDefinition);
```

The end result of this is a fully-functional Redux store that can be interacted with like any other. It will also generate wrapped `store`, `actionCreators`, `dispatch`, `getState`, and `useSelector` variables that are 100% typed and statically validated. You can export them out of the file you created your store in and make use of them in the exact same way you would with normal, un-wrapped Redux.

Jantix does a lot of helpful things in between these few steps. First of all, it ensures that you have a 100% typed Redux architecture. This is extremely valuable in and of itself; all of the boilerplate is taken care of internally, and every single part is tied up with the same overarching, centralized types. Editor type completion is integrated perfectly as well: ![](https://ameo.link/u/6ht.png)

Adding to that, it statically verifies that each action type/action creator has a handler for its action in the reducer. If you were to set the `type` prop of the created object to a different value than the key of the `actionsGroup` object to which it belongs, a type-level error will be triggered.

Due to the way that action groups are designed, you also get exhaustiveness checking for actions built-in (it's impossible to have an action/action creator that doesn't have a corresponding handler/sub-reducer). In addition, it also creates a `dispatch` function that only accepts known action types. Trying to do `dispatch({ type: 'UNHANDLED' })` will also trigger a type-level error.

### Integrating with External Redux Modules

Some libraries integrate directly into redux, such as [`connected-react-router`](https://github.com/supasate/connected-react-router), and create their own store keys, actions, and reducers. Since these don't fit into the siloed Jantix architecture, they must be represented specially. Jantix supports this with the addition of two additional optional type arguments on the `buildStore` function: `CustomReducers` and `CustomState`. An example of how to use this can be found in `examples/basic.ts`.

## Usage / Example

Check out `examples/basic.ts` for a more complete example of how to use jantix.

To see a larger-scale project that makes use of Jantix, check out my [Spotify Stats Website Repo](https://github.com/Ameobea/spotify-homepage/blob/master/frontend/src/store/index.tsx).
