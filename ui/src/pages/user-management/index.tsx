import { redirect } from "react-router-dom";

export async function Loader() {
  return redirect("users");
}
