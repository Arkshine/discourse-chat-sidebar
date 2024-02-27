import { cancel, throttle } from "@ember/runloop";
import { apiInitializer } from "discourse/lib/api";
import { bind } from "discourse-common/utils/decorators";
import { resetStyle, validBreakpoint } from "../lib/breakpoint";

const PLUGIN_ID = "chat-sidebar";

export default apiInitializer("1.8.0", (api) => {
  const siteSettings = api.container.lookup("service:site-settings");
  const site = api.container.lookup("service:site");

  if (!siteSettings.chat_enabled || site.mobileView) {
    return;
  }

  const currentUser = api.getCurrentUser();

  if (!currentUser || !currentUser.get("has_chat_enabled")) {
    return;
  }

  api.modifyClass("component:chat-drawer", {
    pluginId: PLUGIN_ID,

    didInsertElement() {
      this._super(...arguments);
      window.addEventListener("resize", this._chatSidebarResize, {
        passive: true,
      });
    },

    willDestroyElement() {
      this._super(...arguments);
      window.removeEventListener("resize", this._chatSidebarResize, {
        passive: true,
      });

      if (this.sidebarResizeTimer) {
        cancel(this.sidebarResizeTimer);
        this.sidebarResizeTimer = null;
      }
    },

    @bind
    _chatSidebarResize() {
      this.sidebarResizeTimer = throttle(
        this,
        this._performChatSidebarResize,
        50
      );
    },

    _performChatSidebarResize() {
      requestAnimationFrame(() => {
        if (
          site.mobileView ||
          this.router.currentRouteName.startsWith("chat")
        ) {
          return;
        }

        const isValidBreakpoint = validBreakpoint();

        if (isValidBreakpoint) {
          this.openSidebarDrawer();

          // Re-check once the chat drawer is open.
          requestAnimationFrame(() => {
            if (!validBreakpoint()) {
              this.closeSidebarDrawer();
            }
          });
        } else if (this.chatStateManager.isDrawerActive) {
          this.closeSidebarDrawer();
        }
      });
    },

    _performCheckSize() {
      this._super(...arguments);
      this._chatSidebarResize();
    },

    closeSidebarDrawer() {
      if (!this.chatStateManager.isChatSidebarActive) {
        return;
      }

      this.chatStateManager.isChatSidebarActive = false;

      // If the chat drawer was opened, we don't want to close it.
      if (this.chatStateManager.wasDrawerOpened) {
        document.body.classList.remove("chat-sidebar-active");
        return;
      }

      this.close();
    },

    openSidebarDrawer() {
      this.chatStateManager.isChatSidebarActive = true;

      // If the chat drawer was opened, we don't want to reopen it.
      if (this.chatStateManager.wasDrawerOpened) {
        document.body.classList.add("chat-sidebar-active");
        return;
      }

      this.openURL("/chat");
    },
  });

  if (settings.chat_sidebar_breakpoint === "auto") {
    api.modifyClass("controller:application", {
      pluginId: PLUGIN_ID,

      _mainOutletAnimate() {
        this._super(...arguments);

        // Checks when the sidebar is toggled and after the animation.
        requestAnimationFrame(() => {
          api.container.lookup("component:chat-drawer")._chatSidebarResize();
        });
      },
    });
  }

  api.addChatDrawerStateCallback(({ isDrawerActive }) => {
    const chatStateManager = api.container.lookup("service:chat-state-manager");

    if (isDrawerActive) {
      if (!chatStateManager.isChatSidebarActive) {
        chatStateManager.wasDrawerOpened = true;
      } else {
        document.body.classList.add("chat-sidebar-active");
      }
    } else {
      chatStateManager.wasDrawerOpened = false;
      document.body.classList.remove("chat-sidebar-active");
    }
  });

  api.onPageChange((path) => {
    const route = api.container.lookup("service:router").recognize(path);

    if (route.name.startsWith("chat.")) {
      resetStyle();
    } else {
      api.container.lookup("component:chat-drawer")._chatSidebarResize();
    }
  });
});
