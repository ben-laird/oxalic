import { RusticEnum, UnitVariant, V, Variant } from "@rustic-enum/core";

class Radio<E extends string, C = UnitVariant> extends RusticEnum<
  V.Enum<E, C>
> {
  typeConvert = <R extends this>(
    newType: E,
    init: (value: { type: E; value: V.Enum<E, C>[E] }) => R,
  ) => {
    const { variant } = this;

    return init({ ...variant, type: newType });
  };

  tradeIf = () => {};
}

enum SignInMethod {
  Apple,
  Google,
  IMAP,
}

interface SignInDetails {
  email: string;
  password: string;
}

class SignIn extends Radio<keyof typeof SignInMethod, SignInDetails> {}

const memes = new SignIn({
  type: "Apple",
  value: new Variant({ email: "memes@example.com", password: "WeAre#1" }),
});

const s = memes
  .typeConvert("Google", (v) => new SignIn(v))
  .typeConvert("Apple", (v) => new SignIn(v));
