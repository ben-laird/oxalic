import {
  Discriminate,
  Err,
  None,
  Ok,
  Option,
  Result,
  RusticEnum,
  Some,
  V,
  Variant,
} from "@rustic-enum/core";

type GuardedType<T> = T extends (x: any) => x is infer U ? U : never;

type GuardedArg<T> = T extends (x: infer U) => x is any ? U : never;

export module en {
  type GuardObject<T> = Record<string, (v: T) => v is T>;

  type AnyGuardObject = GuardObject<any>;

  type GuardVariantObject<T extends AnyGuardObject> = {
    [K in keyof T]: Variant<GuardedType<T[K]>>;
  };

  class GuardEnum<T extends AnyGuardObject> extends RusticEnum<
    GuardVariantObject<T>
  > {}

  export const guardFilter = <T, G extends GuardObject<T>, E>(
    value: T,
    guardParams: { guards: G; error: E },
  ) => {
    const { guards, error } = guardParams;

    const guarded = Object.keys(guards)
      .flatMap((type) =>
        guards[type](value)
          ? {
              type,
              value: new Variant(value as GuardedType<G[keyof G]>),
            }
          : [],
      )
      .at(0);

    return guarded
      ? new Ok(new GuardEnum<G>(guarded)).asResult<E>()
      : new Err(error).asResult<GuardEnum<G>>();
  };

  export const guardFactory = <G extends AnyGuardObject, E>(guardParams: {
    guards: G;
    error: E;
  }) => {
    return (value: GuardedArg<G[keyof G]>) => {
      const { guards, error } = guardParams;

      const guarded = Object.keys(guards)
        .flatMap((type) =>
          guards[type](value)
            ? {
                type,
                value: new Variant(value as GuardedType<G[keyof G]>),
              }
            : [],
        )
        .at(0);

      return guarded
        ? new Ok(new GuardEnum<G>(guarded)).asResult<E>()
        : new Err(error).asResult<GuardEnum<G>>();
    };
  };

  type CtxGuardObject<T, C> = Record<string, (v: T, ctx: C) => v is T>;

  type AnyCtxGuardObject = CtxGuardObject<any, any>;

  type CtxGuardedType<T extends (v: any, ctx: any) => v is any> = T extends (
    v: any,
    ctx: any,
  ) => v is infer U
    ? U
    : never;

  type CtxGuardedArg<T> = T extends (x: infer U, ctx: any) => x is any
    ? U
    : never;

  type CtxGuardVariantObject<T extends AnyCtxGuardObject> = {
    [K in keyof T]: Variant<CtxGuardedType<T[K]>>;
  };

  class GuardEnumCtx<C, T extends CtxGuardObject<any, C>> extends RusticEnum<
    CtxGuardVariantObject<T>
  > {
    constructor(
      readonly ctx: C,
      variant: Discriminate<CtxGuardVariantObject<T>>,
    ) {
      super(variant);
    }
  }

  export const guardFilterCtx = <
    T,
    C,
    G extends CtxGuardObject<T, C>,
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
              value: new Variant(value as CtxGuardedType<G[keyof G]>),
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
    G extends CtxGuardObject<any, C>,
    E,
  >(params: {
    ctx: C;
    guards: G;
    error: E;
  }) => {
    return (value: CtxGuardedArg<G[keyof G]>) => {
      const { ctx, guards, error } = params;

      const guarded = Object.keys(guards)
        .flatMap((type) =>
          guards[type](value, ctx)
            ? {
                type,
                value: new Variant(value as CtxGuardedType<G[keyof G]>),
              }
            : [],
        )
        .at(0);

      return guarded
        ? new Ok(new GuardEnumCtx<C, G>(ctx, guarded)).asResult<E>()
        : new Err(error).asResult<GuardEnumCtx<C, G>>();
    };
  };
}

export module opt {
  export const viaNullity = <T>(value: T): Option<NonNullable<T>> => {
    return value ? new Some(value).asOption() : new None().asOption();
  };

  export const via = <T>(predicate: (value: T) => boolean) => {
    return (value: T): Option<T> =>
      predicate(value) ? new Some(value).asOption() : new None().asOption();
  };
}

