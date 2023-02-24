import {
  AnyVariantObject as AVO,
  Discriminate,
  RusticEnum,
  UnitVariant,
} from "@rustic-enum/core";

type ArmParamsSm<T extends AVO, C, U> = {
  [K in keyof T]: T[K] extends UnitVariant
    ? () => U
    : (value: T[K], ctx: C) => U;
};

type MatchSm<T extends AVO, C> = <U>(arms: ArmParamsSm<T, C, U>) => U;

// TODO decide on and finish implementing commented out methods

// type PartialMatchSmParams<T extends AVO, C, U> = Partial<
//   ArmParamsSm<T, C, U>
// > & {
//   _: (ctx: C) => U;
// };

// type PartialMatchSm<T extends AVO, C> = <U>(
//   arms: PartialMatchSmParams<T, C, U>,
// ) => U;

// type IfLetSm<T extends AVO, C> = <U>(
//   type: V.Keys<T>,
//   ifArm: (value: T[typeof type], ctx: C) => U,
//   elseArm: (ctx: C) => U,
// ) => U;

// type SmIsAnd<T extends AVO> = <V extends keyof T, C>(
//   type: V,
//   predicate: (value: T[V], ctx: C) => boolean,
// ) => boolean;

// type SmIsAndMaybe<T extends AVO, C> = <U extends V.Keys<T>>(
//   type: U,
//   predicate: (value: T[U], ctx: C) => boolean,
// ) => Option<T[U]>;

export abstract class SmartEnum<V extends AVO, C> extends RusticEnum<V> {
  constructor(variant: Discriminate<V>, protected readonly ctx: C) {
    super(variant);
  }

  matchSmart: MatchSm<V, C> = (arms) => {
    const { type, value } = this.variant;
    return arms[type](value, this.ctx);
  };
}
