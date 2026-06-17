export interface Case {
  id: string;
  caseNumber: string;
  name: string;
  description: string;
  investigator: string;
  status: string;
  createdTimestamp: bigint;
}

export interface CaseInput {
  caseNumber: string;
  name: string;
  description: string;
  investigator: string;
}
