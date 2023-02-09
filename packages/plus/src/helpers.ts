import { Some, Option, None } from "@rustic-enum/core";

const some = <T>(value: T): Option<T> => new Some(value).asOption();

const none = <T>(): Option<T> => new None().asOption<T>();

const optionalCatch = <T>(fn: () => T): Option<T> => {
  try {
    return some(fn());
  } catch (error) {
    return none();
  }
};

const greet = (name: string) => {
  if (name === "Andrew") throw new Error("Cannot greet!");
  return `Hello ${name}`;
};

const maybeGreeting = optionalCatch(() => greet("Andrew"));

const optionalResolve = async <T>(p: Promise<T>): Promise<Option<T>> =>
  p.then((v) => some(v)).catch(() => none());

const f = async () => {
  const maybeCount = await optionalResolve(Promise.resolve(34));
};

const toOptional =
  <I, O extends I>(test: (i: I) => i is O) =>
  (arg: I): Option<O> => {
    try {
      return test(arg) ? some(arg) : none();
    } catch (error) {
      return none();
    }
  };

const optionalDefined = toOptional(
  <T>(arg: T | undefined | null): arg is T => arg != null,
);

const arr = [1, 2];

const b = optionalDefined(arr.pop()).expect("Uh Oh!");

const getTimeDiff = (arr: Array<Date>): number => {
  const start = optionalDefined(arr[0]);
  const end = optionalDefined(arr[1]);

  const startVal = start.expect("Range must have a start!").valueOf();
  const endVal = end.unwrapOr(new Date()).valueOf();

  return endVal - startVal;
};
