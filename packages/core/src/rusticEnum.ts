// ========
// AnyType Logic
// ========

type AnyVariant = Variant<any>;

type AnyVariantObject = Record<string, AnyVariant>;

type AnyRusticEnum = RusticEnum<any>;

type AnyRusticEnumElement = AnyRusticEnum | AnyVariantObject;

// ========
// Variant Logic
// ========

/**
 * A class to represent a variant a Rustic Enum value could take.
 * Extend this to include custom logic that is accessible in a match function.
 */
export class Variant<T> {
  constructor(readonly value: T) {}

  toEnum = <U extends AnyRusticEnum>(lambda: (ctx: this) => U) => {
    return lambda(this);
  };

  test = (test: (value: T) => boolean, fallback: T) => {
    return test(this.value) ? this.value : fallback;
  };

  testToEnum = <U extends AnyRusticEnum>(
    testParams: {
      test: (value: T) => boolean;
      fallback: T;
    },
    lambda: (value: T, ctx: this) => U,
  ) => {
    const { test, fallback } = testParams;
    const { value } = this;

    return test(value) ? lambda(value, this) : lambda(fallback, this);
  };
}

export class UnitVariant extends Variant<undefined> {
  constructor() {
    super(undefined);
  }
}

export class NullVariant extends Variant<null> {
  constructor() {
    super(null);
  }
}

// ========
// Rustic Enum Logic
// ========

export type Discriminate<T extends AnyVariantObject> = {
  [K in keyof T]: { type: K; value: T[K] };
}[keyof T];

type ArmParams<T extends AnyVariantObject, U> = {
  [K in keyof T]: T[K] extends UnitVariant ? () => U : (value: T[K]) => U;
};

type Match<T extends AnyVariantObject> = <U>(arms: ArmParams<T, U>) => U;

type PartialMatchParams<T extends AnyVariantObject, U> = Partial<
  ArmParams<T, U>
> & {
  _: () => U;
};

type PartialMatch<T extends AnyVariantObject> = <U>(
  arms: PartialMatchParams<T, U>,
) => U;

type IfLet<T extends AnyVariantObject> = <U>(
  type: V.Keys<T>,
  ifArm: (value: T[typeof type]) => U,
  elseArm: () => U,
) => U;

type Is<T extends AnyVariantObject> = (type: keyof T) => boolean;

type IsAnd<T extends AnyVariantObject> = <V extends keyof T>(
  type: V,
  predicate: (value: T[V]) => boolean,
) => boolean;

type IsVariant<T extends AnyVariantObject> = <U extends keyof T>(
  type: U,
  variant: Discriminate<T>,
) => variant is { type: U; value: T[U] };

type IsMaybe<T extends AnyVariantObject> = <U extends V.Keys<T>>(
  type: U,
) => Option<T[U]>;

type IsAndMaybe<T extends AnyVariantObject> = <U extends V.Keys<T>>(
  type: U,
  predicate: (value: T[U]) => boolean,
) => Option<T[U]>;

/**
 * A class that holds a value of a certain type, allowing comprehensive control flow
 * by matching against all possible types the value could be
 */
export abstract class RusticEnum<T extends AnyVariantObject> {
  constructor(protected readonly variant: Discriminate<T>) {}

  protected isV: IsVariant<T> = (
    type,
    variant,
  ): variant is { type: typeof type; value: T[typeof type] } =>
    variant.type === type;

  // Utility methods

  /**
   * A construct to match against all possible types
   * the value in the Rustic Enum could take
   */
  match: Match<T> = (arms) => {
    const { type, value } = this.variant;
    return arms[type](value);
  };

  partialMatch: PartialMatch<T> = <U>(arms: PartialMatchParams<T, U>) => {
    const { type, value } = this.variant;

    const f = arms[type] as Partial<ArmParams<T, U>>[keyof T];

    if (f) return f(value);
    else return arms._();
  };

  ifLet: IfLet<T> = (type, ifArm, elseArm) => {
    const { variant, isV } = this;

    if (isV(type, variant)) {
      const { value } = variant;
      return ifArm(value);
    } else return elseArm();
  };

  is: Is<T> = (type) => this.variant.type === type;

