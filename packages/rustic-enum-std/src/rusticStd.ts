import { NullVariant, RusticEnum, UnitVariant, Variant } from "rustic-enum";

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
  readonly state = "Ok";

  toResult = <U>() => new Result<T, U>({ type: "Ok", value: this });
}

export class Err<T> extends Variant<T> {
  readonly state = "Err";

  toResult = <U>() => new Result<U, T>({ type: "Err", value: this });
}

type ResultI<T, U> = {
  Ok: Ok<T>;
  Err: Err<U>;
};

export class Result<T, U> extends RusticEnum<ResultI<T, U>> {
  isOk = () => {
    if (this.variant.value instanceof Ok<T>) {
      return true;
    } else {
      return false;
    }
  };

  isOkAnd = (predicate: (value: T) => boolean) => {
    if (this.variant.value instanceof Ok<T>) {
      return predicate(this.variant.value.value);
    } else {
      return false;
    }
  };

  isErr = () => {
    if (this.variant.value instanceof Err<U>) {
      return true;
    } else {
      return false;
    }
  };

  isErrAnd = (predicate: (value: U) => boolean) => {
    if (this.variant.value instanceof Err<U>) {
      return predicate(this.variant.value.value);
    } else {
      return false;
    }
  };

  ok = (): Option<T> => {
    if (this.variant.value instanceof Ok<T>) {
      return new Option({
        type: "Some",
        value: new Some(this.variant.value.value),
      });
    } else {
      return new Option<T>({ type: "None", value: new None() });
    }
  };

  err = (): Option<U> => {
    if (this.variant.value instanceof Err<U>) {
      return new Option({
        type: "Some",
        value: new Some(this.variant.value.value),
      });
    } else {
      return new Option<U>({ type: "None", value: new None() });
    }
  };

  map = <V>(lambda: (value: T) => V): Result<V, U> => {
    if (this.variant.value instanceof Err<U>) {
      return new Result<V, U>({ type: "Err", value: this.variant.value });
    } else {
      return new Result<V, U>({
        type: "Ok",
        value: new Ok(lambda(this.variant.value.value)),
      });
    }
  };
}
