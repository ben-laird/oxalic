import { RusticEnum, V, Variant } from "@rustic-enum/plus";

export interface RollDetails {
  roll: number;
  actions: string[];
}

enum RollActionE {
  Failure,
  MixedSuccess,
  Success,
}

type RollActionV = V.Enum<keyof typeof RollActionE, RollDetails>;

class RollAction extends RusticEnum<RollActionV> {}

const rawRoll = (sides: number) => Math.floor(Math.random() * (sides + 1));

export const rollDice = () => {
  const roll = rawRoll(6) + rawRoll(6);

  return roll < 7
    ? new RollAction({
        type: "Failure",
        value: new Variant({
          roll,
          actions: ["Mark experience", "The GM will take a hard move"],
        }),
      })
    : roll < 10
    ? new RollAction({
        type: "MixedSuccess",
        value: new Variant({ roll, actions: ["Make a hard choice"] }),
      })
    : new RollAction({
        type: "Success",
        value: new Variant({
          roll,
          actions: ["Accomplish what you set out to do"],
        }),
      });
};

const memes = rollDice().isMaybe("Failure").expect("sss").value.roll;
