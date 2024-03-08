import { action } from "@ember/object";
import { withPluginApi } from "discourse/lib/plugin-api";
import { PLUGIN_ID } from "../services/chat-sidebar";

export default {
  name: PLUGIN_ID,
  after: "inject-discourse-objects",

  initialize() {
    withPluginApi("1.2.0", (api) => {
      api.modifyClass("service:chat-state-manager", {
        pluginId: PLUGIN_ID,

        isChatSidebarActive: false,
        wasDrawerOpened: false,
        wasDrawerExpanded: true,
      });

      api.modifyClass("service:chat", {
        pluginId: PLUGIN_ID,

        @action
        toggleDrawer() {
          // Ignore action. Is there a better way to do this? Overwriting is not great.
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
