import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { hash } from "@ember/helper";
import { action } from "@ember/object";
import didInsert from "@ember/render-modifiers/modifiers/did-insert";
import { ajax } from "discourse/lib/ajax";
import { extractError } from "discourse/lib/ajax-error";
import { i18n } from "discourse-i18n";
import ComboBox from "select-kit/components/combo-box";

const PAGE_SIZE = 100;
const MAX_PAGES = 5;

let cachedChannels = null;

export default class DefaultChannelPicker extends Component {
  @tracked channels = cachedChannels;
  @tracked loaded = cachedChannels !== null;

  get value() {
    return parseInt(this.args.value, 10) || null;
  }

  get noneLabel() {
    return i18n(themePrefix("settings_ui.default_public_channel.none"));
  }

  @action
  async loadChannels() {
    if (cachedChannels) {
      return;
    }

    const channels = [];

    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const result = await ajax("/chat/api/channels", {
          data: { status: "open", limit: PAGE_SIZE, offset: page * PAGE_SIZE },
        });

        channels.push(...result.channels);

        if (result.channels.length < PAGE_SIZE) {
          break;
        }
      }
    } catch (error) {
      this.args.setValidationMessage(extractError(error));
      return;
    }

    cachedChannels = channels
      .filter((channel) => channel.chatable?.read_restricted === false)
      .map((channel) => ({
        id: channel.id,
        title: channel.unicode_title ?? channel.title,
      }));

    this.channels = cachedChannels;
    this.loaded = true;
    this.args.setValidationMessage(null);
  }

  @action
  onChange(id) {
    this.args.changeValueCallback(id ?? 0);
  }

  <template>
    <div class="chat-sidebar-default-channel" {{didInsert this.loadChannels}}>
      {{#if this.loaded}}
        <ComboBox
          @content={{this.channels}}
          @nameProperty="title"
          @onChange={{this.onChange}}
          @options={{hash
            disabled=@disabled
            filterable=true
            translatedNone=this.noneLabel
          }}
          @value={{this.value}}
          @valueProperty="id"
        />
      {{/if}}
    </div>
  </template>
}
