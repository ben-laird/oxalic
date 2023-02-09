import { Variant, RusticEnum, Discriminate, Ok, Err } from "@rustic-enum/core";

module ctxGuard {
  export type Object<T, C> = Record<string, (v: T, ctx: C) => v is T>;

  export type Any = Object<any, any>;

  export type Type<T extends (v: any, ctx: any) => v is any> = T extends (
    v: any,
    ctx: any,
  ) => v is infer U
    ? U
    : never;

  export type Arg<T> = T extends (x: infer U, ctx: any) => x is any ? U : never;

  export type VariantObject<T extends Any> = {
    [K in keyof T]: Variant<Type<T[K]>>;
  };
}

class GuardEnumCtx<C, T extends ctxGuard.Object<any, C>> extends RusticEnum<
  ctxGuard.VariantObject<T>
> {
  constructor(
    readonly ctx: C,
    variant: Discriminate<ctxGuard.VariantObject<T>>,
  ) {
    super(variant);
  }
}

export const guardFilterCtx = <
  T,
  C,
  G extends ctxGuard.Object<T, C>,
  E,
>(params: {
  value: T;
  ctx: C;
  guards: G;
  error: E;
}) => {
  const { value, ctx, guards, error } = params;

  const guarded = Object.keys(guards)
    .flatMap((type) =>
      guards[type](value, ctx)
        ? {
            type,
            value: new Variant(value as ctxGuard.Type<G[keyof G]>),
          }
        : [],
    )
    .at(0);

  return guarded
    ? new Ok(new GuardEnumCtx<C, G>(ctx, guarded)).asResult<E>()
    : new Err(error).asResult<GuardEnumCtx<C, G>>();
};

export const guardFactoryCtx = <
  C,
  G extends ctxGuard.Object<any, C>,
  E,
>(params: {
  ctx: C;
  guards: G;
  error: E;
}) => {
  return (value: ctxGuard.Arg<G[keyof G]>) => {
    const { ctx, guards, error } = params;

    const guarded = Object.keys(guards)
      .flatMap((type) =>
        guards[type](value, ctx)
          ? {
              type,
              value: new Variant(value as ctxGuard.Type<G[keyof G]>),
            }
          : [],
      )
      .at(0);

    return guarded
      ? new Ok(new GuardEnumCtx<C, G>(ctx, guarded)).asResult<E>()
      : new Err(error).asResult<GuardEnumCtx<C, G>>();
  };
};
