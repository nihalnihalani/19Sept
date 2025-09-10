export type StudioMode =
  | "create-image"
  | "edit-image"
  | "compose-image"
  | "create-video"
  | "product-gallery";

export type Model = {
  name: string;
  label: string;
};