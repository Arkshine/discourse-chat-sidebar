import { tracked } from "@glimmer/tracking";
import Component from "@ember/component";
import { hash } from "@ember/helper";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import DButton from "discourse/components/d-button";
import closeOnClickOutside from "discourse/modifiers/close-on-click-outside";
import icon from "discourse-common/helpers/d-icon";
import i18n from "discourse-common/helpers/i18n";
import ComboBox from "select-kit/components/combo-box";

export default class UserPrefsHeaderIcon extends Component {
  @service chatSidebarUserPrefs;
  @service chatSidebar;
  @service chatStateManager;

  @service siteSettings;
  @service site;

  @tracked panelVisible = false;
  @tracked
  filterDropdownValue =
    this.chatSidebarUserPrefs.preferredPosition ||
    settings.chat_sidebar_position;

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

  get filterDropdownContent() {
    const settings = ["left", "right", "outside-left", "outside-right"];
    return settings.map((setting) => {
      return {
        id: setting,
        name: setting,
      };
    });
  }

  @action
  togglePanel() {
    this.panelVisible = !this.panelVisible;
  }

  @action
  onFilterDropdownChange(value) {
    this.filterDropdownValue = value;
    this.chatSidebarUserPrefs.prefersPosition(value);
    this.chatSidebar.resetPosition();
  }

  <template>
    {{#if this.shouldDisplay}}
      <li class="header-dropdown-toggle chat-prefs-icon">
        <DButton
          @icon="d-chat"
          @action={{this.togglePanel}}
          class="icon btn-flat fa-stack"
        >{{~icon "cog"~}}</DButton>

      </li>
      {{#if this.panelVisible}}
        <@panelPortal class="test">
          <div
            class="menu-panel chat-sidebar-prefs-panel"
            {{(modifier
              closeOnClickOutside
              this.togglePanel
              (hash targetSelector="#additional-panel-wrapper")
            )}}
          >
            <div class="menu-panel-header">
              <h3>{{i18n (themePrefix "user.preference.title")}}</h3>
            </div>
            <div class="menu-panel-body">
              <div
                class="control-group pref-locale"
                data-setting-name="chat-sidebar-position"
              >
                <label for="sidebar-position-selector" class="control-label">
                  {{i18n
                    (themePrefix "user.preference.option.position")
                  }}</label>
                <div class="controls">
                  <ComboBox
                    @id="sidebar-position-selector"
                    @value={{this.filterDropdownValue}}
                    @content={{this.filterDropdownContent}}
                    @onChange={{this.onFilterDropdownChange}}
                  />
                </div>
                <div class="instructions"></div>
              </div>

            </div>
          </div>
        </@panelPortal>
      {{/if}}
    {{/if}}
  </template>
}
