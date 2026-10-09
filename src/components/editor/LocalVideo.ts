import { Node, mergeAttributes } from "@tiptap/core";
export const LocalVideo = Node.create({
  name: "localVideo",
  group: "block",
  atom: true,
  addAttributes: () => ({
    src: { default: null },
    title: { default: "Local video" },
  }),
  parseHTML: () => [{ tag: "video[data-local-video]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "video",
    mergeAttributes(HTMLAttributes, {
      "data-local-video": "",
      controls: "",
      preload: "metadata",
      "aria-label": HTMLAttributes.title,
    }),
  ],
});
