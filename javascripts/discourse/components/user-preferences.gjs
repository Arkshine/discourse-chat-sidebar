import Component from "@ember/component";
import { service } from "@ember/service";
import DMenu from "discourse/components/d-menu";
import icon from "discourse/helpers/d-icon";
import { i18n } from "discourse-i18n";
import UserPreferencesMenu from "./user-preferences-menu";

export default class UserPreferences extends Component {
  @service chatStateManager;
  @service chatSidebar;

  get shouldDisplay() {
    return (
      this.chatSidebar.shouldEnable &&
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
        {{icon "gear" class="chat-sidebar__gear-icon"}}
      </div>
    {{/if}}
  </template>
}
