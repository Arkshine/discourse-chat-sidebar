import { action } from "@ember/object";
import { withPluginApi } from "discourse/lib/plugin-api";

const PLUGIN_ID = "chat-sidebar";

export default {
  name: PLUGIN_ID,
  after: "inject-discourse-objects",

  initialize() {
    withPluginApi("1.2.0", (api) => {
      api.modifyClass("service:chat-state-manager", {
        pluginId: PLUGIN_ID,

        // Wether the chat sidebar is active or not
        isChatSidebarActive: false,

        // Wether the chat drawer was opened or not
        wasDrawerOpened: false,
      });

      api.modifyClass("service:chat", {
        pluginId: PLUGIN_ID,

        @action
        toggleDrawer() {
          // Ignore action. Is there a better way to do this? Overwriting is meh.
          if (this.chatStateManager.isChatSidebarActive) {
            return;
          }

          this.chatStateManager.didToggleDrawer();
          this.appEvents.trigger(
            "chat:toggle-expand",
            this.chatStateManager.isDrawerExpanded
          );
        },
      });

      // Remove the clickable class from the navbar when the chat sidebar is active
      api.addChatDrawerStateCallback(({ isDrawerActive }) => {
        if (
          isDrawerActive &&
          api.container.lookup("service:chat-state-manager").isChatSidebarActive
        ) {
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
