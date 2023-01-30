// ========
// AnyType Logic
// ========

type AnyVariant = Variant<any>;

type AnyVariantObject = Record<string, AnyVariant>;

type AnyRusticEnum = RusticEnum<
  AnyVariantObject,
  VariantObjectDetails<AnyVariantObject, "keys">
>;

type AnyRusticEnumElement = AnyRusticEnum | AnyVariantObject;

// ========
// Variant Logic
// ========

/**
 * A class to represent a variant a Rustic Enum value could take.
 * Extend this to include custom logic that is accessible in a match function.
 */
export class Variant<T> {
  constructor(private variantValue: T) {}

  get value() {
    return this.variantValue;
  }
}

export class UnitVariant extends Variant<"unit"> {
  constructor() {
    super("unit");
  }
}

export class NullVariant extends Variant<"null"> {
  constructor() {
    super("null");
  }
}

// ========
// Rustic Enum Logic
// ========

type ArmParams<T extends AnyVariantObject, U> = {
  [K in keyof T]: T[K] extends UnitVariant ? () => U : (value: T[K]) => U;
};

type Match<T extends AnyVariantObject, U> = (arms: ArmParams<T, U>) => U;

/**
 * A class that holds a value of a certain type, allowing comprehensive control flow
 * by matching against all possible types the value could be
 */
export abstract class RusticEnum<
  T extends AnyVariantObject,
  V extends V.Keys<T>
> {
  private readonly variantType: V;
  private readonly variantValue: T[V];

  constructor(variant: { type: V; value: T[V] }) {
    const { type, value } = variant;
    this.variantType = type;
    this.variantValue = value;
  }

  get enumType() {
    return this.variantType;
  }
  get enumValue() {
    return this.variantValue;
  }

  /**
   * A construct to match against all possible types
   * the value in the Rustic Enum could take
   */
  match = (<V>(arms: ArmParams<T, V>) =>
    arms[this.enumType](this.enumValue)) satisfies Match<T, any>;

  // filter = <X extends V, W>(type: X, action: (value: T[X] | None) => W) =>
  //   action(this.type === type ? this.value : new None());
}

// ========
// Root Inference Logic
// ========

type VariantObjectInfer<T extends AnyRusticEnumElement> = T extends RusticEnum<
  infer R,
  any
>
  ? R
  : T extends AnyVariantObject
  ? T
  : never;

/**
 * Takes a Variant Object and extracts
 * the type of either its keys or values
 */
type VariantObjectDetails<
  T extends AnyVariantObject,
  U extends "keys" | "values"
> = T extends Record<infer K, Variant<infer V>>
  ? { keys: K; values: V }[U]
  : never;

// ========
// Inference Logic
// ========

export module V {
  // Creators/Helpers

  export type Enum<
    T extends string,
    U extends AnyVariant = UnitVariant
  > = Record<T, U>;

  export type Interface<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends never | UnitVariant
      ? UnitVariant
      : T[K] extends "null" | NullVariant
      ? NullVariant
      : T[K] extends Variant<any>
      ? T[K]
      : Variant<T[K]>;
  };

  // Inferrers

  export type Keys<T extends AnyVariantObject> = VariantObjectDetails<
    T,
    "keys"
  >;

  export type Infer<T extends AnyRusticEnumElement> = VariantObjectInfer<T>;

  export type Ext<T extends AnyRusticEnumElement> = Keys<Infer<T>>;
}

export module Creator {
  export type Function<T extends AnyRusticEnum, V extends V.Ext<T>> = (
    value: V.Infer<T>[V]
  ) => T;

  export type Direct<T extends AnyRusticEnum> = <V extends V.Ext<T>>(input: {
    type: V;
    value: V.Infer<T>[V];
  }) => T;

  export type Standard<T extends AnyRusticEnum> = <V extends V.Ext<T>>(
    type: V,
    value: V.Infer<T>[V]
  ) => T;

  export type Generic<T extends AnyRusticEnum> = <V extends V.Ext<T>>(
    value: V.Infer<T>[V]
  ) => T;

  export type Factory<T extends AnyRusticEnum> = <V extends V.Ext<T>>(
    type: V
  ) => Function<T, V>;

  export type Object<T extends AnyRusticEnum> = {
    [K in V.Ext<T>]: Function<T, K>;
  };
}
