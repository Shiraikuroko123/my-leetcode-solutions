export type CatalogSection = "catalog" | "paths" | "progress";
export type BrowseView = "all" | "featured" | "attempted" | "starred" | "solved";
export type ProgressView = "all" | "attempted" | "solved" | "starred";

export type PathStats = {
  total: number;
  solved: number;
  attempted: number;
};
