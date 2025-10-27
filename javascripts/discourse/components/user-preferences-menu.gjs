import { tracked } from "@glimmer/tracking";
import Component from "@ember/component";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { i18n } from "discourse-i18n";
import ComboBox from "select-kit/components/combo-box";

export default class UserPreferencesMenu extends Component {
  @service chatSidebar;
  @service chatSidebarUserPrefs;

  @tracked
  filterDropdownValue =
    this.chatSidebarUserPrefs.preferredPosition ||
    settings.chat_sidebar_position;

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
  onFilterDropdownChange(value) {
    this.filterDropdownValue = value;
    this.chatSidebarUserPrefs.prefersPosition(value);
    this.chatSidebar.resetPosition();
  }

  <template>
    <div class="chat-prefs-icon">
      <header>
        <h3>{{i18n (themePrefix "user.preference.title")}}</h3>
        <p><em>{{i18n
              (themePrefix "user.preference.option.save_info")
            }}</em></p>
      </header>
      <main>
        <div class="control-group pref-locale">
          <label for="sidebar-position-selector" class="control-label">
            {{i18n (themePrefix "user.preference.option.position")}}</label>
          <div class="controls">
            <ComboBox
              @id="sidebar-position-selector"
              @value={{this.filterDropdownValue}}
              @content={{this.filterDropdownContent}}
              @onChange={{this.onFilterDropdownChange}}
            />
          </div>
        </div>
      </main>
    </div>
  </template>
}
