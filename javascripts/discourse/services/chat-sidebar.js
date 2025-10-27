import { cancel, throttle } from "@ember/runloop";
import Service, { service } from "@ember/service";
import { bind } from "discourse/lib/decorators";

const ROUTES_TO_IGNORE = ["chat."];
const ELEMENT_SELECTORS = {
  header: ".d-header .contents",
  mainOutletWrapper: "#main-outlet-wrapper",
  chatDrawer: ".chat-drawer-outlet-container .chat-drawer",
};

export const PLUGIN_ID = "chat-sidebar";

export default class ChatSidebar extends Service {
  @service router;
  @service siteSettings;
  @service chatSidebarUserPrefs;
  @service currentUser;

  elements = {};
  computedStyles = {};
  stateCallback = null;
  resizeTimer = null;
  observing = false;

  options(params = {}) {
    if (params.stateCallback) {
      this.stateCallback = params.stateCallback;
    }
  }

  observe() {
    if (this.observing) {
      return this;
    }

    window.addEventListener("resize", this._resize, {
      passive: true,
    });

    this.observing = true;

    return this;
  }

  unobserve() {
    if (!this.observing) {
      return this;
    }

    window.removeEventListener("resize", this._resize, {
      passive: true,
    });

    if (this.resizeTimer) {
      cancel(this.resizeTimer);
      this.resizeTimer = null;
    }

    this.#resetStyle();

    this.observing = false;

    return this;
  }

  get shouldEnable() {
    return this.siteSettings.chat_enabled && this.currentUser?.has_chat_enabled;
  }

  @bind
  _resize() {
    this.sidebarResizeTimer = throttle(this, this._performResize, 10);
  }

  @bind
  _performResize() {
    requestAnimationFrame(() => {
      this.checkBreakpoint();
    });
  }

  shouldIgnoreRoute(path = null) {
    let route = null;

    if (path) {
      route = this.router.recognize(path).name;
    }

    if (!route) {
      route = this.router.currentRouteName;
    }

    return (
      ROUTES_TO_IGNORE.filter((routeToIgnore) =>
        route.startsWith(routeToIgnore)
      ).length > 0
    );
  }

  addBodyClassname() {
    document.body.classList.add("chat-sidebar-active");
  }

  removeBodyClassname() {
    document.body.classList.remove("chat-sidebar-active");
  }

  get userPreferredPosition() {
    return (
      this.chatSidebarUserPrefs.preferredPosition ||
      settings.chat_sidebar_position
    );
  }

  resetPosition() {
    this.checkBreakpoint();
  }

  checkBreakpoint(path = null) {
    if (this.shouldIgnoreRoute(path)) {
      if (this.stateCallback) {
        this.stateCallback({
          isBreakpointValid: false,
          shouldIgnoreRoute: true,
        });
      }

      this.unobserve();

      return false;
    }

    const isValid = this.#validBreakpoint();

    if (this.stateCallback) {
      this.stateCallback({
        isBreakpointValid: isValid,
        shouldIgnoreRoute: false,
      });
    }

    if (isValid) {
      this.observe();
    } else {
      this.unobserve();
    }

    return isValid;
  }

  #validBreakpoint() {
    this.#fetchElements(ELEMENT_SELECTORS);

    if (
      !this.elements ||
      !this.elements.header ||
      !this.elements.mainOutletWrapper
    ) {
      return false;
    }

    const defaultChatSidebarGap =
      parseInt(this.computedStyles.mainOutletWrapper.columnGap, 10) || 30;

    const wrapPadding =
      parseInt(
        this.computedStyles.mainOutletWrapper.getPropertyValue(
          "--d-wrap-padding-h"
        ),
        10
      ) || 0;

    const chatSidebarGap = defaultChatSidebarGap - wrapPadding;
    const clientWidth = document.documentElement.clientWidth;
    const scrollbarWidth = window.innerWidth - clientWidth;

    this.#resetStyle();

    if (
      window.matchMedia(
        `(min-width: calc(${this.elements.mainOutletWrapper.offsetWidth}px + ${settings.chat_sidebar_width} + ${chatSidebarGap}px + ${scrollbarWidth}px)`
      ).matches
    ) {
      // Fixed breakpoint, make sure we don't go below.
      if (
        settings.chat_sidebar_breakpoint !== "auto" &&
        window.innerWidth < parseInt(settings.chat_sidebar_breakpoint, 10)
      ) {
        return false;
      }

      // We have room to display the chat drawer.
      if (!this.elements.chatDrawer) {
        return true;
      }

      if (
        this.userPreferredPosition === "right" ||
        this.userPreferredPosition === "left"
      ) {
        const totalWidth =
          this.elements.mainOutletWrapper.offsetWidth +
          this.elements.chatDrawer.offsetWidth +
          chatSidebarGap;

        const sideSpace = (clientWidth - totalWidth) / 2;

        if (totalWidth >= clientWidth) {
          return false;
        }

        this.elements.header.parentElement.style.maxWidth = `${totalWidth}px`;

        const direction = this.userPreferredPosition === "left" ? 1 : -1;

        const offsetToCenter =
          this.elements.mainOutletWrapper.getBoundingClientRect().left -
          sideSpace;

        if (offsetToCenter > 0) {
          this.#applyTransformX(
            this.elements.mainOutletWrapper,
            direction * offsetToCenter
          );
        }

        this.#applyTransformX(this.elements.chatDrawer, direction * sideSpace);
      } else if (
        this.userPreferredPosition === "outside-right" ||
        this.userPreferredPosition === "outside-left"
      ) {
        const contentWithSideMargin =
          this.elements.mainOutletWrapper.offsetWidth +
          parseInt(
            this.computedStyles.mainOutletWrapper[
              this.userPreferredPosition.includes("left")
                ? "marginLeft"
                : "marginRight"
            ],
            10
          );

        const availableSpace =
          clientWidth -
          parseInt(this.computedStyles.chatDrawer.width, 10) -
          chatSidebarGap;

        if (availableSpace < contentWithSideMargin) {
          const translateX = this.userPreferredPosition.includes("left")
            ? contentWithSideMargin - availableSpace
            : availableSpace - contentWithSideMargin;

          this.#applyTransformX(this.elements.mainOutletWrapper, translateX);
          this.#applyTransformX(this.elements.header, translateX);
        }
      }

      return true;
    }

    return false;
  }

  #fetchElements(selectors) {
    for (const [key, value] of Object.entries(selectors)) {
      const element = document.querySelector(value);

      // If the chat drawer is not present, we want to check if it can be displayed.
      if (!element && key !== "chatDrawer") {
        return;
      }

      this.elements[key] = element;
      this.computedStyles[key] = element ? getComputedStyle(element) : null;
    }
  }

  #applyTransformX(element, value) {
    if (element) {
      element.style.transform =
        value === "revert-layer" ? value : `translateX(${value}px)`;
    }
  }

  #resetStyle() {
    const transformReverLayerSupport = CSS.supports("transform:revert-layer");

    this.#applyTransformX(
      this.elements.mainOutletWrapper,
      transformReverLayerSupport ? "revert-layer" : 0
    );
    this.#applyTransformX(
      this.elements.header,
      transformReverLayerSupport ? "revert-layer" : 0
    );

    this.#applyTransformX(
      this.elements.chatDrawer,
      transformReverLayerSupport ? "revert-layer" : 0
    );

    if (this.elements.header?.parentElement) {
      this.elements.header.parentElement.style.maxWidth = "";
    }
  }
}
