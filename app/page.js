"use client";

import { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
    createStudent,
    fetchStudents,
    updateStudent,
    deleteStudent,
} from "@/api/students";

export default function Home() {
    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        gender: "Homme",
    });
    const [editId, setEditId] = useState(null); // null = ajout ; sinon update

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const data = await fetchStudents();
                setStudents(data);
            } catch (err) {
                console.error("Erreur chargement étudiants", err.message);
            }
        };
        loadStudents();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone_number) return;

        try {
            if (editId) {
                const updated = await updateStudent(editId, formData);
                setStudents((prev) =>
                    prev.map((s) => (s.id === editId ? updated : s))
                );
                setEditId(null);
            } else {
                const newStudent = await createStudent(formData);
                setStudents((prev) => [...prev, newStudent]);
            }
            setFormData({ name: "", email: "", phone_number: "", gender: "Homme" });
        } catch (err) {
            console.error("Erreur lors de l'ajout/modification :", err.message);
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
        try {
            await deleteStudent(id);
            setStudents((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            console.error("Erreur suppression :", err.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-start p-8 gap-12 bg-gray-50 dark:bg-gray-900 text-black dark:text-white">
            <h1 className="text-3xl font-bold">
                {editId ? "Modifier un étudiant" : "Ajouter un étudiant"}
            </h1>

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
