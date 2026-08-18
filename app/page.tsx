import { redirect } from "next/navigation";

// Authenticated users land on the dashboard; the middleware redirects
// unauthenticated visitors to /login.
export default function RootPage() {
  redirect("/dashboard");
}
