import Service, { inject as service } from "@ember/service";
import KeyValueStore from "discourse/lib/key-value-store";

const PREFERRED_CLOSED_KEY = "preferred_closed";
const PREFERRED_CLOSED_STORE_NAMESPACE = "ark_sidebar_chat_";

export default class ChatSidebarState extends Service {
  @service router;

  _store = new KeyValueStore(PREFERRED_CLOSED_STORE_NAMESPACE);

  reset() {
    this._store.remove(PREFERRED_CLOSED_KEY);
  }

  prefersClosed() {
    this._store.setObject({ key: PREFERRED_CLOSED_KEY, value: true });
  }

  get isPreferredClosed() {
    return this._store.getObject(PREFERRED_CLOSED_KEY) === true;
  }
}
