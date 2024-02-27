import { action } from "@ember/object";
import { withPluginApi } from "discourse/lib/plugin-api";

const PLUGIN_ID = "chat-sidebar";

export default {
  name: PLUGIN_ID,
  after: "inject-discourse-objects",

  initialize() {
    withPluginApi("1.2.0", (api) => {
      api.modifyClass("service:chat", {
        pluginId: PLUGIN_ID,

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
