# Echo Dropzone

Echo Dropzone is a browser-based 3D co-op arena game for 2–4 players. Create a squad, share the six-character room code, and clear three evolving arenas together.

## Play

[Launch the live game](https://echo-dropzone-arena.kriishna002.chatgpt.site)

## Features

- Real-time multiplayer rooms with no player login
- Three distinct 3D levels: container yard, coastal airstrip, and wildland relay
- Four unlockable blasters and three tactical perks
- Shared objectives, synchronized scores, upgrades, replay, and persistent leaderboard
- Keyboard, mouse, and touch controls
- Custom graphics quality, control size, left-handed mode, compact HUD, and reduced camera motion

## Controls

- Move: `WASD`, arrow keys, or the on-screen directional pad
- Aim: drag the arena to rotate the camera
- Fire: click/tap a glowing drone, press `Space`, or use the FIRE button

## Local development

```bash
pnpm install
pnpm dev
```

Open the local address shown in the terminal. Test multiplayer with two separate browser profiles or devices.

## Stack

Next.js-compatible Vinext app, React, TypeScript, Three.js, Tailwind CSS, and a server-backed database for rooms, matches, and scores.
