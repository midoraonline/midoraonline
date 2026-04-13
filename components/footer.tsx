import Link from "next/link";
import Image from "next/image";

const footerLink =
  "inline-block rounded-lg px-2 py-1.5 text-muted transition-colors hover:bg-background hover:text-foreground";

export default function Footer() {
  return (
    <footer className="border-t border-foreground/[0.06] bg-surface/40 backdrop-blur-xl">
      <div className="dm-container py-6 sm:py-8">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <Link href="/" className="mb-3 inline-flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-background">
              <Image
                src="/logo.png"
                alt="Midora Online"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <p className="text-sm font-semibold tracking-tight">Midora Online</p>
            </Link>
            <p className="text-sm text-muted">
              SaaS-as-a-Mall for brand-first discovery across Africa.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-foreground">Explore</p>
              <ul className="mt-3 space-y-1 text-sm">
                <li>
                  <Link href="/shops" className={footerLink}>
                    Shops
                  </Link>
                </li>
                <li>
                  <Link href="/products" className={footerLink}>
                    Products
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Company</p>
              <ul className="mt-3 space-y-1 text-sm">
                <li>
                  <Link href="/aboutus" className={footerLink}>
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contactus" className={footerLink}>
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Legal</p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                <Link href="/policies" className={footerLink}>
                  Policies
                </Link>
              </li>
              <li>
                <Link href="/termsandconditions" className={footerLink}>
                  Terms & Conditions
                </Link>
              </li>
            </ul>

            <p className="mt-6 text-sm text-muted">Kampala • Uganda • Online</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border/80 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Midora Online. All rights reserved.</p>
          <p>
            Rent a shop for{" "}
            <span className="font-semibold text-foreground">5,000 UGX/month</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
