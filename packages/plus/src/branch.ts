import {
  Discriminate,
  Err,
  Ok,
  Result,
  RusticEnum,
  Variant,
} from "@rustic-enum/core";
import { res } from "./rusticPlus";

export module branch {
  export type Object<T, E> = Record<string, (value: T) => Result<any, E>>;

  export type Any = Object<any, any>;

  export type VariantObject<B extends Any> = {
    [K in keyof B]: Variant<res.infer<ReturnType<B[K]>, "Ok">>;
  };

  export type infer<B extends Any> = B extends Object<infer U, any> ? U : never;

  export const via = <T, E, B extends branch.Object<T, E>>(params: {
    value: T;
    error: E;
    branches: B;
  }): Result<Branch<B>, E> => {
    const { value, error, branches } = params;

    const branched = Object.keys(branches)
      .flatMap<Discriminate<branch.VariantObject<B>>>((type) => {
        const result = branches[type](value);

        return result.isOk()
          ? {
              type,
              value: new Variant(
                result.ok().expect("Result should have been Ok"),
              ),
            }
          : [];
      })
      .at(0);

    return branched
      ? new Ok(new Branch(branched)).asResult<E>()
      : new Err(error).asResult<Branch<B>>();
  };

  export const viaFactory = <E, B extends Object<any, E>>(params: {
    branches: B;
    error: E;
  }) => {
    const { branches, error } = params;

    return (value: branch.infer<B>): Result<Branch<B>, E> => {
      const branched = Object.keys(branches)
        .flatMap<Discriminate<VariantObject<B>>>((type) => {
          const result = branches[type](value);

          return result.isOk()
            ? {
                type,
                value: new Variant(
                  result.ok().expect("Result should have been Ok"),
                ),
              }
            : [];
        })
        .at(0);

      return branched
        ? new Ok(new Branch<B>(branched)).asResult<E>()
        : new Err(error).asResult<Branch<B>>();
    };
  };
}

class Branch<B extends branch.Any> extends RusticEnum<
  branch.VariantObject<B>
> {}