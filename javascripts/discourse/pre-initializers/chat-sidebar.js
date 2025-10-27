import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { withPluginApi } from "discourse/lib/plugin-api";
import { PLUGIN_ID } from "../services/chat-sidebar";

export default {
  name: PLUGIN_ID,
  after: "inject-discourse-objects",

  initialize() {
    withPluginApi((api) => {
      const chatSidebar = api.container.lookup("service:chat-sidebar");

      if (!chatSidebar.shouldEnable) {
        return;
      }

      api.modifyClass(
        "service:chat-state-manager",
        (SuperClass) =>
          class extends SuperClass {
            @tracked isChatSidebarActive = false;
            wasDrawerOpened = false;
            wasDrawerExpanded = true;
          }
      );

      api.modifyClass(
        "service:chat",
        (SuperClass) =>
          class extends SuperClass {
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
            }
          }
      );

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

      if (settings.chat_sidebar_breakpoint === "auto") {
        api.modifyClass(
          "controller:application",
          (SuperClass) =>
            class extends SuperClass {
              @service chatSidebar;

              _mainOutletAnimate() {
                super._mainOutletAnimate(...arguments);

                requestAnimationFrame(() => {
                  this.chatSidebar.checkBreakpoint();
                });
              }
            }
        );
      }
    });
  },
};
