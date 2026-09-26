# Signal Saboteurs

Signal Saboteurs is an original browser-based social-deduction game for 4–8 players. Operators restore a mysterious research station while hidden Glitches fake tasks, disrupt progress, and quietly remove players from the investigation.

## Play

[Launch the live game](https://echo-dropzone-arena.kriishna002.chatgpt.site)

## Rules

- Operators win by completing all eight station tasks or quarantining every Glitch.
- Glitches win when they equal the number of active Operators.
- Any active player can call an emergency meeting.
- Meetings end after every active player votes; a tie means nobody is quarantined.
- Quarantined players remain in the room as spectators.

## Controls

- Move with `WASD`, arrow keys, or the on-screen movement pad.
- Walk near a glowing terminal and select **Use** to complete it.
- Call **Meeting** when someone behaves suspiciously.
- Glitches receive private **Desync** and **Disrupt** actions.

## Local development

```bash
pnpm install
pnpm dev
```

Built with React, TypeScript, Vinext, Tailwind CSS, and a D1-compatible database for synchronized rooms and matches.
