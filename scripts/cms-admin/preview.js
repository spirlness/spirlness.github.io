/**
 * Embedded live preview for the local Sveltia CMS.
 *
 * The Sveltia editor's default preview renders form fields, not the site. This
 * script registers a preview template per collection that embeds the real
 * page served by `next dev` in an iframe: `/blog/<slug>/`, `/projects/<id>/`,
 * or `/` for timeline updates. Saves write to the working tree, `postSave`
 * reloads the frame, and normal Next.js HMR keeps the rest in sync.
 *
 * Sveltia renders preview templates with its own bundled React 19. Rather than
 * shipping a second React copy, the `h()` helper below builds the same
 * "transitional element" objects React 19 creates, so a plain script can hand
 * React a tiny element tree. If the API or element shape ever changes, the
 * admin still works with Sveltia's built-in field preview; only this pane is
 * lost, and a warning is logged.
 */
(() => {
  "use strict";

  const cms = window.CMS;
  if (!cms || typeof cms.registerPreviewTemplate !== "function") {
    console.warn("[cms:preview] Sveltia CMS API is unavailable; live preview disabled.");
    return;
  }

  const REACT_TRANSITIONAL_ELEMENT = Symbol.for("react.transitional.element");

  /**
   * Minimal React 19 element factory: the same fields React's createElement
   * produces for host elements, without importing React.
   */
  function h(type, props, children) {
    const elementProps = { ...(props || {}) };
    if (children !== undefined) elementProps.children = children;
    return {
      $$typeof: REACT_TRANSITIONAL_ELEMENT,
      type,
      key: null,
      props: elementProps,
      _owner: null,
      _store: {},
    };
  }

  /** Preview documents currently mounted, used to reload frames after Save. */
  const liveDocuments = new Set();

  /** Read one nested value from an Immutable Map or a plain object. */
  function get(container, keys) {
    let value = container;
    for (const key of keys) {
      if (value === null || value === undefined) return undefined;
      try {
        value = typeof value.get === "function" ? value.get(key) : value[key];
      } catch {
        return undefined;
      }
    }
    return value;
  }

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  /** The dev-server page that renders this entry, or null until it can be addressed. */
  function previewPath(collection, entry) {
    if (collection === "updates") return "/";
    if (collection === "posts") {
      // The entry slug is the filename; a new entry has none until it is saved,
      // so avoid reloading a 404 frame while the author types a title.
      const slug = text(get(entry, ["slug"]));
      return slug ? `/blog/${slug}/` : null;
    }
    if (collection === "projects") {
      const id = text(get(entry, ["data", "id"])) || text(get(entry, ["slug"]));
      return id ? `/projects/${id}/` : null;
    }
    return null;
  }

  function bumpFrame(frame) {
    const base = frame.getAttribute("data-cms-preview-url");
    if (!base) return;
    const url = new URL(base, window.location.origin);
    // Cache-bust the dev-server request so the frame re-reads content from disk.
    url.searchParams.set("cms-preview", String(Date.now()));
    frame.src = `${url.pathname}${url.search}${url.hash}`;
  }

  function reloadFrames(previewDocument, target) {
    if (!previewDocument || typeof previewDocument.querySelectorAll !== "function") return;
    for (const frame of previewDocument.querySelectorAll("iframe[data-cms-preview-url]")) {
      if (!target || frame.getAttribute("data-cms-preview-url") === target) bumpFrame(frame);
    }
  }

  const BAR_STYLE = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 10px",
    backgroundColor: "#1f2937",
    color: "#f9fafb",
    fontSize: "12px",
    lineHeight: "1.4",
  };
  const HINT_STYLE = { flex: "1 1 auto", overflow: "hidden", textOverflow: "ellipsis" };
  const CONTROL_STYLE = {
    padding: "2px 10px",
    borderRadius: "4px",
    border: "1px solid #9ca3af",
    backgroundColor: "#f9fafb",
    color: "#111827",
    fontSize: "12px",
    cursor: "pointer",
    textDecoration: "none",
  };

  /**
   * Preview template component. Sveltia renders this with React; `document`
   * is the preview iframe's document, so the nested iframe loads the dev
   * server from the same origin as the admin page.
   */
  function LivePreview({ collection, entry, document: previewDocument }) {
    if (previewDocument) liveDocuments.add(previewDocument);
    const target = previewPath(collection, entry);

    const hint = target
      ? "实时站点预览（已保存内容）。保存后若未自动刷新，点「重新加载」。"
      : "先保存一次此条目，即可生成实时预览。";

    const controls = [
      h(
        "span",
        { className: "cms-live-preview__hint", style: HINT_STYLE },
        hint
      ),
    ];
    if (target) {
      controls.push(
        h(
          "button",
          {
            type: "button",
            style: CONTROL_STYLE,
            onClick: () => reloadFrames(previewDocument, target),
          },
          "重新加载"
        ),
        h(
          "a",
          {
            href: target,
            target: "_blank",
            rel: "noopener noreferrer",
            style: CONTROL_STYLE,
          },
          "在新标签页打开"
        )
      );
    }

    return h(
      "div",
      {
        className: "cms-live-preview",
        style: {
          position: "fixed",
          inset: "0",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f3f4f6",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        },
      },
      [
        h(
          "div",
          { className: "cms-live-preview__bar", style: BAR_STYLE },
          controls
        ),
        target
          ? h("iframe", {
              className: "cms-live-preview__frame",
              "data-cms-preview-url": target,
              src: target,
              title: "实时站点预览",
              style: {
                flex: "1 1 auto",
                width: "100%",
                border: "0",
                backgroundColor: "#ffffff",
              },
            })
          : null,
      ]
    );
  }

  function registerTemplate(collection) {
    try {
      cms.registerPreviewTemplate(collection, (props) =>
        LivePreview({ ...props, collection })
      );
    } catch (error) {
      console.warn(`[cms:preview] could not register the ${collection} preview:`, error);
    }
  }

  for (const collection of ["posts", "projects", "updates"]) {
    registerTemplate(collection);
  }

  if (typeof cms.registerEventListener === "function") {
    try {
      cms.registerEventListener({
        name: "preSave",
        handler: ({ entry }) => {
          if (get(entry, ["collection"]) !== "projects") return;
          const slug = get(entry, ["slug"]);
          if (get(entry, ["data", "id"]) !== slug) {
            throw new Error(`项目 ID 必须与文件名一致，请使用「${slug}」。`);
          }
        },
      });
      cms.registerEventListener({
        name: "postSave",
        handler: () => {
          // Wait for the CMS to finish writing the entry, then reload every
          // mounted preview so the dev server re-renders from disk.
          window.setTimeout(() => {
            for (const previewDocument of liveDocuments) {
              if (!previewDocument || !previewDocument.defaultView) {
                liveDocuments.delete(previewDocument);
                continue;
              }
              reloadFrames(previewDocument);
            }
          }, 300);
        },
      });
    } catch (error) {
      console.warn("[cms:preview] could not register the postSave listener:", error);
    }
  }
})();
