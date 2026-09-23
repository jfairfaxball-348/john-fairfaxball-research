export type ResearchRepositorySource = {
  repository: `${string}/${string}`;
  ref: string;
};

export const researchRepositorySources = [
  {
    repository: "jfairfaxball-348/Fischer-Zero-Forcing-Counterexample",
    ref: "main",
  },
  {
    repository: "jfairfaxball-348/TreeStack-Structural-Certificates-for-Stacking-on-Trees",
    ref: "main",
  },
  {
    repository: "jfairfaxball-348/Petersen-Zero-Forcing",
    ref: "main",
  },
] as const satisfies readonly ResearchRepositorySource[];
