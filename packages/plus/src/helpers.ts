import { Some, Option, None } from "@oxalic/core";

const some = <T>(value: T): Option<T> => new Some(value).asOption();

const none = <T>(): Option<T> => new None().asOption<T>();

export const optionalCatch = <T>(fn: () => T): Option<T> => {
  try {
    return some(fn());
  } catch (error) {
    return none();
  }
};

export const optionalResolve = async <T>(p: Promise<T>): Promise<Option<T>> =>
  p.then((v) => some(v)).catch(() => none());

export const toOptional =
  <I, O extends I>(test: (i: I) => i is O) =>
  (arg: I): Option<O> => {
    try {
      return test(arg) ? some(arg) : none();
    } catch (error) {
      return none();
    }
  };
