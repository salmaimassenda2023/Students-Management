import { NextResponse } from 'next/server';
import { protectApi } from '@/utils/middleware'; // Import the new protectApi
import prisma from "@/utils/prisma";



export const PUT = protectApi([])(async (req, context) => {
    try {
        const { id } = context.params; // <-- FIX: Access id from context.params
        const body = await req.json(); // <-- FIX: Await req.json()
        const { name, email, phone_number, gender } = body; // Destructure updated fields

        const updatedStudent = await prisma.student.update({
            where: { id: Number(id) }, // Assuming id is Int. Recheck your schema!
            data: { // <-- FIX: Add the data object for update
                name,
                email,
                phone_number,
                gender,
            },
        });
        return NextResponse.json(updatedStudent);
    } catch (error) {
        console.error("Error updating student:", error);
        // Provide more specific error message in production, but log full error for dev
        return NextResponse.json({ message: "Failed to update student." }, { status: 500 });
    }
});

export const DELETE = protectApi([])(async (req, context) => { // <-- Corrected: Pass [] for roles
    // context.params.id will give you the [id] from the URL
    // context.user will contain the decoded Firebase token
    try {
        // Assuming deleteStudent takes id
        const { id } = context.params;
        const student = await prisma.student.delete({
            where: {
                id: Number(id),
            },
        })
        return NextResponse.json({ success: true }); // Return a success message or status
    } catch (error) {
        console.error("Error deleting student:", error);
        return NextResponse.json({ message: "Failed to delete student." }, { status: 500 });
    }
});

// Add OPTIONS if you need to handle CORS preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}