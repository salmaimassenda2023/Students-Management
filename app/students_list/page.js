"use client";

import { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function StudentsPage() { // Renamed from Home for clarity
    const router = useRouter();

    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        gender: "Homme",
    });
    const [editId, setEditId] = useState(null);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [idToken, setIdToken] = useState(null); // State to hold the Firebase ID token

    // Function to get the token from localStorage
    const getAuthToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('firebaseIdToken');
        }
        return null;
    };

    // Initial check for token and redirection
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.push('/signin'); // No token found, redirect to sign-in
        } else {
            setIdToken(token); // Token found, set it in state
            setIsLoadingPage(false); // Ready to load data
        }
    }, [router]);

    // Load students ONLY if idToken is available
    useEffect(() => {
        const loadStudents = async () => {
            if (!idToken) return; // Wait for token to be set

            try {
                const res = await fetch("/api/students", {
                    headers: {
                        'Authorization': `Bearer ${idToken}`, // Include the token in headers
                    },
                });
                if (res.status === 401 || res.status === 403) {
                    // Token expired or invalid, redirect to login and clear token
                    console.warn("Session expired or unauthorized. Redirecting to signin.");
                    localStorage.removeItem('firebaseIdToken');
                    router.push("/signin");
                    return;
                }
                if (!res.ok) throw new Error("Erreur chargement étudiants: " + res.statusText);
                const data = await res.json();
                setStudents(data);
            } catch (err) {
                console.error("Failed to load students:", err.message);
                // Consider redirecting here as well if it's a critical network error
            }
        };

        if (idToken) { // Only fetch if we have an ID token
            loadStudents();
        }
    }, [idToken, router]); // Re-run when idToken or router changes

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone_number || !idToken) return;

        try {
            const method = editId ? "PUT" : "POST";
            const url = editId ? `/api/students/${editId}` : "/api/students";

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${idToken}`, // Include the token
                },
                body: JSON.stringify(formData),
            });

            if (res.status === 401 || res.status === 403) {
                console.warn("Session expired or unauthorized for action. Redirecting to signin.");
                localStorage.removeItem('firebaseIdToken');
                router.push("/signin");
                return;
            }
            if (!res.ok) throw new Error(`Erreur ${editId ? "mise à jour" : "ajout"}: ${res.statusText}`);

            const resultData = await res.json();
            if (editId) {
                setStudents((prev) =>
                    prev.map((s) => (s.id === editId ? resultData : s))
                );
                setEditId(null);
            } else {
                setStudents((prev) => [...prev, resultData]);
            }
            setFormData({ name: "", email: "", phone_number: "", gender: "Homme" });
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleEdit = (student) => {
        setEditId(student.id);
        setFormData({
            name: student.name,
            email: student.email,
            phone_number: student.phone_number,
            gender: student.gender,
        });
    };

    const handleDelete = async (id) => {
        if (!idToken) return; // Ensure token exists

        try {
            const res = await fetch(`/api/students/${id}`, {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${idToken}`, // Include the token
                },
            });
            if (res.status === 401 || res.status === 403) {
                console.warn("Session expired or unauthorized for delete. Redirecting to signin.");
                localStorage.removeItem('firebaseIdToken');
                router.push("/signin");
                return;
            }
            if (!res.ok) throw new Error("Erreur suppression: " + res.statusText);
            setStudents((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('firebaseIdToken'); // Clear the token
        }
        router.push('/signin'); // Redirect to login page
    };

    // Show loading state if token is not yet checked, or data is being loaded for the first time
    if (isLoadingPage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
                <p className="text-xl font-semibold">Vérification de la session...</p>
            </div>
        );
    }

    // If idToken is null (meaning not authenticated after initial check and not in loading state),
    // we are in the process of redirecting. Render nothing.
    if (!idToken) {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-start p-8 gap-12 bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
            <div className="w-full flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">
                    {editId ? "Modifier un étudiant" : "Ajouter un étudiant"}
                </h1>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                >
                    Déconnexion
                </button>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4">
                <input
                    type="text"
                    name="name"
                    placeholder="Nom"
                    className="border rounded px-4 py-2 text-black"
                    value={formData.name}
                    onChange={handleChange}
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    className="border rounded px-4 py-2 text-black"
                    value={formData.email}
                    onChange={handleChange}
                />
                <input
                    type="tel"
                    name="phone_number"
                    placeholder="Numéro de téléphone"
                    className="border rounded px-4 py-2 text-black"
                    value={formData.phone_number}
                    onChange={handleChange}
                />
                <select
                    name="gender"
                    className="border rounded px-4 py-2 text-black"
                    value={formData.gender}
                    onChange={handleChange}
                >
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                </select>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                >
                    {editId ? "Mettre à jour" : "Ajouter"}
                </button>
            </form>

            <div className="w-full max-w-4xl">
                <h2 className="text-xl font-semibold mb-4">Liste des étudiants</h2>
                {students.length === 0 ? (
                    <p>Aucun étudiant ajouté.</p>
                ) : (
                    <table className="w-full table-auto border-collapse border border-gray-300 dark:border-gray-700">
                        <thead className="bg-gray-200 dark:bg-gray-800">
                        <tr>
                            <th className="border px-4 py-2">Nom</th>
                            <th className="border px-4 py-2">Email</th>
                            <th className="border px-4 py-2">Téléphone</th>
                            <th className="border px-4 py-2">Genre</th>
                            <th className="border px-4 py-2">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {students.map((student) => (
                            <tr key={student.id}>
                                <td className="border px-4 py-2">{student.name}</td>
                                <td className="border px-4 py-2">{student.email}</td>
                                <td className="border px-4 py-2">{student.phone_number}</td>
                                <td className="border px-4 py-2">{student.gender}</td>
                                <td className="border px-4 py-2 text-center space-x-2">
                                    <button
                                        onClick={() => handleEdit(student)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(student.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}