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
  if (
    ["outside-left", "outside-right"].includes(settings.chat_sidebar_position)
  ) {
    applyTransformX(elements.mainOutlet, 0);
    applyTransformX(elements.header, 0);
  } else if (["left", "right"].includes(settings.chat_sidebar_position)) {
    elements.header.parentElement.style.maxWidth = "";

    if (settings.chat_sidebar_position === "left") {
      elements.mainOutlet.style.marginRight = "auto";
      if (elements.chatDrawer) {
        elements.chatDrawer.style.left = "revert";
      }
    } else {
      elements.mainOutlet.style.marginLeft = "auto";
      if (elements.chatDrawer) {
        elements.chatDrawer.style.right = "revert";
      }
    }
  }
}

export function validBreakpoint() {
  const selectorsList = {
    header: ".d-header .contents",
    mainOutlet: "#main-outlet-wrapper",
    chatDrawer: ".chat-drawer-outlet-container .chat-drawer",
  };

  fetchElements(selectorsList);

  if (!elements) {
    return false;
  }

  const defaultChatSidebarGap = 30;
  const chatSidebarGap = `${
    parseInt(computedStyles.mainOutlet.columnGap, 10) || defaultChatSidebarGap
  }px`;

  resetStyle(elements);

  if (
    window.matchMedia(
      `(min-width: calc(${computedStyles.mainOutlet.width} + ${settings.chat_sidebar_width} + ${chatSidebarGap})`
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
        elements.mainOutlet.offsetWidth +
        elements.chatDrawer.offsetWidth +
        parseInt(chatSidebarGap, 10);
      const spaceToDistribute = (window.innerWidth - totalWidth) / 2;

      if (totalWidth >= window.innerWidth) {
        return false;
      }

      elements.header.parentElement.style.maxWidth = `${totalWidth}px`;

      if (settings.chat_sidebar_position === "left") {
        elements.mainOutlet.style.marginRight = `${spaceToDistribute}px`;
        elements.chatDrawer.style.left = `${spaceToDistribute}px`;
      } else {
        elements.mainOutlet.style.marginLeft = `${spaceToDistribute}px`;
        elements.chatDrawer.style.right = `${spaceToDistribute}px`;
      }

      return true;
    }

    const contentWithSideMargin =
      elements.mainOutlet.offsetWidth +
      parseInt(
        computedStyles.mainOutlet[
          settings.chat_sidebar_position.includes("left")
            ? "marginLeft"
            : "marginRight"
        ],
        10
      );

    const availableSpace =
      window.innerWidth -
      parseInt(computedStyles.chatDrawer.width, 10) -
      parseInt(chatSidebarGap, 10);

    if (availableSpace < contentWithSideMargin) {
      applyTransformX(
        elements.mainOutlet,
        settings.chat_sidebar_position.includes("left")
          ? contentWithSideMargin - availableSpace
          : availableSpace - contentWithSideMargin
      );

      applyTransformX(
        elements.header,
        settings.chat_sidebar_position.includes("left")
          ? contentWithSideMargin - availableSpace
          : availableSpace - contentWithSideMargin
      );
    }

    return true;
  }

  return false;
}
