import { apiInitializer } from "discourse/lib/api";
import ChatSidebar from "../components/chat-sidebar";

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

  api.addChatDrawerStateCallback((data) => {
    const { isDrawerActive } = data;

    if (isDrawerActive) {
      document.body.classList.add("chat-sidebar-active");
    } else {
      document.body.classList.remove("chat-sidebar-active");
    }
  });

  api.onPageChange((url) => {
    const router = api.container.lookup("service:router");
    const route = router.recognize(url);

    if (route.name.startsWith("chat.")) {
      return;
    }

    const chatStateManager = api.container.lookup("service:chat-state-manager");

    if (chatStateManager.isDrawerActive) {
      return;
    }

    const appEvents = api.container.lookup("service:app-events");
    appEvents.trigger("sidebar-chat:toggle-drawer");
  });

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
    pluginId: "chat-drawer",

    didInsertElement() {
      this._super(...arguments);

      this.appEvents.on(
        "sidebar-chat:toggle-drawer",
        this.openSidebarDrawer.bind(this)
      );
    },

    didDestroyElement() {
      this._super(...arguments);

      this.appEvents.off(
        "sidebar-chat:toggle-drawer",
        this.openSidebarDrawer.bind(this)
      );
    },

    _performCheckSize() {
      this._super(...arguments);

      if (
        !this.chatStateManager.isDrawerActive &&
        (settings.chat_sidebar_breakpoint !== "auto" || validBreakpointAuto())
      ) {
        this.openSidebarDrawer();
      } else if (
        settings.chat_sidebar_breakpoint === "auto" &&
        !validBreakpointAuto()
      ) {
        this.close();
      }
    },

    openSidebarDrawer() {
      // Force the chat drawer to be active.
      this.chatStateManager.prefersDrawer();

      // Hides the original container.
      // Open our custom chat drawer.
      document.querySelector(".chat-drawer-outlet-container").style.display =
        "none";
      this.openURL("/chat");
    },
  });
});
