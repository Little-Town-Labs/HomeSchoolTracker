export interface Profile {
  id: string;
  email: string;
  role: "guardian" | "student" | "admin";
  name?: string;
  status: "active" | "suspended" | "pending" | "deactivated";
  subscription_exempt?: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  profile: Profile;
}

export interface School {
  name: string;
  address: string;
  phone: string;
  id: string;
  created_at: string;
}

export interface StudentInfo {
  id: string;
  name: string;
  birthDate: string;
  graduationDate: string;
}

export interface Course {
  id: string;
  name: string;
  gradeLevel: 9 | 10 | 11 | 12;
  academicYear: string;
  semester: "Fall" | "Spring";
  creditHours: number;
  grade: string;
  category?: string; // Added field
  standardCourseId?: string; // Reference to standard course
}

export interface TranscriptMeta {
  issueDate: string;
  administrator: string;
}

export interface TestScore {
  id: string;
  type: "ACT" | "SAT";
  date: string;
  scores: {
    total: number;
    sections: {
      name: string;
      score: number;
    }[];
  };
}

export interface StudentGuardian {
  id: string;
  student_id: string;
  guardian_id: string;
  is_primary: boolean;
  created_at: string;
  guardian?: Profile;
}

export interface StandardCourse {
  id: string;
  name: string;
  category: string;
  isSemester: boolean;
  source: string;
  recommendedGradeLevels?: number[];
  popularityScore?: number;
  userId?: string | null;
  created_at: string;
}

export interface StudentData {
  id: string;
  student_id: string;
  name: string;
  birth_date: string;
  graduation_date: string;
}

export interface Student {
  school: School;
  info: StudentInfo;
  courses: Course[];
  testScores: TestScore[];
  transcriptMeta: TranscriptMeta;
  guardians?: Profile[];
}

export interface Invitation {
  id: string;
  email: string;
  role: "guardian" | "student";
  student_id: string;
  inviter_id: string;
  token: string;
  status: "pending" | "accepted" | "expired";
  created_at: string;
  expires_at: string;
  student?: StudentInfo;
  inviter?: Profile;
}

// Generic component props including className and children
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Represents a user's subscription details
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  paypal_subscription_id: string;
  status: "active" | "cancelled" | "expired" | "pending" | "trial";
  start_date: string; // ISO 8601 date string
  end_date?: string | null; // ISO 8601 date string
  trial_end_date?: string | null; // ISO 8601 date string
  created_at: string; // ISO 8601 date string
  updated_at?: string | null; // ISO 8601 date string
  // Optional: Add related plan or user profile data if needed later
  // plan?: SubscriptionPlan;
  // user?: Profile;
}

// Represents a subscription plan
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  paypal_plan_id: string;
  created_at: string; // ISO 8601 date string
  updated_at?: string | null; // ISO 8601 date string
}

// Represents a user activity log entry
export interface UserActivity {
  id: string;
  user_id: string;
  actor_id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  actor?: {
    id: string;
    email: string;
    name?: string;
  };
}
