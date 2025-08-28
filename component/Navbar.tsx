import Link from "next/link";
import Image from "next/image";
import logo from '@/img/logo_kievit.svg';
import NotificationBell from '@/component/dashboard/notification';

// ⬇️ tambah import ini
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/component/ui/sheet";
import { Button } from "@/component/ui/button";
import { Menu } from "lucide-react";
import Sidebar from "@/component/sidebar";

const Navbar = () => {
  return (
    <div className="bg-card text-gray-800 py-2 px-4 md:px-5 sticky top-0 z-50 border-b">
      <div className="mx-auto flex items-center justify-between gap-3">
        {/* Kiri: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-2">
          {/* Hamburger hanya tampil di mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 [&>button]:!text-white">
              <SheetHeader className="px-4 py-3 text-white">
                <SheetTitle> </SheetTitle>
              </SheetHeader>
              <div className="h-[calc(100vh-56px)] overflow-y-auto px-2">
                <Sidebar />
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex-shrink-0">
            <Image src={logo} alt="Kievit" width={100} className="w-16 md:w-[100px] h-auto" sizes="(max-width: 768px) 64px, 100px" />
          </Link>
        </div>

        {/* Tengah: Title (responsif & truncate biar gak tumpah di HP) */}
        <h1 className="text-sm sm:text-xl md:text-3xl font-black text-center flex-1 truncate">
          Kievit WWTP Monitoring
        </h1>

        {/* Kanan: Bell Icon */}
        <div className="flex-shrink-0">
          <NotificationBell />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
