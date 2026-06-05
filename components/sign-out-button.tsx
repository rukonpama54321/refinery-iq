// Posts to the sign-out route. A form (not a client handler) keeps it working
// without the browser Supabase client.
export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        style={{
          padding: "9px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-dim)",
          background: "var(--glass-2)", border: "1px solid var(--border-2)",
          borderRadius: "var(--r-md)", cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </form>
  );
}
