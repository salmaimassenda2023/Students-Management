import { NextResponse } from 'next/server';
import { protectApi } from '@/utils/middleware'; // Import the new protectApi
import { fetchStudents, createStudent} from "@/services/students"; // Your existing service functions

// Wrap your API handlers with protectApi
export const GET = protectApi(async (req, context) => {
    // 'context.user' will contain the decoded Firebase token here
    try {
        const students = await fetchStudents();
        return NextResponse.json(students);
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ message: "Failed to fetch students." }, { status: 500 });
    }
});

export const POST = protectApi(async (req, context) => {
    // 'context.user' will contain the decoded Firebase token here
    try {
        const body = await req.json();
        const newStudent = await createStudent(body);
        return NextResponse.json(newStudent);
    } catch (error) {
        console.error("Error adding student:", error);
        return NextResponse.json({ message: "Failed to add student." }, { status: 500 });
    }
});

// Add OPTIONS if you need to handle CORS preflight requests for POST/PUT/DELETE
export async function OPTIONS() {
    return NextResponse.json({}, { status: 200 });
}