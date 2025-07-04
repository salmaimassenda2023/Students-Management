// services/students.js
import { supabase } from "../supabase/config";

//  CREATE
export const createStudent = async (studentData) => {
  const { data, error } = await supabase
    .from("Students")
    .insert([studentData])
    .select();
  if (error) throw error;
  return data[0];
};

//  READ
export const fetchStudents = async () => {
  const { data, error } = await supabase.from("Students").select("*");
  if (error) throw error;
  return data;
};

//  UPDATE
export const updateStudent = async (id, updatedData) => {
  const { data, error } = await supabase
    .from("Students")
    .update(updatedData)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data[0];
};

//  DELETE
export const deleteStudent = async (id) => {
  const { error } = await supabase.from("Students").delete().eq("id", id);
  if (error) throw error;
};
