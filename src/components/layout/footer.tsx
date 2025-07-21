export function Footer() {
  return (
    <footer className="py-6 border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground mx-auto">
          © {new Date().getFullYear()} Complaint Management System. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
