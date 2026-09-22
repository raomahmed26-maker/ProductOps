export type BrainCitation = {
  kind: "document" | "note" | "experiment" | "stage" | "qa" | "metric" | "submission" | "brief" | "product";
  title: string;
  href?: string;
  detail?: string;
};