  isAnd: IsAnd<T> = (type, predicate) => {
    const { variant, isV } = this;

    if (isV(type, variant)) {
      const { value } = variant;
      return predicate(value);
    } else return false;
  };

  isMaybe: IsMaybe<T> = (type) => {
    const { isV, variant } = this;

    if (isV(type, variant)) {
      const { value } = variant;
      return new Some(value).asOption();
    } else return new None().asOption();
  };

  isAndMaybe: IsAndMaybe<T> = (type, predicate) => {
    const { isV, variant } = this;

    if (isV(type, variant) && predicate(variant.value)) {
      const { value } = variant;
      return new Some(value).asOption();
    } else return new None().asOption();
  };
}

// ========
// Inference Logic
// ========

export module V {
  // Creators/Helpers

  export type Enum<T extends string, U = UnitVariant> = Record<
    T,
    U extends AnyVariant ? U : Variant<U>
  >;

  export type Interface<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends null
      ? NullVariant
      : T[K] extends undefined
      ? UnitVariant
      : T[K] extends AnyVariant
      ? T[K]
      : Variant<T[K]>;
  };

  export type PureInterface<T extends Record<string, any>> = {
    [K in keyof T]: Variant<T[K]>;
  };

  // Inferrers

  /**
   * Takes a Variant Object and extracts
   * the type of either its keys or values
   */
  export type Get<
    T extends AnyVariantObject,
    U extends "keys" | "values",
  > = U extends "keys" ? keyof T : T[keyof T];

  export type Keys<T extends AnyVariantObject> = V.Get<T, "keys">;

  export type Vals<T extends AnyVariantObject> = V.Get<T, "values">;

  export type Infer<T extends AnyRusticEnumElement> = T extends RusticEnum<
    infer R
  >
    ? R
    : T extends AnyVariantObject
    ? T
    : never;

  export type Ext<T extends AnyRusticEnumElement> = Keys<Infer<T>>;
}
export module From {
  export type To<T extends AnyRusticEnum, V extends V.Ext<T>> = (
    value: V.Infer<T>[V],
  ) => T;

  export type New<T extends AnyRusticEnum> = (
    input: Discriminate<V.Infer<T>>,
  ) => T;

  export type ToObject<T extends AnyRusticEnum> = {
    [K in V.Ext<T>]: To<T, K>;
  };
}

// ========
// Option Logic
// ========

export class Some<T> extends Variant<T> {
  asOption = () => new Option<T>({ type: "Some", value: this });
}

export class None extends NullVariant {
  asOption = <T>() => new Option<T>({ type: "None", value: this });
}

type OptionI<T> = {
  Some: Some<T>;
  None: None;
};

export class Option<T> extends RusticEnum<OptionI<T>> {
  static fromSome = <U>(some: Some<U>) => some.asOption();

  static fromNone = <U>(none: None) => none.asOption<U>();

  expect = (errorMessage: string) => {
    if (this.variant.value instanceof None) {
      throw new Error(errorMessage);
    } else {
      return this.variant.value.value;
    }
  };

  unwrap = () => this.expect("An error occurred when unwrapping a value!");

  unwrapOr = (value: T) => {
    if (this.variant.value instanceof None) {
      return value;
    } else {
      return this.variant.value.value;
    }
  };

  unwrapOrElse = (lambda: () => T) => {
    if (this.variant.value instanceof None) {
      return lambda();
    } else {
      return this.variant.value.value;
    }
  };

  map = <U>(lambda: (value: T) => U): Option<U> => {
    if (this.variant.value instanceof None) {
      return new Option<U>({ type: "None", value: new None() });
    } else {
      return new Option({
        type: "Some",
        value: new Some(lambda(this.variant.value.value)),
      });
    }
  };

  mapOrElse = <U>(noneLambda: () => U, someLambda: (value: Some<T>) => U) => {
    return this.match({
      Some: someLambda as Some<T> extends UnitVariant
        ? () => U
        : (value: Some<T>) => U,
      None: noneLambda,
    });
  };

  okOr = <E>(error: E): Result<T, E> => {
    if (this.variant.value instanceof None) {
      return new Result<T, E>({ type: "Err", value: new Err(error) });
    } else {
      return new Result<T, E>({
        type: "Ok",
        value: new Ok(this.variant.value.value),
      });
    }
  };

