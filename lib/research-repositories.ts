export type ResearchRepositorySource = {
  repository: `${string}/${string}`;
  ref: string;
};

export const researchRepositorySources = [
  {
    repository: "jfairfaxball-348/TreeStack-Structural-Certificates-for-Stacking-on-Trees",
    ref: "main",
  },
  {
    repository: "jfairfaxball-348/pascal-minus-one",
    ref: "main",
  },
  {
    repository: "jfairfaxball-348/Pascal-Extremes",
    ref: "main",
  },
  {
    repository: "jfairfaxball-348/ProbStack-Random-Stacking-on-Trees",
    ref: "main",
  },
  {
    repository: "jfairfaxball-348/Greedy-Uniformity-on-Trees",
    ref: "main",
  },
  {
    repository: "jfairfaxball-348/Pan-Disciplinary-Invariance-Conjecture",
    ref: "main",
  },
  {
    repository: "jfairfaxball-348/ellipse-theorem",
    ref: "main",
  },
  {
    repository: "jfairfaxball-348/Inverse-Zero-Sum-Research",
    ref: "main",
  },
] as const satisfies readonly ResearchRepositorySource[];
