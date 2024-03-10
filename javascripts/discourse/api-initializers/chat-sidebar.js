import { inject as service } from "@ember/service";
import { dasherize } from "@ember/string";
import { apiInitializer } from "discourse/lib/api";
import { withPluginApi } from "discourse/lib/plugin-api";
import UserPrefsHeaderIcon from "../components/user-prefs-header-icon";
import { PLUGIN_ID } from "../services/chat-sidebar";

export default apiInitializer("1.8.0", (api) => {
  const chatSidebar = api.container.lookup("service:chat-sidebar");

  if (!chatSidebar.shouldEnable) {
    return;
  }

  // Gets the user's current theme.
  const currentTheme = api.getCurrentUser().site.user_themes.find((userTheme) =>
    Array.from(document.querySelectorAll("link[data-theme-id]"))
      .map((link) => parseInt(link.getAttribute("data-theme-id"), 10))
      .includes(userTheme.theme_id)
  );

  if (currentTheme) {
    // Not the most reliable way. Theme name can be changed.
    // Since it's an optional setting, it's fine.
    document.body.classList.add(
      `theme__${dasherize(currentTheme.name.trim())
        .replace(/-theme$/, "")
        .replace(/'/, "")}`
    );
  }

  withPluginApi("1.29.0", () => {
    if (settings.chat_sidebar_allow_user_preference) {
      api.headerIcons.add("d-chat", UserPrefsHeaderIcon, { before: "search" });
    }
  });

  api.modifyClass("component:chat-drawer", {
    pluginId: PLUGIN_ID,

    chatSidebar: service(),

    didInsertElement() {
      this._super(...arguments);

      this.chatSidebar.observe().options({
        stateCallback: this.onChatSidebarState.bind(this),
      });
    },

    willDestroyElement() {
      this._super(...arguments);
      this.chatSidebar.unobserve();
    },

    _performCheckSize() {
      this._super(...arguments);
      this.chatSidebar.checkBreakpoint();
    },

    onChatSidebarState({ isBreakpointValid, shouldIgnoreRoute }) {
      if (isBreakpointValid) {
        if (!this.chatStateManager.isChatSidebarActive) {
          this.openSidebarDrawer();
        }
      } else if (
        (this.chatStateManager.isDrawerActive &&
          this.chatStateManager.isChatSidebarActive) ||
        shouldIgnoreRoute
      ) {
        this.closeSidebarDrawer();
      }
    },

    closeSidebarDrawer() {
      this.chatStateManager.isChatSidebarActive = false;

      // If the chat drawer was opened, we don't want to close it.
      if (this.chatStateManager.wasDrawerOpened) {
        this.chatStateManager.isDrawerExpanded =
          this.chatStateManager.wasDrawerExpanded;
        this.chatSidebar.removeBodyClassname();
        return;
      }

      this.close();
    },

    openSidebarDrawer() {
      this.chatStateManager.isChatSidebarActive = true;

      // If the chat drawer was opened, we don't want to reopen it.
      if (this.chatStateManager.wasDrawerOpened) {
        this.chatStateManager.isDrawerExpanded = true;
        this.chatSidebar.addBodyClassname();
        return;
      }

      if (this.chatStateManager.isDrawerActive) {
        return;
      }

      this.openURL("/chat");

      // Re-check once the chat drawer is open.
      requestAnimationFrame(() => {
        this.chatSidebar.checkBreakpoint();
      });
    },
  });

  if (settings.chat_sidebar_breakpoint === "auto") {
    api.modifyClass("controller:application", {
      pluginId: PLUGIN_ID,

      _mainOutletAnimate() {
        this._super(...arguments);

        requestAnimationFrame(() => {
          api.container.lookup("service:chat-sidebar").checkBreakpoint();
        });
      },
    });
  }

  api.addChatDrawerStateCallback(({ isDrawerActive, isDrawerExpanded }) => {
    const chatStateManager = api.container.lookup("service:chat-state-manager");

    if (isDrawerActive) {
      if (!chatStateManager.isChatSidebarActive) {
        chatStateManager.wasDrawerOpened = true;
        chatStateManager.wasDrawerExpanded = isDrawerExpanded;
      } else {
        chatSidebar.addBodyClassname();
      }
    } else {
      chatStateManager.wasDrawerOpened = false;
      chatStateManager.wasDrawerExpanded = false;
      chatSidebar.removeBodyClassname();
    }
  });

  api.onPageChange((path) => {
    api.container.lookup("service:chat-sidebar").checkBreakpoint(path);
  });
});
