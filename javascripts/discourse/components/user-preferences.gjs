import Component from "@ember/component";
import { inject as service } from "@ember/service";
import DMenu from "discourse/components/d-menu";
import icon from "discourse-common/helpers/d-icon";
import i18n from "discourse-common/helpers/i18n";
import UserPreferencesMenu from "./user-preferences-menu";

export default class UserPreferences extends Component {
  @service chatSidebarUserPrefs;
  @service chatStateManager;
  @service siteSettings;
  @service site;

  get shouldDisplay() {
    return (
      this.siteSettings.chat_enabled &&
      !this.site.mobileView &&
      this.chatStateManager.isChatSidebarActive &&
      settings.chat_sidebar_allow_user_preference
        .split("|")
        .includes("position")
    );
  }

  <template>
    {{#if this.shouldDisplay}}
      <div class="chat-sidebar__header">
        <DMenu
          @icon="d-chat"
          @title={{i18n (themePrefix "user.preference.title")}}
          class="icon btn-flat chat-sidebar__chat-icon"
        >
          <:content>
            <UserPreferencesMenu />
          </:content>
        </DMenu>
        {{icon "cog" class="chat-sidebar__cog-icon"}}
      </div>
    {{/if}}
  </template>
}
