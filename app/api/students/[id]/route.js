import { NextResponse } from 'next/server';
import { protectApi } from '@/utils/middleware'; // Import the new protectApi
import { updateStudent, deleteStudent } from "@/services/students"; // Your existing service functions

// Wrap your API handlers with protectApi
export const PUT = protectApi(async (req, context) => {
    // context.params.id will give you the [id] from the URL
    // context.user will contain the decoded Firebase token
    try {
        const body = await req.json();
        const updated = await updateStudent(context.params.id, body);
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating student:", error);
        return NextResponse.json({ message: "Failed to update student." }, { status: 500 });
    }
});

export const DELETE = protectApi(async (req, context) => {
    // context.params.id will give you the [id] from the URL
    // context.user will contain the decoded Firebase token
    try {
        await deleteStudent(context.params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting student:", error);
        return NextResponse.json({ message: "Failed to delete student." }, { status: 500 });
    }
});

// Add OPTIONS if you need to handle CORS preflight requests
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}