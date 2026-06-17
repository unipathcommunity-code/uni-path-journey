import { useOrganization } from "@/hooks/useOrganization";

/**
 * Universal terminology layer.
 * Lets the same UI serve a tutoring center, a private school or a university
 * by remapping a small set of nouns based on `organizations.org_type`.
 *
 *  center   → "Guruh", "O'quvchi", "Markaz"     (default)
 *  school   → "Sinf",  "O'quvchi", "Maktab"
 *  academy  → "Kurs",  "Talaba",  "Akademiya"
 *  tutor    → "Dars",  "O'quvchi", "Ustozxona"
 */

export type OrgType = "center" | "school" | "academy" | "tutor" | "consulting";

export interface OrgTerms {
  type: OrgType;
  /** What we call a learning cohort (group / class / course) */
  group: string;
  groupPlural: string;
  /** What we call a learner */
  student: string;
  studentPlural: string;
  /** What we call the institution itself */
  institution: string;
  /** Branch / campus label */
  branch: string;
  branchPlural: string;
  /** Owner-facing role label */
  ownerLabel: string;
  /** Whether to show daily timetable in headline (school style) */
  showDailyTimetable: boolean;
  /** Whether finance/payments is a primary navigation pillar */
  paymentsPrimary: boolean;
}

const TERMS: Record<OrgType, OrgTerms> = {
  center: {
    type: "center",
    group: "Guruh",
    groupPlural: "Guruhlar",
    student: "O'quvchi",
    studentPlural: "O'quvchilar",
    institution: "O'quv markaz",
    branch: "Filial",
    branchPlural: "Filiallar",
    ownerLabel: "Markaz egasi",
    showDailyTimetable: false,
    paymentsPrimary: true,
  },
  school: {
    type: "school",
    group: "Sinf",
    groupPlural: "Sinflar",
    student: "O'quvchi",
    studentPlural: "O'quvchilar",
    institution: "Maktab",
    branch: "Bino",
    branchPlural: "Binolar",
    ownerLabel: "Direktor",
    showDailyTimetable: true,
    paymentsPrimary: false,
  },
  academy: {
    type: "academy",
    group: "Kurs",
    groupPlural: "Kurslar",
    student: "Talaba",
    studentPlural: "Talabalar",
    institution: "Akademiya",
    branch: "Fakultet",
    branchPlural: "Fakultetlar",
    ownerLabel: "Rektor",
    showDailyTimetable: true,
    paymentsPrimary: true,
  },
  tutor: {
    type: "tutor",
    group: "Dars",
    groupPlural: "Darslar",
    student: "O'quvchi",
    studentPlural: "O'quvchilar",
    institution: "Ustozxona",
    branch: "Joy",
    branchPlural: "Joylar",
    ownerLabel: "Ustoz",
    showDailyTimetable: false,
    paymentsPrimary: true,
  },
  consulting: {
    type: "consulting",
    group: "Loyiha",
    groupPlural: "Loyihalar",
    student: "Mijoz",
    studentPlural: "Mijozlar",
    institution: "Konsalting firma",
    branch: "Ofis",
    branchPlural: "Ofislar",
    ownerLabel: "Direktor",
    showDailyTimetable: false,
    paymentsPrimary: true,
  },
};

export const useOrgTerminology = (): OrgTerms => {
  const { org } = useOrganization();
  const type = ((org as any)?.org_type || "center") as OrgType;
  return TERMS[type] || TERMS.center;
};
