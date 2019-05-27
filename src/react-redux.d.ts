declare module 'react-redux' {
  export function useSelector<FullState, T>(
    selector: (state: FullState) => T,
    shallowEqual?: (prev: T, cur: T) => boolean = (prev, cur) => prev === cur
  ): T;
}
