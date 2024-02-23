import { next } from "@ember/runloop";
import { inject as service } from "@ember/service";
import { apiInitializer } from "discourse/lib/api";
import ChatSidebar from "../components/chat-sidebar";

const PLUGIN_ID = "chat-sidebar";

export default apiInitializer("1.8.0", (api) => {
  const siteSettings = api.container.lookup("service:site-settings");
  const site = api.container.lookup("service:site");

  if (!siteSettings.chat_enabled || site.mobileView) {
    return;
  }

  if (!["left", "right"].includes(settings.chat_sidebar_position)) {
    return;
  }

  api.renderInOutlet("after-main-outlet", ChatSidebar);

  function validBreakpointAuto() {
    const application = api.container.lookup("controller:application");

    const bodyComputedStyle = getComputedStyle(document.body);
    const dMaxWidth = bodyComputedStyle.getPropertyValue("--d-max-width");
    const dSidebarWidth = application.showSidebar
      ? bodyComputedStyle.getPropertyValue("--d-sidebar-width")
      : "0px";
    const chatSidebarWidth = settings.chat_sidebar_width;

    const media_query = window.matchMedia(
      `(min-width: calc(${dMaxWidth} + ${dSidebarWidth} + ${chatSidebarWidth} ))`
    );

    return media_query.matches;
  }

  api.modifyClass("component:chat-drawer", {
    pluginId: PLUGIN_ID,

    chatSidebarState: service(),

    _performCheckSize() {
      this._super(...arguments);

      if (
        !this.chatStateManager.isDrawerActive &&
        (settings.chat_sidebar_breakpoint !== "auto" || validBreakpointAuto())
      ) {
        this.openSidebarDrawer();
      } else if (
        this.chatStateManager.isDrawerActive &&
        settings.chat_sidebar_breakpoint === "auto" &&
        !validBreakpointAuto()
      ) {
        this.close();
      }
    },

    openSidebarDrawer() {
      // Hides the original container and deletes its content.
      const originalContainer = document.querySelector(
        ".chat-drawer-outlet-container"
      );
      originalContainer.style.display = "none";

      next(() => {
        originalContainer.querySelector(".chat-drawer")?.remove();
      });

      if (
        (!settings.chat_sidebar_hide_close_button &&
          this.chatSidebarState.isPreferredClosed) ||
        (!settings.chat_sidebar_hide_fullscreen_button &&
          !settings.chat_sidebar_ignore_fullscreen_user_preference &&
          this.chatStateManager.isFullPagePreferred)
      ) {
        return;
      }

      if (
        !settings.chat_sidebar_hide_close_button &&
        this.chatSidebarState.isPreferredClosed
      ) {
        this.chatSidebarState.reset();
      }

      // Forces to open our chat drawer.
      this.openURL("/chat");
    },
  });
});
