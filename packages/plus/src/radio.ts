import { RusticEnum, UnitVariant, V } from "@rustic-enum/core";

export class Radio<E extends string, C = UnitVariant> extends RusticEnum<
  V.Enum<E, C>
> {
  typeConvert = <R extends this>(
    newType: E,
    init: (value: { type: E; value: V.Enum<E, C>[E] }) => R
  ) => {
    const { variant } = this;

    return init({ ...variant, type: newType });
  };

  // TODO finish or decide on tradeIf
  // tradeIf = () => {};
}
