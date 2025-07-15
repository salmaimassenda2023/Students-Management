// app/api/students/route.js
import prisma from '../../../utils/prisma'
import { NextResponse } from 'next/server';
import { protectApi } from '@/utils/middleware';

export const GET = protectApi([])(async () => { // <-- Corrected: Pass [] for roles
    // 'context.user' will contain the decoded Firebase token here
    try {
        const students = await prisma.student.findMany({})
        return NextResponse.json(students);
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ message: "Failed to fetch students." }, { status: 500 });
    }
});

export const POST = protectApi([])(async (req, context) => { // <-- Corrected: Pass [] for roles
    // 'context.user' will contain the decoded Firebase token here
    try {
        const body = await req.json();
        const { name, email, phone_number, gender } = body;
        const newStudent = await prisma.student.create({
            data: {
                name: name,
                email: email,
                phone_number: phone_number,
                gender: gender,
            },
        })
        return NextResponse.json(newStudent);
    } catch (error) {
        console.error("Error adding student:", error);
        return NextResponse.json({ message: "Failed to add student." }, { status: 500 });
    }
});

