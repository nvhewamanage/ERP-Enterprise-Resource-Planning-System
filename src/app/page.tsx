import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles the actual auth check on /login and /dashboard/*;
  // this just picks a sane starting point. Logged-out users land on the
  // login form, logged-in users get bounced from /login to /dashboard
  // by middleware.ts.
  redirect("/login");
}