import { Creator, RusticEnum, V, Variant } from "rustic-enum";

interface RollDetails {
  roll: number;
  actions: string[];
}

type RollActionV = V.Interface<{
  Failure: RollDetails;
  MixedSuccess: RollDetails;
  Success: RollDetails;
}>;

class RollAction<
  V extends V.Ext<RollActionV> = V.Ext<RollActionV>
> extends RusticEnum<RollActionV, V> {
  static new: Creator.Standard<RollAction> = (type, value) =>
    new RollAction({ type, value });
}

const rawRoll = (sides: number) => Math.floor(Math.random() * (sides + 1));

export const rollDice = (): RollAction => {
  const roll = rawRoll(6) + rawRoll(6);

  return roll < 7
    ? new RollAction({
        type: "Failure",
        value: new Variant({
          roll,
          actions: ["Mark experience", "The GM will take a hard move"]
        })
      })
    : roll < 10
    ? new RollAction({
        type: "MixedSuccess",
        value: new Variant({ roll, actions: ["Make a hard choice"] })
      })
    : new RollAction({
        type: "Success",
        value: new Variant({
          roll,
          actions: ["Accomplish what you set out to do"]
        })
      });
};
