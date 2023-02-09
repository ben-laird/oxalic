import { None, RusticEnum, Some, Variant } from "@rustic-enum/core";

export class Duo<A, B> extends RusticEnum<{
  A: Variant<A>;
  B: Variant<B>;
}> {
  isA = () => this.is("A");

  isAAnd = (predicate: (value: Variant<A>) => boolean) =>
    this.isAnd("A", predicate);

  isB = () => this.is("B");

  isBAnd = (predicate: (value: Variant<B>) => boolean) =>
    this.isAnd("B", predicate);

  a = () => {
    const { variant } = this;

    if (variant.type === "A") {
      const { value } = variant.value;
      return new Some(value).asOption();
    } else return new None().asOption<A>();
  };

  aVariant = () => {
    const { variant } = this;

    if (variant.type === "A") {
      const { value } = variant;
      return new Some(value).asOption();
    } else return new None().asOption<Variant<A>>();
  };

  b = () => {
    const { variant } = this;

    if (variant.type === "B") {
      const { value } = variant.value;
      return new Some(value).asOption();
    } else return new None().asOption<B>();
  };

  bVariant = () => {
    const { variant } = this;

    if (variant.type === "B") {
      const { value } = variant;
      return new Some(value).asOption();
    } else return new None().asOption<Variant<B>>();
  };
}

export module duo {
  export const splitViaCtx = <U>(predicate: (input: U) => boolean) => {
    return <T, F>(ctx: U, results: { ifTrue: T; ifFalse: F }): Duo<T, F> => {
      const { ifTrue, ifFalse } = results;

      return predicate(ctx)
        ? new Duo<T, F>({
            type: "A",
            value: new Variant(ifTrue),
          })
        : new Duo<T, F>({
            type: "B",
            value: new Variant(ifFalse),
          });
    };
  };

  export const splitViaBoolean = splitViaCtx((b: boolean) => b);

  export const splitViaNullity = <T, F>(
    value: T,
    backup: F,
  ): Duo<NonNullable<T>, F> => {
    return value
      ? new Duo<NonNullable<T>, F>({
          type: "A",
          value: new Variant(value),
        })
      : new Duo<NonNullable<T>, F>({
          type: "B",
          value: new Variant(backup),
        });
  };

  export type infer<
    T extends Duo<any, any>,
    C extends "A" | "B",
  > = T extends Duo<infer A, infer B> ? { A: A; B: B }[C] : never;
}