  okOrElse = <E>(errorLambda: () => E): Result<T, E> => {
    if (this.variant.value instanceof None) {
      return new Result<T, E>({ type: "Err", value: new Err(errorLambda()) });
    } else {
      return new Result<T, E>({
        type: "Ok",
        value: new Ok(this.variant.value.value),
      });
    }
  };

  and = <U>(optionB: Option<U>): Option<U> => {
    if (this.variant.value instanceof None) {
      return new Option<U>({ type: "None", value: new None() });
    } else {
      return optionB;
    }
  };

  andThen = <U>(lambda: (value: T) => Option<U>): Option<U> => {
    if (this.variant.value instanceof None) {
      return new Option<U>({ type: "None", value: new None() });
    } else {
      return lambda(this.variant.value.value);
    }
  };

  filter = (predicate: (value: T) => boolean): Option<T> => {
    if (this.variant.value instanceof None) {
      return new Option<T>({ type: "None", value: new None() });
    } else if (predicate(this.variant.value.value)) {
      return this;
    } else {
      return new Option<T>({ type: "None", value: new None() });
    }
  };
}

// ========
// Result Logic
// ========

export class Ok<T> extends Variant<T> {
  private static readonly state: unique symbol = Symbol("Ok");

  asResult = <U>() => new Result<T, U>({ type: "Ok", value: this });
}

export class Err<T> extends Variant<T> {
  private static readonly state: unique symbol = Symbol("Err");

  asResult = <U>() => new Result<U, T>({ type: "Err", value: this });

  panic = () => {
    throw this;
  };
}

export type ResultInterface<T, E> = {
  Ok: Ok<T>;
  Err: Err<E>;
};

export class Result<T, E> extends RusticEnum<ResultInterface<T, E>> {
  isOk = () => this.is("Ok");

  isOkAnd = (predicate: (value: T) => boolean) => {
    const { type, value } = this.variant;

    return type === "Ok" ? predicate(value.value) : false;
  };

  isErr = () => this.is("Err");

  isErrAnd = (predicate: (value: E) => boolean) => {
    const { type, value } = this.variant;

    return type === "Err" ? predicate(value.value) : false;
  };

  ok = (): Option<T> => {
    const { type, value } = this.variant;

    return type === "Ok"
      ? new Some(value.value).asOption()
      : new None().asOption();
  };

  err = (): Option<E> => {
    const { type, value } = this.variant;

    return type === "Err"
      ? new Some(value.value).asOption()
      : new None().asOption();
  };

  map = <U>(lambda: (value: T) => U): Result<U, E> => {
    const { type, value } = this.variant;

    return type === "Err"
      ? new Err(value.value).asResult()
      : new Ok(lambda(value.value)).asResult();
  };

  mapOr = <U>(fallback: U, lambda: (value: T) => U) => {
    const { type, value } = this.variant;

    return type === "Err" ? fallback : lambda(value.value);
  };

  mapOrElse = <U>(fallback: (value: E) => U, lambda: (value: T) => U) => {
    const { type, value } = this.variant;

    return type === "Ok" ? lambda(value.value) : fallback(value.value);
  };

  mapErr = <F>(lambda: (value: E) => F): Result<T, F> => {
    const { type, value } = this.variant;

    return type === "Err"
      ? new Err(lambda(value.value)).asResult()
      : new Ok(value.value).asResult();
  };

  inspect = (f: (value: T) => void): Result<T, E> => {
    const { type, value } = this.variant;
    if (type === "Ok") f(value.value);

    return this;
  };

  inspectErr = (f: (value: E) => void): Result<T, E> => {
    const { type, value } = this.variant;
    if (type === "Err") f(value.value);

    return this;
  };

  expect = (message: string) => {
    const { type, value } = this.variant;

    if (type === "Ok") return value.value;
    else throw new Error(message);
  };

  unwrap = () => this.expect("An error occurred when unwrapping a value!");

  expectErr = (message: string) => {
    const { type, value } = this.variant;

    if (type === "Err") return value.value;
    else throw new Error(message);
  };

  unwrapErr = () => this.expect("An error occurred when unwrapping a value!");

  and = <U>(res: Result<U, E>) => {};
}
