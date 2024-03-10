import Service from "@ember/service";
import KeyValueStore from "discourse/lib/key-value-store";

const PREFERRED_POSITION_KEY = "preferred_position";
const PREFERRED_POSITION_STORE_NAMESPACE = "chat_sidebar_";

export default class ChatSidebarUserPrefs extends Service {
  _store = new KeyValueStore(PREFERRED_POSITION_STORE_NAMESPACE);

  constructor() {
    super(...arguments);

    if (this.preferredPosition !== null) {
      this.addBodyClassname(this.preferredPosition);
    }
  }

  prefersPosition(position) {
    this.removeBodyClassname(this.preferredPosition);

    this._store.set({
      key: PREFERRED_POSITION_KEY,
      value: position,
    });

    this.addBodyClassname(position);
  }

  get preferredPosition() {
    return this._store.get(PREFERRED_POSITION_KEY);
  }

  addBodyClassname(position) {
    document.body.classList.add(`chat-sidebar__${position}-position`);
  }

  removeBodyClassname(position) {
    document.body.classList.remove(`chat-sidebar__${position}-position`);
  }
}
