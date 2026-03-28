import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import {
  AuthenticateWithRedirectCallback,
  useAuth as useClerkAuth,
} from "@clerk/clerk-react";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/api";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { setUserFromToken } = useAuth();

  const { isLoaded, isSignedIn, getToken } = useClerkAuth();

  const [status, setStatus] = useState("Completing sign-in...");

  useEffect(() => {
    if (!isLoaded) return;

    async function finishAuth() {
      // If Clerk hasn't finished signing in yet
      if (!isSignedIn) {
        setStatus("Finishing sign-in with Clerk...");
        return;
      }

      try {
        setStatus("Syncing your StudyAI account...");

        const sessionToken = await getToken();

        if (!sessionToken) {
          throw new Error("No Clerk session token found.");
        }

        const { data } = await api.post(
          "/auth/clerk/exchange",
          {},
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          }
        );

        // Store your app auth
        localStorage.setItem("sf_token", data.token);
        localStorage.setItem("sf_user", JSON.stringify(data.user));

        setUserFromToken(data.user);

        setStatus("Welcome! Redirecting...");
        navigate("/dashboard", { replace: true });
      } catch (err) {
        console.error("Callback error:", err);

        localStorage.removeItem("sf_token");
        localStorage.removeItem("sf_user");

        setStatus("Sign-in failed. Redirecting...");

        setTimeout(() => {
          navigate("/login?error=google_failed", { replace: true });
        }, 1500);
      }
    }

    finishAuth();
  }, [isLoaded, isSignedIn, getToken, navigate, setUserFromToken]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        gap: 20,
      }}
    >
      {/* REQUIRED: handles Clerk OAuth redirect */}
      <AuthenticateWithRedirectCallback />

      {/* Logo */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(135deg, var(--gold), #c4900a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GraduationCap size={26} color="#07090f" />
      </div>

      {/* Spinner */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "var(--gold)",
          animation: "spin 0.8s linear infinite",
        }}
      />

      {/* Status text */}
      <div
        style={{
          fontFamily: "var(--ff-display)",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text)",
        }}
      >
        {status}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}