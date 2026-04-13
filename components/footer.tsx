import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-border/80 bg-surface">
      <div className="dm-container py-8 sm:py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
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
              <p className="text-sm font-semibold">Explore</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link className="text-muted hover:text-foreground" href="/shops">
                    Shops
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-muted hover:text-foreground"
                    href="/products"
                  >
                    Products
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Company</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    className="text-muted hover:text-foreground"
                    href="/aboutus"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    className="text-muted hover:text-foreground"
                    href="/contactus"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">Legal</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  className="text-muted hover:text-foreground"
                  href="/policies"
                >
                  Policies
                </Link>
              </li>
              <li>
                <Link
                  className="text-muted hover:text-foreground"
                  href="/termsandconditions"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>

            <p className="mt-6 text-sm text-muted">
              Kampala • Uganda • Online
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/80 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
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