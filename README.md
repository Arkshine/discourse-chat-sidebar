# Discourse Chat Sidebar

This theme component aims to open automatically and display the chat like a sidebar, as long as space exists, and take advantage of the height.

Notes:

- Only for desktop
- Windows resize support
- Composer support
- Can revert to the original chat state, if it was previously opened
- The chat user's preferences are untouched

## Settings

| Name                      | Default         | Description                                                                                                                                                                                                                                                       |
| ------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chat_sidebar_breakpoint` | `auto`          | Breakpoint in px for the chat sidebar to appear.<br /> Set to <code>auto</code> to use the default sidebar and content width as a breakpoint."                                                                                                                    |
| `chat_sidebar_width`      | `400px`         | Width of the chat sidebar.                                                                                                                                                                                                                                        |
| `chat_sidebar_position`   | `outside-right` | `left`: Docked to the main content at the left (including left sidebar)<br />`right`: Docked to the main content at the right (including sidebar)<br /> `outside-left`: Docked to the window at the left<br /> `outside-right`: Docked to the window at the right |

## Screenshots

Some examples (video coming soon)
`right`
![NVIDIA_Share_LBc9vda5E3](https://github.com/Arkshine/discourse-chat-sidebar/assets/360640/67f17b43-17d1-4018-aad1-26e21184b3d2)

`outside-right`
![NVIDIA_Share_btKfu1xyT0](https://github.com/Arkshine/discourse-chat-sidebar/assets/360640/1c3541e3-c5eb-48dd-9e09-c64584b8a66a)

## TODO

- Tests
- Settings to control the original drawer actions
- Improve animation and smoothness overall (a bit crude right now)
- Can we have user's preferences?

## Dev Notes

Initially, I tried to insert the `<ChatDrawer />` component into another outlet so it would be easier to manipulate and keep it in the flow. Unfortunately, the original component can't be suppressed entirely (I'm thinking of the events). At least, I could not find a way to overwrite it.
It leaves me no choice but to follow the hard JS way at the cost of a little more CPU intensive but less intrusive (though manual resizing only happens sometimes).
Additionally, there is no friendly way to manage the chat actions.

## Credits

This is a paid request from [@alon](https://meta.discourse.org/u/alon1).
