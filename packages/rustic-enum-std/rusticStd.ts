import {
  NullVariant,
  RusticEnum,
  UnitVariant,
  Variant,
  type V
} from "rustic-enum";

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

export class Option<
  T,
  V extends V.Ext<OptionI<T>> = V.Ext<OptionI<T>>
> extends RusticEnum<OptionI<T>, V> {
  expect = (errorMessage: string) => {
    if (this.enumValue instanceof None) {
      throw new Error(errorMessage);
    } else {
      return this.enumValue.value;
    }
  };

  unwrap = () => this.expect("An error occurred when unwrapping a value!");

  unwrapOr = (value: T) => {
    if (this.enumValue instanceof None) {
      return value;
    } else {
      return this.enumValue.value;
    }
  };

  unwrapOrElse = (lambda: () => T) => {
    if (this.enumValue instanceof None) {
      return lambda();
    } else {
      return this.enumValue.value;
    }
  };

  map = <U>(lambda: (value: T) => U): Option<U> => {
    if (this.enumValue instanceof None) {
      return new Option({ type: "None", value: new None() });
    } else {
      return new Option({
        type: "Some",
        value: new Some(lambda(this.enumValue.value))
      });
    }
  };

  mapOrElse = <U>(noneLambda: () => U, someLambda: (value: Some<T>) => U) => {
    return this.match({
      Some: someLambda as Some<T> extends UnitVariant
        ? () => U
        : (value: Some<T>) => U,
      None: noneLambda
    });
  };

  okOr = <E>(error: E): Result<T, E> => {
    if (this.enumValue instanceof None) {
      return new Result({ type: "Err", value: new Err(error) });
    } else {
      return new Result({ type: "Ok", value: new Ok(this.enumValue.value) });
    }
  };

  okOrElse = <E>(errorLambda: () => E): Result<T, E> => {
    if (this.enumValue instanceof None) {
      return new Result({ type: "Err", value: new Err(errorLambda()) });
    } else {
      return new Result({ type: "Ok", value: new Ok(this.enumValue.value) });
    }
  };

  and = <U>(optionB: Option<U>): Option<U> => {
    if (this.enumValue instanceof None) {
      return new Option({ type: "None", value: new None() });
    } else {
      return optionB;
    }
  };

  andThen = <U>(lambda: (value: T) => Option<U>): Option<U> => {
    if (this.enumValue instanceof None) {
      return new Option({ type: "None", value: new None() });
    } else {
      return lambda(this.enumValue.value);
    }
  };

  filter = (predicate: (value: T) => boolean): Option<T> => {
    if (this.enumValue instanceof None) {
      return new Option({ type: "None", value: new None() });
    } else if (predicate(this.enumValue.value)) {
      return this;
    } else {
      return new Option({ type: "None", value: new None() });
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

export class Result<
  T,
  U,
  V extends V.Ext<ResultI<T, U>> = V.Ext<ResultI<T, U>>
> extends RusticEnum<ResultI<T, U>, V> {
  isOk = () => {
    if (this.enumValue instanceof Ok<T>) {
      return true;
    } else {
      return false;
    }
  };

  isOkAnd = (predicate: (value: T) => boolean) => {
    if (this.enumValue instanceof Ok<T>) {
      return predicate(this.enumValue.value);
    } else {
      return false;
    }
  };

  isErr = () => {
    if (this.enumValue instanceof Err<U>) {
      return true;
    } else {
      return false;
    }
  };

  isErrAnd = (predicate: (value: U) => boolean) => {
    if (this.enumValue instanceof Err<U>) {
      return predicate(this.enumValue.value);
    } else {
      return false;
    }
  };

  ok = (): Option<T> => {
    if (this.enumValue instanceof Ok<T>) {
      return new Option({
        type: "Some",
        value: new Some(this.enumValue.value)
      });
    } else {
      return new Option({ type: "None", value: new None() });
    }
  };

  err = (): Option<U> => {
    if (this.enumValue instanceof Err<U>) {
      return new Option({
        type: "Some",
        value: new Some(this.enumValue.value)
      });
    } else {
      return new Option({ type: "None", value: new None() });
    }
  };

  map = <V>(lambda: (value: T) => V): Result<V, U> => {
    if (this.enumValue instanceof Err<U>) {
      return new Result({ type: "Err", value: this.enumValue });
    } else {
      return new Result({
        type: "Ok",
        value: new Ok(lambda(this.enumValue.value))
      });
    }
  };
}
