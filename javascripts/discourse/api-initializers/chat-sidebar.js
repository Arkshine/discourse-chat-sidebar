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
    },

    @bind
    _chatSidebarResize() {
      if (site.mobileView || this.router.currentRouteName.startsWith("chat")) {
        return;
      }

      const isValidBreakpoint = validBreakpoint();

      if (isValidBreakpoint && !this.chatStateManager.isDrawerActive) {
        this.openSidebarDrawer();

        // Re-check once the chat drawer is open.
        requestAnimationFrame(() => {
          if (!validBreakpoint()) {
            this.close();
          }
        });
      } else if (!isValidBreakpoint && this.chatStateManager.isDrawerActive) {
        this.close();
      }
    },

    _performCheckSize() {
      this._super(...arguments);
      this._chatSidebarResize();
    },

    openSidebarDrawer() {
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

  api.onPageChange((path) => {
    const route = api.container.lookup("service:router").recognize(path);

    if (route.name.startsWith("chat.")) {
      resetStyle();
    } else {
      api.container.lookup("component:chat-drawer")._chatSidebarResize();
    }
  });
});
