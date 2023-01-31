<script lang="ts">
  import { rollDice } from "./monsterOfTheWeek";

  let actions: string[] = ["Roll the dice", "View actions here"];
  let roll: number = 0;

  const handleClick = () => {
    const rollResult = rollDice().match({
      Failure: ({ value }) => value,
      MixedSuccess: ({ value }) => value,
      Success: ({ value }) => value,
    });

    rollDice().ifLet("Success", ({ value }) => console.log(value));

    roll = rollResult.roll;
    actions = rollResult.actions;
  };
</script>

<p>You rolled a {roll}! Here's what you should do:</p>
<ul>
  {#each actions as action}
    <li>{action}</li>
  {/each}
</ul>

<button on:click={handleClick}>Click me to roll the dice!</button>
