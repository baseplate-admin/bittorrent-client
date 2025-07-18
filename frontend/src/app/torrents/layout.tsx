import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SocketProvider from "@/components/socket-provider";
import ActionButtons from "@/components/action-buttons";
import TorrentDetails from "@/components/torrent-details";

export default function TorrentsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <SidebarProvider>
                <AppSidebar />
                <SocketProvider />
                <main className="flex w-full flex-col justify-between gap-4 p-4">
                    <ActionButtons />
                    {children}
                    <TorrentDetails />
                </main>
            </SidebarProvider>
        </>
    );
}
