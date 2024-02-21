import Component from "@glimmer/component";
import { inject as service } from "@ember/service";

export default class SearchBanner extends Component {
  @service siteSettings;
  @service site;

  get shouldDisplay() {
    return this.siteSettings.chat_enabled && !this.site.mobileView;
  }

  get classNames() {
    return "docked__" + settings.chat_sidebar_position;
  }
}
