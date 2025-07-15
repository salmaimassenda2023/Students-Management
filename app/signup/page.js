"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/firebase-client";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
// If you are using next-auth for session management, keep this import.
// Otherwise, if Firebase Auth is the only session manager, you might not need `signIn` from `next-auth/react`.
import { signIn } from "next-auth/react";

export default function SignUpPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false); // For email/password signup
    const [googleLoading, setGoogleLoading] = useState(false); // For Google signup

    /**
     * Handles setting up the user's profile in Supabase and
     * assigning their default role via Firebase Custom Claims.
     * @param {Object} firebaseUser - The Firebase User object (from userCredential.user)
     */
    const setupUserProfileAndRole = async (firebaseUser) => {
        try {
            const res = await fetch('/api/user-profile-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: firebaseUser.uid, email: firebaseUser.email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to set up user profile and default role.");
            }

            // Force refresh token to get the newly assigned custom claims
            // This is crucial for the client-side AuthContext to pick up the role immediately.
            await firebaseUser.getIdTokenResult(true);

            return true; // Indicate success
        } catch (setupError) {
            console.error("Error in setupUserProfileAndRole:", setupError);
            throw setupError; // Re-throw to be caught by the calling function
        }
    };

    const handleEmailPasswordSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            await setupUserProfileAndRole(firebaseUser); // Call the common function

            router.push("/students_list"); // Redirect on success
        } catch (error) {
            console.error("Erreur d'inscription (Email/Password):", error);
            // Firebase Auth errors often have a 'code' and 'message'
            if (error.code && error.message) {
                setError(`Inscription échouée: ${error.message}`);
            } else {
                setError("Une erreur est survenue lors de l'inscription.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true);
        setError(null);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;

            // Call the common function to set up profile and role
            await setupUserProfileAndRole(firebaseUser);

            // If you are using next-auth, you might still want this for session management with next-auth.
            // However, with Firebase handling the primary auth, this part might be redundant
            // or need re-evaluation based on how next-auth is integrated with Firebase.
            // If next-auth is purely for session on your Next.js backend, and Firebase provides the token,
            // you might just redirect directly like the email/password flow.
            // For now, keeping it as per your original code.
            const nextAuthRes = await signIn("firebase-google", {
                idToken: await firebaseUser.getIdToken(), // Get the ID token, potentially with new claims
                redirect: false,
            });

            if (nextAuthRes?.error) {
                setError("Inscription Google échouée : " + nextAuthRes.error);
            } else if (nextAuthRes?.ok) {
                router.push("/students_list"); // Redirect to students_list after successful Google signup & setup
            } else {
                // Handle cases where nextAuthRes is not error or ok (e.g., if redirect is true by default)
                router.push("/students_list"); // Assume success and redirect
            }

        } catch (error) {
            console.error("Erreur d'inscription Google:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                setError("Opération annulée par l'utilisateur.");
            } else if (error.code && error.message) {
                setError(`Inscription Google échouée: ${error.message}`);
            } else {
                setError("Une erreur est survenue lors de l'inscription avec Google.");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            backgroundColor: "#f5f5f5"
        }}>
            <div style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                width: "100%",
                maxWidth: "400px"
            }}>
                <h1 style={{
                    textAlign: "center",
                    marginBottom: "2rem",
                    color: "#333"
                }}>
                    S'inscrire
                </h1>

                <form onSubmit={handleEmailPasswordSignUp}> {/* Updated to call the new handler */}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading || googleLoading}
                        style={{
                            width: "100%",
                            marginBottom: "1rem",
                            padding: "12px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "16px",
                            opacity: (loading || googleLoading) ? 0.6 : 1
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading || googleLoading}
                        style={{
                            width: "100%",
                            marginBottom: "1rem",
                            padding: "12px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "16px",
                            opacity: (loading || googleLoading) ? 0.6 : 1
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading || googleLoading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "16px",
                            cursor: (loading || googleLoading) ? "not-allowed" : "pointer",
                            opacity: (loading || googleLoading) ? 0.6 : 1,
                            marginBottom: "1rem"
                        }}
                    >
                        {loading ? "Inscription..." : "S'inscrire"}
                    </button>
                </form>

                <div style={{ textAlign: "center", margin: "1rem 0", color: "#666" }}>
                    ou
                </div>

                <button
                    onClick={handleGoogleSignUp}
                    disabled={loading || googleLoading}
                    style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#db4437",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "16px",
                        cursor: (loading || googleLoading) ? "not-allowed" : "pointer",
                        opacity: (loading || googleLoading) ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {googleLoading ? "Inscription..." : "S'inscrire avec Google"}
                </button>

                {error && (
                    <div style={{
                        backgroundColor: "#f8d7da",
                        color: "#721c24",
                        padding: "12px",
                        borderRadius: "4px",
                        marginTop: "1rem",
                        border: "1px solid #f5c6cb"
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                    <span style={{ color: "#666" }}>Déjà un compte ? </span>
                    <a href="/signin" style={{ color: "#007bff", textDecoration: "none" }}>
                        Se connecter
                    </a>
                </div>
            </div>
        </div>
    );
}