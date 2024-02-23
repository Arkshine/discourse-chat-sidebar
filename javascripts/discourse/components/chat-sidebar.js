import Component from "@glimmer/component";
import { inject as service } from "@ember/service";

export default class SearchBanner extends Component {
  @service siteSettings;
  @service site;
  @service router;

  get shouldDisplay() {
    return (
      this.siteSettings.chat_enabled &&
      !this.site.mobileView &&
      !this.router.currentRoute.name.startsWith("chat.")
    );
  }

  get classNames() {
    return "docked__" + settings.chat_sidebar_position;
  }
}
