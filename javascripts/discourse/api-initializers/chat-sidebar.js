import { service } from "@ember/service";
import { dasherize } from "@ember/string";
import { apiInitializer } from "discourse/lib/api";
import DefaultChannelPicker from "../components/settings/default-channel-picker";
import UserPreferences from "../components/user-preferences";

export default apiInitializer((api) => {
  const siteSettings = api.container.lookup("service:site-settings");

  api.modifyClass(
    "component:theme-setting-editor",
    (SuperClass) =>
      class extends SuperClass {
        get resolvedComponent() {
          if (
            siteSettings.chat_enabled &&
            this.setting?.setting === "chat_sidebar_default_public_channel"
          ) {
            return DefaultChannelPicker;
          }

          return super.resolvedComponent;
        }
      }
  );

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

  if (settings.chat_sidebar_allow_user_preference) {
    api.headerIcons.add("d-chat", UserPreferences, { before: "search" });
  }

  api.modifyClass(
    "component:chat-drawer",
    (SuperClass) =>
      class extends SuperClass {
        @service chatSidebar;
        @service events;

        didInsertElement() {
          super.didInsertElement(...arguments);

          this.chatSidebar.observe().options({
            stateCallback: this.onChatSidebarState.bind(this),
          });

          this.appEvents.on("chat:toggle-close", this, this.closeSidebarDrawer);
        }

        willDestroyElement() {
          super.willDestroyElement(...arguments);

          this.chatSidebar.unobserve();

          this.appEvents.off(
            "chat:toggle-close",
            this,
            this.closeSidebarDrawer
          );
        }

        _performCheckSize() {
          super._performCheckSize(...arguments);
          this.chatSidebar.checkBreakpoint();
        }

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
        }

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
        }

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

          this.openURL(this.chatSidebar.defaultChannelURL);

          // Re-check once the chat drawer is open.
          requestAnimationFrame(() => {
            this.chatSidebar.checkBreakpoint();
          });
        }
      }
  );

  api.addChatDrawerStateCallback(({ isDrawerActive, isDrawerExpanded }) => {
    const chatStateManager = api.container.lookup("service:chat-state-manager");

    if (isDrawerActive) {
      if (!chatStateManager.isChatSidebarActive) {
        chatStateManager.wasDrawerOpened = true;
        chatStateManager.wasDrawerExpanded = isDrawerExpanded;

        // If the chat has been closed with esc key,
        // we need to re-check here since the other event is not triggered.
        requestAnimationFrame(() => {
          api.container.lookup("service:chat-sidebar").checkBreakpoint();
        });
      } else {
        chatSidebar.addBodyClassname();
      }
    } else {
      chatStateManager.wasDrawerOpened = false;
      chatStateManager.wasDrawerExpanded = false;
      chatSidebar.removeBodyClassname();
    }
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

  api.onPageChange((path) => {
    api.container.lookup("service:chat-sidebar").checkBreakpoint(path);
  });
});
