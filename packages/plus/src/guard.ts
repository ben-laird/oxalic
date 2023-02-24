import { Variant, RusticEnum, Ok, Err, Discriminate } from "@rustic-enum/core";

module guard {
  export type Type<T> = T extends (x: unknown) => x is infer U ? U : never;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Arg<T> = T extends (x: infer U) => x is any ? U : never;

  export type CoreObject<T> = Record<string, (v: T) => v is T>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type Any = CoreObject<any>;

  export type VariantObject<T extends Any> = {
    [K in keyof T]: Variant<Type<T[K]>>;
  };
}

class GuardEnum<T extends guard.Any> extends RusticEnum<
  guard.VariantObject<T>
> {}

export const guardFilter = <T, G extends guard.CoreObject<T>, E>(
  value: T,
  guardParams: { guards: G; error: E }
) => {
  const { guards, error } = guardParams;

  const guarded = Object.keys(guards)
    .flatMap((type) =>
      guards[type](value)
        ? {
            type,
            value: new Variant(value as guard.Type<G[keyof G]>),
          }
        : []
    )
    .at(0);

  return guarded
    ? new Ok(new GuardEnum<G>(guarded)).asResult<E>()
    : new Err(error).asResult<GuardEnum<G>>();
};

export const guardFactory = <G extends guard.Any, E>(guardParams: {
  guards: G;
  error: E;
}) => {
  return (value: guard.Arg<G[keyof G]>) => {
    const { guards, error } = guardParams;

    const guarded = Object.keys(guards)
      .flatMap<Discriminate<guard.VariantObject<G>>>((type) =>
        guards[type](value)
          ? {
              type,
              value: new Variant(value as guard.Type<G[keyof G]>),
            }
          : []
      )
      .at(0);

    return guarded
      ? new Ok(new GuardEnum<G>(guarded)).asResult<E>()
      : new Err(error).asResult<GuardEnum<G>>();
  };
};
