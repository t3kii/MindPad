import { create } from "zustand";
import type { ReactNode } from "react";
export type MenuItem = {
  label: string;
  action: () => void;
  disabled?: boolean;
  danger?: boolean;
};
type Modal = {
  title: string;
  description?: string;
  value?: string;
  placeholder?: string;
  confirm?: string;
  danger?: boolean;
  accept?: string;
  kind: "input" | "confirm" | "file" | "help" | "info";
  resolve: (v: string | File | boolean | null) => void;
};
type UI = {
  menu: {
    x: number;
    y: number;
    items?: MenuItem[];
    content?: ReactNode;
  } | null;
  modal: Modal | null;
  menuAt: (x: number, y: number, items: MenuItem[]) => void;
  panelAt: (x: number, y: number, content: ReactNode) => void;
  close: () => void;
  ask: (m: Omit<Modal, "resolve">) => Promise<string | File | boolean | null>;
};
export const useUI = create<UI>((set) => ({
  menu: null,
  modal: null,
  menuAt: (x, y, items) => set({ menu: { x, y, items } }),
  panelAt: (x, y, content) => set({ menu: { x, y, content } }),
  close: () => set({ menu: null }),
  ask: (m) =>
    new Promise((resolve) => set({ menu: null, modal: { ...m, resolve } })),
}));
export const promptText = async (
  title: string,
  value = "",
  description = "",
) => {
  const v = await useUI
    .getState()
    .ask({ kind: "input", title, value, description });
  return typeof v === "string" ? v : null;
};
export const confirmAction = async (title: string, description: string) =>
  (await useUI.getState().ask({
    kind: "confirm",
    title,
    description,
    danger: true,
    confirm: "Delete",
  })) === true;
export const pickFile = async (title: string, accept: string) => {
  const f = await useUI.getState().ask({ kind: "file", title, accept });
  return f instanceof File ? f : null;
};
