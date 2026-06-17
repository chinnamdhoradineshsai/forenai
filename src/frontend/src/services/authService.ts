import { supabase } from "../lib/supabase";
import { generateBase32Secret, verifyTOTP } from "../lib/totp";
import type { User } from "../types/user";

export function isMicrosoftEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];

  const microsoftDomains = [
    "outlook.com",
    "hotmail.com",
    "live.com",
    "msn.com",
    "microsoft.com",
    "office365.com",
    "passport.com",
    "passport.net",
  ];

  const isStdMs = microsoftDomains.some(
    (d) => domain === d || domain.endsWith("." + d),
  );

  const isCoDomain = /^(outlook|hotmail|live)\.(co\.[a-z]{2}|[a-z]{2})$/.test(
    domain,
  );

  return isStdMs || isCoDomain;
}

function cleanupMockDataFromLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  
  // 1. Clean up current user session if it's the mock user
  const currentUserStr = localStorage.getItem("forenai_current_user");
  if (currentUserStr) {
    try {
      const user = JSON.parse(currentUserStr);
      if (
        user.name?.toLowerCase().includes("priya") ||
        user.name?.toLowerCase().includes("sharma") ||
        user.email?.toLowerCase().includes("example") ||
        user.email?.toLowerCase() === "john.doe@outlook.com"
      ) {
        localStorage.removeItem("forenai_current_user");
      }
    } catch (e) {
      // ignore
    }
  }

  // 2. Clean up cached investigator directory
  const investigatorsStr = localStorage.getItem("forenai_investigators");
  if (investigatorsStr) {
    try {
      const list = JSON.parse(investigatorsStr);
      if (Array.isArray(list)) {
        const filtered = list.filter((inv: any) => {
          const name = (inv.name || "").toLowerCase();
          const email = (inv.email || "").toLowerCase();
          return !(
            name.includes("priya") ||
            name.includes("sharma") ||
            name.includes("john") ||
            email.includes("example") ||
            email === "john.doe@outlook.com"
          );
        });
        if (filtered.length !== list.length) {
          localStorage.setItem("forenai_investigators", JSON.stringify(filtered));
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

// Run cleanup immediately on load
cleanupMockDataFromLocalStorage();

export const authService = {
  isMicrosoftEmail,

  async login(username: string, password?: string): Promise<User> {
    const email = username.includes("@")
      ? username
      : `${username.toLowerCase().replace(/\s+/g, "")}@fsl.gov.in`;

    const pass = password || "ForenAIPass2026!"; // Default fallback for development/prototype

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      console.warn("Supabase login failed, checking fallback:", error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }

    if (!data.user)
      throw new Error("Authentication failed - User profile empty");

    return {
      id: data.user.id,
      username: data.user.email?.split("@")[0] || "investigator",
      name: data.user.user_metadata?.name || username,
      badgeNumber: data.user.user_metadata?.badgeNumber || "FSL-2024-XXXX",
      role: data.user.user_metadata?.role || "investigator",
      email: data.user.email || email,
      lastLogin: new Date().toISOString(),
      isActive: true,
    };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("Supabase logout warning:", error.message);
    }
    localStorage.removeItem("forenai_current_user");
  },

  getCurrentUser(): User | null {
    const session = localStorage.getItem("forenai_current_user");
    if (session) {
      try {
        return JSON.parse(session);
      } catch {
        return null;
      }
    }
    return null;
  },

  async getInvestigators(): Promise<any[]> {
    const { data, error } = await supabase
      .from("investigators")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn(
        "Supabase fetch investigators failed, using fallback:",
        error.message,
      );
      const stored = localStorage.getItem("forenai_investigators");
      return stored ? JSON.parse(stored) : [];
    }
    return data || [];
  },

  async addInvestigator(inv: {
    name: string;
    email: string;
    badge: string;
    dept: string;
    role: string;
    totp_secret?: string;
  }): Promise<any> {
    const secret = inv.totp_secret || generateBase32Secret(16);
    const newInv = {
      id: "inv_" + Date.now(),
      name: inv.name,
      email: inv.email,
      badge: inv.badge,
      dept: inv.dept,
      role: inv.role,
      totp_secret: secret,
    };

    const { data, error } = await supabase
      .from("investigators")
      .insert([newInv])
      .select()
      .single();

    if (error) {
      console.warn(
        "Supabase insert investigator failed, fallback to local storage:",
        error.message,
      );
      const stored = localStorage.getItem("forenai_investigators");
      const list = stored ? JSON.parse(stored) : [];
      list.push(newInv);
      localStorage.setItem("forenai_investigators", JSON.stringify(list));
      return newInv;
    }
    return data;
  },

  async validateInvestigator(
    name: string,
    email: string,
    code: string,
  ): Promise<User | null> {
    const { data, error } = await supabase
      .from("investigators")
      .select("*")
      .ilike("name", name.trim())
      .ilike("email", email.trim())
      .maybeSingle();

    if (error) {
      console.warn(
        "Supabase validate investigator failed, checking fallback:",
        error.message,
      );
    }

    if (data) {
      const secret = data.totp_secret || "KAVATIPAVANSAI23";
      const isOtpValid = await verifyTOTP(secret, code, code.length);
      if (!isOtpValid) {
        throw new Error(
          "Invalid Authenticator Code. Check your Authenticator App.",
        );
      }

      return {
        id: data.id,
        username: data.email.split("@")[0],
        name: data.name,
        badgeNumber: data.badge,
        role: data.role,
        email: data.email,
        isActive: true,
      };
    }

    const stored = localStorage.getItem("forenai_investigators");
    if (stored) {
      const list = JSON.parse(stored);
      const found = list.find(
        (i: any) =>
          i.name.toLowerCase() === name.toLowerCase() &&
          i.email.toLowerCase() === email.toLowerCase(),
      );
      if (found) {
        const secret = found.totp_secret || "KAVATIPAVANSAI23";
        const isOtpValid = await verifyTOTP(secret, code, code.length);
        if (!isOtpValid) {
          throw new Error(
            "Invalid Authenticator Code. Check your Authenticator App.",
          );
        }
        return {
          id: found.id,
          username: found.email.split("@")[0],
          name: found.name,
          badgeNumber: found.badge,
          role: found.role,
          email: found.email,
          isActive: true,
        };
      }
    }
    return null;
  },
};
