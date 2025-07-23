import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SocketProvider from "@/components/socket-provider";
import ActionButtons from "@/components/action-button/component";
import TorrentDetails from "@/components/torrent-details/component";

export default function TorrentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex">
            <SidebarProvider>
                <div className="flex-shrink-0">
                    <AppSidebar />
                </div>
                <SocketProvider />
                <main className="flex flex-1 flex-col justify-between gap-4 overflow-auto p-4">
                    <ActionButtons />
                    {children}
                    <TorrentDetails />
                </main>
            </SidebarProvider>
        </div>
    );
}
