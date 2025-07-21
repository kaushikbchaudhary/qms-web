import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ModeToggle from '@/components/ui/mode-toggle'
import {mainNav} from "@/config/navigation";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="font-bold">
            QMS System
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {mainNav.map((navItem:{title:string,href:string}) => (
            <Button key={navItem.title} asChild variant="outline">
              <Link href={navItem.href}>{navItem.title}</Link>
            </Button>
          ))}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
