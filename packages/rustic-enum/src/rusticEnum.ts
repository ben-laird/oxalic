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

type Discriminate<T extends AnyVariantObject> = {
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

type IfThen<T extends AnyVariantObject> = <U>(
  type: V.Keys<T>,
  ifArm: (value: T[typeof type]) => U,
  elseArm: () => U,
) => U;

type IfLet<T extends AnyVariantObject> = (
  type: V.Keys<T>,
  ifArm: (value: T[typeof type]) => void,
  elseArm?: () => void,
) => void;

type Is<T extends AnyVariantObject> = (type: V.Keys<T>) => boolean;

type IsVariant<T extends AnyVariantObject> = <U extends V.Keys<T>>(
  type: U,
  variant: Discriminate<T>,
) => variant is { type: U; value: T[U] };

/**
 * A class that holds a value of a certain type, allowing comprehensive control flow
 * by matching against all possible types the value could be
 */
export abstract class RusticEnum<T extends AnyVariantObject> {
  constructor(protected readonly variant: Discriminate<T>) {}

  protected isVariant: IsVariant<T> = (
    type,
    variant,
  ): variant is { type: typeof type; value: T[typeof type] } =>
    variant.type === type;

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

    const f = arms[type] as Partial<ArmParams<T, U>>[typeof type];

    if (f) return f(value);
    else return arms._();
  };

  ifThen: IfThen<T> = (type, ifArm, elseArm) => {
    const { variant, isVariant } = this;

    if (isVariant(type, variant)) {
      const { value } = variant;
      return ifArm(value);
    } else return elseArm();
  };

  is: Is<T> = (type) => this.variant.type === type;

  ifLet: IfLet<T> = (type, ifArm, elseArm) => {
    const { variant, isVariant } = this;

    if (isVariant(type, variant)) {
      const { value } = variant;
      return ifArm(value);
    } else if (elseArm) return elseArm();
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

  // Inferrers

  /**
   * Takes a Variant Object and extracts
   * the type of either its keys or values
   */
  export type Get<
    T extends AnyVariantObject,
    U extends "keys" | "values",
  > = T extends Record<infer K, Variant<infer V>>
    ? { keys: K; values: V }[U]
    : never;

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
