import { action } from "@ember/object";
import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "chat-plugin-api2",
  after: "inject-discourse-objects",

  initialize() {
    withPluginApi("1.2.0", (api) => {
      api.modifyClass("service:chat", {
        pluginId: "chat-sidebar",

        @action
        toggleDrawer() {
          // Ignore action. Is there a better way to do this?
        },
      });

      api.addChatDrawerStateCallback(({ isDrawerActive }) => {
        if (isDrawerActive) {
          requestAnimationFrame(() => {
            document
              .querySelector(".c-navbar-container")
              ?.classList.remove("-clickable");
          });
        }
      });
    });
  },
};
