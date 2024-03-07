const elements = {};
const computedStyles = {};

function fetchElements(selectors) {
  for (const [key, value] of Object.entries(selectors)) {
    const element = document.querySelector(value);

    // If the chat drawer is not present, we want to check if it can be displayed.
    if (!element && key !== "chatDrawer") {
      return false;
    }

    elements[key] = element;
    computedStyles[key] = element ? getComputedStyle(element) : null;
  }

  return { elements, computedStyles };
}

function applyTransformX(element, value) {
  if (element) {
    element.style.transform = `translateX(${value}px)`;
  }
}

export function resetStyle() {
  applyTransformX(elements.mainOutletWrapper, 0);
  applyTransformX(elements.header, 0);

  if (["left", "right"].includes(settings.chat_sidebar_position)) {
    elements.header.parentElement.style.maxWidth = "";

    if (settings.chat_sidebar_position === "left") {
      if (elements.chatDrawer) {
        elements.chatDrawer.style.left = "revert";
      }
    } else {
      if (elements.chatDrawer) {
        elements.chatDrawer.style.right = "revert";
      }
    }
  }
}

export function validBreakpoint() {
  const selectorsList = {
    header: ".d-header .contents",
    mainOutletWrapper: "#main-outlet-wrapper",
    chatDrawer: ".chat-drawer-outlet-container .chat-drawer",
  };

  fetchElements(selectorsList);

  if (!elements || !elements.header || !elements.mainOutletWrapper) {
    return false;
  }

  const defaultChatSidebarGap =
    parseInt(computedStyles.mainOutletWrapper.columnGap, 10) || 30;

  const wrapPadding =
    parseInt(
      computedStyles.mainOutletWrapper.getPropertyValue("--d-wrap-padding-h"),
      10
    ) || 0;

  const chatSidebarGap = defaultChatSidebarGap - wrapPadding;
  const clientWidth = document.documentElement.clientWidth;
  const scrollbarWidth = window.innerWidth - clientWidth;

  resetStyle(elements);

  if (
    window.matchMedia(
      `(min-width: calc(${elements.mainOutletWrapper.offsetWidth}px + ${settings.chat_sidebar_width} + ${chatSidebarGap}px + ${scrollbarWidth}px)`
    ).matches
  ) {
    // We have room to display the chat drawer.
    if (!elements.chatDrawer) {
      return true;
    }

    // Fixed breakpoint, make sure we don't go below.
    if (
      settings.chat_sidebar_breakpoint !== "auto" &&
      window.innerWidth < parseInt(settings.chat_sidebar_breakpoint, 10)
    ) {
      return false;
    }

    if (
      settings.chat_sidebar_position === "right" ||
      settings.chat_sidebar_position === "left"
    ) {
      const totalWidth =
        elements.mainOutletWrapper.offsetWidth +
        elements.chatDrawer.offsetWidth +
        chatSidebarGap;

      const sideSpace = (clientWidth - totalWidth) / 2;

      if (totalWidth >= clientWidth) {
        return false;
      }

      elements.header.parentElement.style.maxWidth = `${totalWidth}px`;
      elements.chatDrawer.style[settings.chat_sidebar_position] = 0;

      const direction = settings.chat_sidebar_position === "left" ? 1 : -1;

      const offsetToCenter =
        elements.mainOutletWrapper.getBoundingClientRect().left - sideSpace;

      if (offsetToCenter > 0) {
        applyTransformX(elements.mainOutletWrapper, direction * offsetToCenter);
      }

      applyTransformX(elements.chatDrawer, direction * sideSpace);

      return true;
    }

    const contentWithSideMargin =
      elements.mainOutletWrapper.offsetWidth +
      parseInt(
        computedStyles.mainOutletWrapper[
          settings.chat_sidebar_position.includes("left")
            ? "marginLeft"
            : "marginRight"
        ],
        10
      );

    const availableSpace =
      clientWidth -
      parseInt(computedStyles.chatDrawer.width, 10) -
      chatSidebarGap;

    if (availableSpace < contentWithSideMargin) {
      const translateX = settings.chat_sidebar_position.includes("left")
        ? contentWithSideMargin - availableSpace
        : availableSpace - contentWithSideMargin;

      applyTransformX(elements.mainOutletWrapper, translateX);
      applyTransformX(elements.header, translateX);
    }

    return true;
  }

  return false;
}
