import { Err, Ok, Result } from "./enum";

declare const _struct: unique symbol;
declare const _shape: unique symbol;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataType = [any, ...any[]] | Record<string | number | symbol, any>;

interface ST<T extends DataType, N extends string> {
  readonly [_struct]: N;
  readonly [_shape]: T;
}

export type Struct<T extends DataType, N extends string> = T & ST<T, N>;

export type AnyStruct = Struct<DataType, string>;

export type ShapeOf<T extends AnyStruct> = T[typeof _shape];

export const construct = <S extends AnyStruct>(val: ShapeOf<S>): S => val as S;

export const shapeOf = <S extends AnyStruct>(val: S): ShapeOf<S> => val;

export const constructVia = <S extends AnyStruct>(params: {
  predicate: (val: ShapeOf<S>) => val is S;
  errorMessage: string;
}) => {
  const { errorMessage, predicate } = params;

  return (val: ShapeOf<S>): Result<S, Error> =>
    predicate(val)
      ? new Ok(val).asResult()
      : new Err(new Error(errorMessage)).asResult();
};
