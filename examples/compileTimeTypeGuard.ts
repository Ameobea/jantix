const takesMatchingKeys = <T extends { [key: string]: { type: string } }>(obj: { [K in keyof T]: { type: K } }) => {
  Object.entries(obj).forEach(([key, { type }]) => {
    if (key !== type) {
      console.error(`ERROR: "${key}" doesn't match "${type}"`);
    }
  });

  return obj;
};

const narrow = <K extends string>(val: { type: K }) => val;

const valid = {
  foo: narrow({ type: 'foo' as 'foo' }),
  bar: narrow({ type: 'bar' }),
};

takesMatchingKeys<typeof valid>(valid);

//////////////

const takesNonEmptyArray = <T, A extends T[]>(arr: A) => {};

const narrowNonEmptyArray = <T, R extends Exclude<T[], { length: 0 }>>(arr: R) => arr;

const t = narrowNonEmptyArray([]);
takesNonEmptyArray(t);