export module res {
  export type infer<
    T extends Result<any, any>,
    U extends "Ok" | "Err",
  > = T extends Result<infer O, infer E>
    ? {
        Ok: O;
        Err: E;
      }[U]
    : never;

  // Assertions - ways to create a result with a predetermined error

  export const assertVia = <T, E>(
    predicate: (value: T) => boolean,
    error: E,
  ) => {
    return (value: T): Result<T, E> =>
      predicate(value) ? new Ok(value).asResult() : new Err(error).asResult();
  };

  export const assertViaCtx = <U, E>(
    predicate: (ctx: U) => boolean,
    failure: E,
  ) => {
    return <T>(ctx: U, success: T): Result<T, E> =>
      predicate(ctx)
        ? new Ok(success).asResult<E>()
        : new Err(failure).asResult<T>();
  };

  export const assertViaNullity = <E>(error: E) => {
    return <T>(value: T): Result<NonNullable<T>, E> =>
      value ? new Ok(value).asResult() : new Err(error).asResult();
  };

  // Expectations - ways to create a result with a dynamic error

  export const expectVia = <T, E>(predicate: (value: T) => boolean) => {
    return (value: T, error: E): Result<T, E> =>
      predicate(value) ? new Ok(value).asResult() : new Err(error).asResult();
  };

  export const expectViaCtx = <U>(predicate: (ctx: U) => boolean) => {
    return <T, E>(
      ctx: U,
      results: { success: T; failure: E },
    ): Result<T, E> => {
      const { success, failure } = results;

      return predicate(ctx)
        ? new Ok(success).asResult<E>()
        : new Err(failure).asResult<T>();
    };
  };

  export const expectViaBoolean = expectViaCtx((b: boolean) => b);

  export const expectViaNullity = <T, E>(
    value: T,
    error: E,
  ): Result<NonNullable<T>, E> => {
    return value ? new Ok(value).asResult() : new Err(error).asResult();
  };

  export const expectViaGuard = <T, S extends T>(
    guard: (value: T) => value is S,
  ) => {
    return <E>(value: T, error: E) =>
      guard(value) ? new Ok(value).asResult<E>() : new Err(error).asResult<S>();
  };

  type ECParams<T extends any[], U, E, F> = [
    path: (...args: T) => U,
    errorParams: {
      guard: (error: unknown) => error is E;
      fallback: F;
    },
  ];

  export const errCast = <T extends any[], U, E, F>(
    ...params: ECParams<T, U, E, F>
  ) => {
    return (...args: T) => {
      const [path, { guard, fallback }] = params;

      try {
        return new Ok(path(...args)).asResult<Result<E, F>>();
      } catch (err) {
        return guard(err)
          ? new Err(new Ok(err).asResult<F>()).asResult<U>()
          : new Err(new Err(fallback).asResult<E>()).asResult<U>();
      }
    };
  };

  type AnyErrGuards = Record<string, (error: unknown) => error is any>;

  type ECPParams<T extends any[], U, E extends AnyErrGuards, F> = [
    path: (...args: T) => U,
    errorParams: {
      guards: E;
      fallback: F;
    },
  ];

  type ErrGuards<E extends AnyErrGuards> = V.PureInterface<{
    [Q in keyof E]: GuardedType<E[Q]>;
  }>;

  class PotentialError<E extends AnyErrGuards> extends RusticEnum<
    ErrGuards<E>
  > {}

  export const errCastPlus = <T extends any[], U, E extends AnyErrGuards, F>(
    ...params: ECPParams<T, U, E, F>
  ) => {
    return (...args: T) => {
      const [path, { guards, fallback }] = params;

      try {
        return new Ok(path(...args)).asResult<Result<PotentialError<E>, F>>();
      } catch (err) {
        const potErr = Object.keys(guards)
          .flatMap<Discriminate<ErrGuards<E>>>((key) =>
            guards[key](err) ? { type: key, value: err } : [],
          )
          .at(0);

        return potErr
          ? new Err(
              new Ok(new PotentialError(potErr)).asResult<F>(),
            ).asResult<U>()
          : new Err(
              new Err(fallback).asResult<PotentialError<E>>(),
            ).asResult<U>();
      }
    };
  };
}
